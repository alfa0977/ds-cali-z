# DS-Cali Developer Customization Guide

This document explains **every file** in the project, **what it does**, **where to make changes**, and **what options you have**. Use this as your reference when customizing the app.

---

## Table of Contents

1. [Project Architecture](#1-project-architecture)
2. [Configuration Files](#2-configuration-files)
3. [Core Library (`src/lib/`)](#3-core-library-srclib)
4. [AI Engines (Multi-Engine System)](#4-ai-engines-multi-engine-system)
5. [Subscription / Free vs Premium](#5-subscription--free-vs-premium)
6. [Authentication](#6-authentication)
7. [React Components (`src/components/`)](#7-react-components-srccomponents)
8. [Feature Components (`src/features/`)](#8-feature-components-srcfeatures)
9. [API Routes (`src/app/api/`)](#9-api-routes-srcappapi)
10. [Pages & Layout (`src/app/`)](#10-pages--layout-srcapp)
11. [Database & Prisma](#11-database--prisma)
12. [Android APK Build](#12-android-apk-build)
13. [Mini-Services](#13-mini-services)
14. [Color Palettes](#14-color-palettes)
15. [Common Customization Tasks](#15-common-customization-tasks)

---

## 1. Project Architecture

DS-Cali is a **Next.js 16** app that runs in **two modes**:

| Mode | Where | Data Source | Camera | Notifications |
|------|-------|-------------|--------|----------------|
| **Web (dev server)** | Browser at `localhost:3000` | Prisma API routes (`/api/*`) | `getUserMedia` (live preview) | Web Notification API |
| **Static (APK)** | Capacitor WebView | IndexedDB (`src/lib/client-db.ts`) | `@capacitor/camera` plugin (native UI) | `@capacitor/local-notifications` |

The mode is detected by `isStaticMode()` in `src/lib/env.ts` and `isNativePlatform()` in `src/lib/native-bridge.ts`.

### How data flows

```
User taps a button
    ↓
React component (src/features/*)
    ↓
React Query hook (src/lib/hooks.ts)
    ↓
isStaticMode() check
    ├── true (APK) → client-db.ts (IndexedDB)
    └── false (web) → fetch("/api/*") → API route → Prisma → SQLite
```

### How AI analysis flows

```
User takes a photo in scanner
    ↓
useAnalyzeMeal hook (src/lib/hooks.ts)
    ↓
isStaticMode() check
    ├── true (APK) → client-db.ts analyzeMeal() → ai-engines/index.ts
    └── false (web) → fetch("/api/analyzeMeal") → ai-engine/index.ts (z-ai VLM)
    ↓
ai-engines/index.ts: analyzeMealWithEngine(image, settings)
    ↓
Get engine from localStorage (getAiSettings())
    ↓
Engine selection:
    ├── "heuristic" → offline pattern matching
    ├── "openai"    → fetch api.openai.com (user's API key)
    ├── "gemini"    → fetch generativelanguage.googleapis.com (user's API key)
    └── "remote"    → fetch user's Z-AI service URL
    ↓
If engine fails → fallback to heuristic
```

---

## 2. Configuration Files

### `capacitor.config.ts`
**What it does:** Configures the Capacitor Android wrapper.
**Customize:**
- `appId`: The Android package ID (e.g., `app.dscali`).
- `appName`: The app name shown on the home screen.
- `webDir`: Where the built static files are (must be `"out"` for Next.js static export).
- `androidScheme`: Use `"https"` so `localStorage` and `getUserMedia` work in the WebView.
- `plugins`: Camera + LocalNotifications config.

### `next.config.ts`
**What it does:** Next.js configuration.
- When `BUILD_STATIC=1` env var is set, uses `output: "export"` (for APK).
- Otherwise uses `output: "standalone"` (for web server).

### `package.json`
**Scripts:**
- `bun run dev` — start dev server on port 3000
- `bun run lint` — run ESLint
- `bun run db:push` — push Prisma schema to SQLite
- `BUILD_STATIC=1 bun run build` — build static export for APK

---

## 3. Core Library (`src/lib/`)

### `src/lib/env.ts`
**What it does:** Detects whether the app is running inside a Capacitor APK (static mode) or a web browser.
**How it works:** Checks `window.Capacitor.isNativePlatform()` + protocol fallbacks.

### `src/lib/native-bridge.ts`
**Key exports:**
- `isNativePlatform()` — synchronous check for Capacitor
- `takeNativePhoto()` — opens native camera (Capacitor) or `<input capture>` (web)
- `pickNativeImage()` — opens gallery
- `requestNativeCameraPermission()` — requests CAMERA permission
- `requestNativeNotificationPermission()` — requests POST_NOTIFICATIONS permission
- `showNativeNotification(title, body)` — shows a notification
- `registerBackButtonHandler(cb)` — handles Android hardware back button

**How to add a new native plugin:** Add a new function that uses `tryImport("@capacitor/plugin-name")`.

### `src/lib/hooks.ts`
**What it does:** All React Query hooks for data fetching and mutations.
**How to add a new hook:** Add a `useXxx()` function that checks `isStaticMode()` and routes to either `clientDB.*` or `fetch("/api/xxx")`.

### `src/lib/client-db.ts`
**What it does:** IndexedDB-based database for offline APK mode.
**How to add a new "table":** Add a new object store in `getDB()` `upgrade()` function, bump `DB_VERSION`.
**The `analyzeMeal(image)` function delegates to `src/lib/ai-engines/index.ts`.**

### `src/lib/store.ts`
**What it does:** Zustand store for global UI state (active tab, open modal, selected date, editing log, quick-log payload).
**All modal types:** Defined in `ModalKey` — add new modals here, render them in `src/app/page.tsx`.

### `src/lib/i18n.tsx`
**What it does:** Internationalization (Persian default, English optional).
**How to add a translation key:** Add it to the `translations` object with `fa` and `en` values.
**How to add a language:** Add a new `Locale` type, add translations, update the `setLocale` function.

### `src/lib/theme-color.tsx`
**What it does:** 12 color palettes (Orange, Green, Purple, Rose, Teal, Sunset, Ocean, Forest, Candy, Amber, Crimson, Monochrome).
**How to add a palette:** Add it to `PALETTES` and `THEME_COLOR_OPTIONS`.
**How to change the default:** Change `useState<ThemeColorKey>("orange")`.
**Colors are CSS variables:** `--streak`, `--protein`, `--carbs`, `--fats`, `--success`, `--water`.

### `src/lib/notifications.ts`
**What it does:** Notification utility that delegates to `native-bridge`.

### `src/lib/date-utils.ts`
**What it does:** Persian (Shamsi) date formatting using `jalaali-js`.

### `src/lib/food-translations.ts`
**What it does:** Translates food names between English and Persian.

---

## 4. AI Engines (Multi-Engine System)

### `src/lib/ai-engines/index.ts`
**What it does:** Multi-engine AI meal analysis. Supports 4 engines with automatic fallback.

**Engines:**

| Key | Label | Requires API Key | Requires URL | How it works |
|-----|-------|-----------------|--------------|--------------|
| `heuristic` | Heuristic (offline) | No | No | Pattern-matches sample meal URLs; returns generic estimate for others |
| `openai` | OpenAI Vision (GPT-4o) | Yes (OpenAI key) | No | Calls `api.openai.com/v1/chat/completions` with image |
| `gemini` | Google Gemini | Yes (Gemini key) | No | Calls `generativelanguage.googleapis.com` with image |
| `remote` | Remote Z-AI service | No | Yes | Calls a user-configured server URL |

**Key functions:**
- `getAiSettings()` / `saveAiSettings()` — read/write engine config from `localStorage` (`ds-cali-ai-settings`)
- `analyzeMealWithEngine(image, settings?)` — main entry point; tries the configured engine, falls back to heuristic on failure
- `AI_ENGINES` — array of engine configs (label, description, icon, requirements)

**How to add a new engine:**
1. Add a new `AiEngineKey` to the type
2. Add an `AiEngineConfig` to `AI_ENGINES`
3. Add an `analyzeXxx(image, ...args)` function
4. Add a `case` in `analyzeMealWithEngine`
5. Add UI in `src/features/settings/developer-sheet.tsx`

**Settings UI:** `src/features/settings/developer-sheet.tsx` — select engine, enter API key/URL.

### `mini-services/ai-vlm-service/`
**What it does:** A small Bun server that wraps the `z-ai-web-dev-sdk` VLM for the "remote" engine.
**How to use:**
1. `cd mini-services/ai-vlm-service && bun install`
2. `bun run dev` (starts on port 3031)
3. In the app's Developer Settings, select "Remote Z-AI service" and set URL to `/api/analyze?XTransformPort=3031`
4. For production, deploy this service to a public server and use the full URL.

---

## 5. Subscription / Free vs Premium

### `src/lib/subscription.ts`
**What it does:** Controls free vs premium feature flags.

**Feature flags:**

| Feature | Free | Premium |
|---------|------|---------|
| `maxAiScansPerDay` | 5 | -1 (unlimited) |
| `maxFoodLogsPerDay` | -1 (unlimited) | -1 (unlimited) |
| `advancedAnalytics` | false | true |
| `customThemes` | false (only orange + green) | true (all 12 palettes) |
| `exportData` | true | true |
| `challenges` | true | true |
| `mealPlanning` | false | true |

**Key functions:**
- `getSubscriptionConfig()` — returns current config
- `getSubscriptionTier()` — returns `"free"` or `"premium"`
- `saveSubscriptionTier(tier, trialDays)` — sets tier with optional trial
- `startPremiumTrial(days)` — starts a premium trial (default 7 days)
- `cancelPremium()` — reverts to free
- `canScanMealAsync()` — checks daily AI scan limit (async, reads IndexedDB in APK)
- `getTodaysAiScanCount()` — counts today's scans

**How to customize free vs premium:**
1. Edit `FREE_TIER` and `PREMIUM_TIER` constants in `src/lib/subscription.ts`
2. Change `maxAiScansPerDay`, `advancedAnalytics`, `customThemes`, etc.
3. Components read these flags via `getSubscriptionConfig()` — gate features with `if (config.advancedAnalytics)` etc.

**Storage:** `localStorage` key `ds-cali-subscription` (JSON: `{ tier, trialEndDate }`).
**Trial expiry:** If `trialEndDate < now`, auto-reverts to free on next `getSubscriptionConfig()` call.

### How to change what free users can do

Edit `FREE_TIER` in `src/lib/subscription.ts`:
```typescript
const FREE_TIER: SubscriptionConfig = {
  tier: "free",
  maxAiScansPerDay: 3,        // Change from 5 to 3
  maxFoodLogsPerDay: 20,      // Limit food logs
  advancedAnalytics: false,
  customThemes: false,
  exportData: false,          // Disable export for free
  challenges: true,
  mealPlanning: false,
};
```

### How to gate a feature by subscription

In any component:
```typescript
import { getSubscriptionConfig } from "@/lib/subscription";

function MyComponent() {
  const config = getSubscriptionConfig();
  if (!config.advancedAnalytics) {
    return <PremiumLock />;
  }
  return <AdvancedAnalytics />;
}
```

---

## 6. Authentication

### `src/features/auth/login-screen.tsx`
**What it does:** Login UI with 3 options:
1. **Google** — mock that saves a fake Google user + starts 7-day premium trial
2. **Phone** — 2-step phone verification (enter phone → enter code "1234" → logged in)
3. **Guest** — enter name only

**Storage:** `localStorage` key `ds-cali-auth-user` (JSON: `{ id, name, email, phone, photoUrl, provider }`).

**Key exports:**
- `LoginScreen` — the UI component
- `getAuthUser()` — returns saved user or null
- `clearAuthUser()` — logs out (removes from localStorage)

**How to enable real Google Sign-In:**
1. Install: `bun add @capacitor-community/google-sign-in`
2. Configure OAuth client ID in Google Cloud Console
3. Add client ID to `android/app/src/main/AndroidManifest.xml`
4. Replace the mock `loginWithGoogle()` function with:
   ```typescript
   const result = await GoogleSignIn.signIn();
   const user = { id: result.userId, name: result.displayName, email: result.email, ... };
   saveAuthUser(user);
   ```

**How to enable real phone auth (Firebase):**
1. Install: `bun add firebase`
2. Set up Firebase project with Phone Authentication
3. Add `google-services.json` to `android/app/`
4. Replace the mock `sendCode()` and `verifyCode()` functions with Firebase's `signInWithPhoneNumber`.

---

## 7. React Components (`src/components/`)

### `src/components/back-button-handler.tsx`
**Behavior:** modal-close → tab-switch → double-press-to-exit (2.5s window with toast).

### `src/components/sonner.tsx`
**Toast config:** `duration={3500}`, `closeButton`, `richColors`.

### `src/components/top-bar.tsx` / `bottom-nav.tsx` / `logo.tsx`
Header, navigation, and logo.

### `src/components/ui/*`
Standard shadcn/ui components.

---

## 8. Feature Components (`src/features/`)

### Dashboard (`src/features/dashboard/`)
| File | What it does |
|------|-------------|
| `home-dashboard.tsx` | Main home page layout |
| `goal-celebration.tsx` | Popup when goals hit (auto-dismiss after 4s, tap to dismiss) |
| `nutrition-insights.tsx` | AI-style insights |
| `macro-ratio-card.tsx` | Donut chart |
| `meal-suggestions.tsx` | Smart suggestions (opens QuickLogSheet) |
| `recents-section.tsx` | Recent foods (opens QuickLogSheet) |
| `favorites-quick-add.tsx` | Favorites (opens QuickLogSheet) |

### Scanner (`src/features/scanner/`)
| File | What it does |
|------|-------------|
| `scanner-sheet.tsx` | Meal camera scanner (native camera on APK, getUserMedia on web) |
| `barcode-scanner-sheet.tsx` | Barcode scanner |
| `quick-log-sheet.tsx` | Confirmation modal for preset meals |
| `add-workout-sheet.tsx` | Workout logger |

### Settings (`src/features/settings/`)
| File | What it does |
|------|-------------|
| `settings-screen.tsx` | Settings page with Account + Developer sections |
| `developer-sheet.tsx` | **AI engine config + subscription tier toggle + data management** |
| `reminders-sheet.tsx` | Editable reminder times |
| `theme-color-sheet.tsx` | 12 palette selector |
| `privacy-data-sheet.tsx` | Privacy info + clear data |

### Auth (`src/features/auth/`)
| File | What it does |
|------|-------------|
| `login-screen.tsx` | Google / Phone / Guest login |

---

## 9. API Routes (`src/app/api/`)

These only work in **web mode**. In APK mode, `client-db.ts` replaces them.

| Route | Method | What it does |
|-------|--------|-------------|
| `/api/getUserDashboard` | GET | Returns all dashboard data |
| `/api/analyzeMeal` | POST | VLM meal analysis (server-side z-ai SDK) |
| `/api/logMeal` | POST | Log a scanned meal |
| `/api/logFood` | POST | Log a food from the database |
| `/api/logWater` | POST | Log water intake |
| `/api/logWorkout` | POST | Log a workout |
| `/api/updateUser` | PATCH | Update profile/goals |
| `/api/onboard` | POST | Complete onboarding |
| `/api/searchFoods` | GET | Search foods |
| `/api/favorites` | GET/POST/DELETE | Manage favorites |
| `/api/challenges` | GET/POST/PATCH | Gamification |
| `/api/lookupBarcode` | GET | Open Food Facts lookup |
| `/api/exportData` | GET | Export JSON/CSV |

---

## 10. Pages & Layout (`src/app/`)

### `src/app/page.tsx`
Renders the app. All modals are rendered here via `AnimatePresence`.

### `src/app/layout.tsx`
Root layout with providers (Theme, ThemeColor, I18n, QueryClient) + fonts.

---

## 11. Database & Prisma

### `prisma/schema.prisma`
Models: User, Food, Meal, Log, HealthDaily, Favorite, Challenge.

### `src/lib/seed-data.ts`
**93+ Persian foods** including 20 new ones (Gheimeh Bademjan, Khoresh Karafs, Zereshk Polo Morgh, Adas Polo, Loobia Polo, Albaloo Polo, Kabab Barg, Kabab Joojeh, Mahi Sefid, Ghalieh Mahi, Kookoo Sib Zamini, Halim Haleb, Omelet Irani, etc.)

**How to add a food:** Add to `STARTER_FOODS` or `PERSIAN_FOODS` arrays with format:
`[name, serving, weight(g), cal, pro, carb, fat, category, emoji, density, barcode?]`

---

## 12. Android APK Build

### `build-apk.sh`
1. Install dependencies + Capacitor plugins
2. Build static export
3. Add Android platform
4. Patch AndroidManifest.xml with permissions
5. `cap copy` + `cap sync`
6. `gradlew assembleDebug`

### `instructions/AndroidManifest.template.xml`
Template manifest with CAMERA, POST_NOTIFICATIONS, INTERNET, storage permissions.

---

## 13. Mini-Services

### `mini-services/ai-vlm-service/`
Bun server that wraps z-ai-web-dev-sdk VLM for the "remote" AI engine.
- Port: 3031
- Endpoint: POST `/` with `{ image: "<data-url>" }`
- Returns: `{ ingredients, macros, healthScore, mealTitle, detectedCategory }`

---

## 14. Color Palettes

### `src/lib/theme-color.tsx`

**12 palettes available:**

| Key | Name (fa/en) | Streak color | Use case |
|-----|-------------|-------------|----------|
| `orange` | نارنجی / Orange | #FF9500 | Default, energetic |
| `green` | سبز / Green | #34C759 | Health, nature |
| `purple` | بنفش / Purple | #8b5cf6 | Creative, calm |
| `rose` | گل‌بهی / Rose | #f43f5e | Feminine, warm |
| `teal` | فیروزه‌ای / Teal | #14b8a6 | Fresh, modern |
| `sunset` | غروب / Sunset | #f97316 | Warm, vibrant |
| `ocean` | اقیانوس / Ocean | #0ea5e9 | Cool, professional |
| `forest` | جنگل / Forest | #16a34a | Natural, grounded |
| `candy` | آبنبات / Candy | #ec4899 | Playful, fun |
| `amber` | کهربایی / Amber | #f59e0b | Warm, autumn |
| `crimson` | زرشکی / Crimson | #dc2626 | Bold, dramatic |
| `monochrome` | تک‌رنگ / Monochrome | #404040 | Minimal, clean |

**How to add a custom palette:**
1. Add a new key to `ThemeColorKey` type
2. Add the palette to `PALETTES` (6 colors: `streak`, `protein`, `carbs`, `fats`, `success`, `water`)
3. Add it to `THEME_COLOR_OPTIONS` (key, labelFa, labelEn, swatch)
4. Optionally gate it behind premium in `theme-color-sheet.tsx`

**How to change the default palette:**
Change `useState<ThemeColorKey>("orange")` to your preferred default.

**CSS variables explained:**
- `--streak` — primary accent (calories, streaks, main buttons)
- `--protein` — protein-related UI (red/pink tones)
- `--carbs` — carbs-related UI (yellow/orange tones)
- `--fats` — fat-related UI (blue/purple tones)
- `--success` — success states, goals hit (green)
- `--water` — water-related UI (blue tones)

---

## 15. Common Customization Tasks

### How to change the app name
1. `capacitor.config.ts` → `appName`
2. `instructions/AndroidManifest.template.xml` → `<string name="app_name">`
3. `src/lib/i18n.tsx` → `appName` key
4. `src/app/layout.tsx` → `metadata.title`

### How to add a new AI engine
1. `src/lib/ai-engines/index.ts` → add `AiEngineKey`, `AiEngineConfig`, `analyzeXxx()`, and a `case` in `analyzeMealWithEngine`
2. `src/features/settings/developer-sheet.tsx` → add API key/URL input if needed

### How to change free vs premium limits
1. `src/lib/subscription.ts` → edit `FREE_TIER` and `PREMIUM_TIER`
2. Gate features in components with `getSubscriptionConfig()`

### How to change the daily AI scan limit
`src/lib/subscription.ts` → `FREE_TIER.maxAiScansPerDay` (set to `-1` for unlimited)

### How to change the premium trial duration
`src/lib/subscription.ts` → `startPremiumTrial(days)` — default 7 days

### How to add a new food to the database
`src/lib/seed-data.ts` → add to `STARTER_FOODS` or `PERSIAN_FOODS`

### How to add a new language
1. `src/lib/i18n.tsx` → add `Locale` type + translations
2. `src/features/settings/language-sheet.tsx` → add the option

### How to add a new color palette
1. `src/lib/theme-color.tsx` → add to `PALETTES` + `THEME_COLOR_OPTIONS`
2. Optionally gate behind premium in `theme-color-sheet.tsx`

### How to add a new settings row
1. `src/features/settings/settings-screen.tsx` → add a `<Row>`
2. `src/lib/store.ts` → add `ModalKey`
3. `src/app/page.tsx` → render the sheet
4. Create the sheet component

### How to change the back button behavior
`src/components/back-button-handler.tsx` → edit the callback

### How to change toast duration
`src/components/ui/sonner.tsx` → `duration={3500}` (milliseconds)

### How to change the goal celebration popup
`src/features/dashboard/goal-celebration.tsx`:
- `AUTO_DISMISS_MS` (default 4000) — how long it stays
- Edit the `possible` array to add/remove celebration types

### How to enable real Google Sign-In
1. Install `@capacitor-community/google-sign-in`
2. Configure OAuth client ID in Google Cloud Console
3. Add client ID to AndroidManifest
4. Replace mock in `src/features/auth/login-screen.tsx` → `loginWithGoogle()`

### How to enable real phone authentication
1. Set up Firebase Auth with phone authentication
2. Add `google-services.json` to `android/app/`
3. Replace mocks in `src/features/auth/login-screen.tsx` → `sendCode()` + `verifyCode()`

### How to add a new Capacitor plugin
1. `bun add @capacitor/<plugin-name>`
2. `src/lib/native-bridge.ts` → add wrapper using `tryImport("@capacitor/<plugin-name>")`
3. `build-apk.sh` → add the package to the `bun add` line
4. `instructions/AndroidManifest.template.xml` → add required permissions

### How to deploy the AI VLM service
1. Deploy `mini-services/ai-vlm-service/` to a server (e.g., Vercel, Railway, fly.io)
2. In the app's Developer Settings, set "Remote Service URL" to the deployed URL
3. Select "Remote Z-AI service" as the engine
