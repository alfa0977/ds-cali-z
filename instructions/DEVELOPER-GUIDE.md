# DS-Cali Developer Customization Guide

This document explains **every file** in the project, **what it does**, **where to make changes**, and **what options you have**. Use this as your reference when customizing the app.

---

## Table of Contents

1. [Project Architecture](#1-project-architecture)
2. [Configuration Files](#2-configuration-files)
3. [Core Library (`src/lib/`)](#3-core-library-srclib)
4. [React Components (`src/components/`)](#4-react-components-srccomponents)
5. [Feature Components (`src/features/`)](#5-feature-components-srcfeatures)
6. [API Routes (`src/app/api/`)](#6-api-routes-srcappapi)
7. [Pages & Layout (`src/app/`)](#7-pages--layout-srcapp)
8. [Database & Prisma](#8-database--prisma)
9. [Android APK Build](#9-android-apk-build)
10. [Common Customization Tasks](#10-common-customization-tasks)

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

---

## 2. Configuration Files

### `capacitor.config.ts`
**What it does:** Configures the Capacitor Android wrapper.
**Customize:**
- `appId`: The Android package ID (e.g., `app.dscali`). Must match `applicationId` in `android/app/build.gradle`.
- `appName`: The app name shown on the home screen.
- `webDir`: Where the built static files are (must be `"out"` for Next.js static export).
- `androidScheme`: Use `"https"` so `localStorage` and `getUserMedia` work in the WebView.
- `plugins`: Camera + LocalNotifications config.

### `next.config.ts`
**What it does:** Next.js configuration.
**Customize:**
- When `BUILD_STATIC=1` env var is set, uses `output: "export"` (for APK).
- Otherwise uses `output: "standalone"` (for web server).
- `trailingSlash: true` — important for Capacitor (file URLs need trailing slashes).

### `package.json`
**What it does:** Dependencies and scripts.
**Scripts:**
- `bun run dev` — start dev server on port 3000
- `bun run lint` — run ESLint
- `bun run db:push` — push Prisma schema to SQLite
- `BUILD_STATIC=1 bun run build` — build static export for APK

---

## 3. Core Library (`src/lib/`)

### `src/lib/env.ts`
**What it does:** Detects whether the app is running inside a Capacitor APK (static mode) or a web browser.
**How it works:** Checks `window.Capacitor.isNativePlatform()` (injected by Capacitor at runtime) + protocol fallbacks.
**Customize:** You normally don't need to change this. If you add a new native platform, add its detection here.

### `src/lib/native-bridge.ts`
**What it does:** Wraps Capacitor plugins so they're safe to import on web (graceful no-ops).
**Key exports:**
- `isNativePlatform()` — synchronous check for Capacitor
- `takeNativePhoto()` — opens native camera (Capacitor) or `<input capture>` (web)
- `pickNativeImage()` — opens gallery
- `requestNativeCameraPermission()` — requests CAMERA permission
- `requestNativeNotificationPermission()` — requests POST_NOTIFICATIONS permission
- `showNativeNotification(title, body)` — shows a notification
- `registerBackButtonHandler(cb)` — handles Android hardware back button

**How to customize:**
- To add a new native plugin (e.g., `@capacitor/geolocation`), add a new function here that uses `tryImport("@capacitor/geolocation")`.
- The `tryImport` uses `new Function("m", "return import(m)")` so webpack doesn't try to resolve the module at build time (the package isn't installed on web).

### `src/lib/hooks.ts`
**What it does:** All React Query hooks for data fetching and mutations.
**How to customize:**
- To add a new data query: add a `useXxx()` function that checks `isStaticMode()` and routes to either `clientDB.*` or `fetch("/api/xxx")`.
- To add a new mutation: add a `useXxxMutation()` function with the same pattern.
- Toast messages are defined here (`onSuccess`, `onError`).

### `src/lib/client-db.ts`
**What it does:** IndexedDB-based database for offline APK mode. Mirrors the Prisma schema.
**How to customize:**
- To add a new "table": add a new object store in the `getDB()` `upgrade()` function, then bump `DB_VERSION`.
- To add a new function: follow the pattern of existing functions (e.g., `logMeal`, `getDashboard`).
- The `analyzeMeal(image)` function is a **heuristic** that recognizes the 4 sample meals by URL. For real AI analysis, you need a backend server.

### `src/lib/store.ts`
**What it does:** Zustand store for global UI state (active tab, open modal, selected date, editing log, quick-log payload).
**How to customize:**
- To add a new modal type: add it to `ModalKey`, then render it in `src/app/page.tsx`.
- To add new global state: add the field + setter to `AppState` and the `create()` call.

### `src/lib/i18n.tsx`
**What it does:** Internationalization (Persian default, English optional).
**How to customize:**
- To add a new translation key: add it to the `translations` object with `fa` and `en` values.
- To add a new language: add a new `Locale` type, add translations, update the `setLocale` function.
- Locale is persisted to `localStorage` under `ds-cali-locale`.
- The `useState` initializer reads `localStorage` synchronously (no flash on restart).

### `src/lib/theme-color.tsx`
**What it does:** 5 color palettes (Orange, Green, Purple, Rose, Teal).
**How to customize:**
- To add a new palette: add it to `PALETTES` and `THEME_COLOR_OPTIONS`.
- To change the default: change `useState<ThemeColorKey>("orange")`.
- Colors are applied as CSS variables (`--streak`, `--protein`, `--carbs`, `--fats`, `--success`, `--water`).
- Persisted to `localStorage` under `ds-cali-theme-color`.

### `src/lib/notifications.ts`
**What it does:** Notification utility that delegates to `native-bridge`.
**How to customize:**
- `scheduleNotification(time, title, body)` — schedules a notification for a specific time.
- To add scheduled reminder delivery: call this in the reminders sheet's `save()` function.

### `src/lib/hooks.ts` → `uploadMealImage(image)`
**What it does:** In web mode, uploads to `/api/uploadImage` (saves to `/download/meal-images/`). In APK mode, returns the data URL as-is (stored in IndexedDB).

### `src/lib/ai-engine/index.ts`
**What it does:** Server-only module wrapping `z-ai-web-dev-sdk` VLM for meal analysis.
**IMPORTANT:** This file has `import "server-only"` at the top — it CANNOT be imported from client code. It's only used by `/api/analyzeMeal`.
**How to customize:**
- To change the AI prompt: edit `PROMPT_TEMPLATE`.
- To add new ingredient categories: add them to `CATEGORY_MACROS`.

### `src/lib/date-utils.ts`
**What it does:** Persian (Shamsi) date formatting using `jalaali-js`.
**How to customize:**
- `formatDate(date, locale, opts)` — formats dates in Persian or English.
- `formatNumber(n, locale)` — converts digits to Persian numerals.
- `getWeekdayShort(date, locale)` — returns weekday abbreviation.

### `src/lib/food-translations.ts`
**What it does:** Translates food names between English and Persian.
**How to customize:** Add new food name mappings to the dictionary object.

### `src/lib/auth.ts`
**What it does:** Server-side `ensureDemoUser()` — creates/returns a demo user for the web API.
**How to customize:** To add real authentication (NextAuth.js), replace this with session-based logic.

### `src/lib/db.ts`
**What it does:** Prisma client singleton.
**Customize:** Don't change unless you switch databases.

---

## 4. React Components (`src/components/`)

### `src/components/back-button-handler.tsx`
**What it does:** Handles Android hardware back button.
**Behavior:**
1. If a modal is open → close it
2. Else if not on Home tab → switch to Home
3. Else (on Home, no modal): first press → toast "Press back again to exit"; second press within 2.5s → exit app

**How to customize:**
- To change the exit-confirmation window: edit `EXIT_PRESS_WINDOW_MS`.
- To change the toast message: edit the `pressBackAgainToExit` translation key in `i18n.tsx`.

### `src/components/sonner.tsx`
**What it does:** Toast notification configuration.
**How to customize:**
- `duration={3500}` — how long toasts stay (3.5 seconds)
- `closeButton` — shows X button on each toast
- `richColors` — success=green, error=red
- To disable auto-dismiss: set `duration={Infinity}`

### `src/components/top-bar.tsx`
**What it does:** Top header with logo, app name, theme toggle.
### `src/components/bottom-nav.tsx`
**What it does:** Bottom tab bar (Home, Progress, +, Settings).
### `src/components/theme-toggle.tsx`
**What it does:** Cycles through light → dark → system themes.
### `src/components/logo.tsx`
**What it does:** The DS-Cali logo (gradient square with stylized "D").

### `src/components/ui/*`
**What it does:** shadcn/ui component library (Button, Input, Sheet, etc.).
**How to customize:** These are standard shadcn components. See https://ui.shadcn.com for docs.

---

## 5. Feature Components (`src/features/`)

### Dashboard (`src/features/dashboard/`)
| File | What it does | Customize |
|------|-------------|-----------|
| `home-dashboard.tsx` | Main home page layout (calories hero, macros, charts, lists) | Rearrange sections, add/remove cards |
| `goal-celebration.tsx` | Popup celebration when goals are hit | Edit `AUTO_DISMISS_MS` (default 4000ms). Tap to dismiss early. |
| `nutrition-insights.tsx` | AI-style insights ("Protein up this week", etc.) | Add new insight types |
| `macro-ratio-card.tsx` | Donut chart of macro split | Change colors via CSS variables |
| `nutrition-timeline.tsx` | Hourly intake timeline | Change hour range |
| `meal-suggestions.tsx` | Smart suggestions carousel | Tapping opens QuickLogSheet (not auto-log) |
| `recents-section.tsx` | Recent foods carousel | Tapping opens QuickLogSheet |
| `favorites-quick-add.tsx` | Favorites carousel | Tapping opens QuickLogSheet |
| `weekly-calendar.tsx` | 7-day calendar strip | Change start-of-week |
| `add-action-sheet.tsx` | The "+" menu (scan, barcode, food DB, workout) | Add new action types |
| `favorites-sheet.tsx` | Full favorites list | — |

### Scanner (`src/features/scanner/`)
| File | What it does | Customize |
|------|-------------|-----------|
| `scanner-sheet.tsx` | Meal camera scanner | **Camera logic**: on native (APK) shows "Tap to open camera" → calls `@capacitor/camera`. On web shows live `getUserMedia` preview. Retry button increments `retryCount` to force effect re-run. |
| `barcode-scanner-sheet.tsx` | Barcode scanner using `@zxing/browser` | Falls back to still-photo decode if live camera fails |
| `quick-log-sheet.tsx` | Confirmation modal for preset meals (servings/slot/time) | Add/remove fields |
| `add-workout-sheet.tsx` | Workout logger | Add workout types to `TYPES` array |
| `meal-detail-sheet.tsx` | Meal detail viewer | — |
| `edit-log-sheet.tsx` | Edit/delete log entries | — |

### Progress (`src/features/progress/`)
| File | What it does |
|------|-------------|
| `progress-dashboard.tsx` | Progress page (charts, history) |
| `challenges-sheet.tsx` | Gamification challenges |
| `streak-statistics.tsx` | Streak display |
| `achievements-section.tsx` | Achievement badges |
| `workout-history.tsx` | Workout history list |
| `water-chart.tsx` | Water intake chart |

### Settings (`src/features/settings/`)
| File | What it does | Customize |
|------|-------------|-----------|
| `settings-screen.tsx` | Settings page | Add/remove rows |
| `edit-sheets.tsx` | Edit profile + edit goals sheets | Add new fields |
| `reminders-sheet.tsx` | Notification reminders | **Times are editable** via `<input type="time">` + ±15min chevrons. Persisted to `localStorage` under `ds-cali-reminders-v2`. |
| `share-sheet.tsx` | Share progress | — |
| `language-sheet.tsx` | Language selector (fa/en) | Add languages in `i18n.tsx` |
| `theme-color-sheet.tsx` | Color palette selector | Add palettes in `theme-color.tsx` |
| `privacy-data-sheet.tsx` | Privacy info + clear data | — |
| `user-management-sheet.tsx` | User switcher | — |

### Food Database (`src/features/food-database/`)
| File | What it does |
|------|-------------|
| `food-database-sheet.tsx` | Searchable food database with category filters |
| `create-food-sheet.tsx` | Create custom food |

### Onboarding (`src/features/onboarding/`)
| File | What it does |
|------|-------------|
| `onboarding-flow.tsx` | 4-step welcome wizard (name → about → activity → goal) |

### Paywall (`src/features/paywall/`)
| File | What it does |
|------|-------------|
| `paywall-sheet.tsx` | Premium subscription UI (not functional in APK) |

---

## 6. API Routes (`src/app/api/`)

These only work in **web mode** (not APK). In APK mode, `client-db.ts` replaces them.

| Route | Method | What it does |
|-------|--------|-------------|
| `/api/getUserDashboard` | GET | Returns all dashboard data |
| `/api/analyzeMeal` | POST | VLM meal analysis (server-only) |
| `/api/logMeal` | POST | Log a scanned meal |
| `/api/logFood` | POST | Log a food from the database |
| `/api/logWater` | POST | Log water intake |
| `/api/logWorkout` | POST | Log a workout |
| `/api/updateUser` | PATCH | Update profile/goals |
| `/api/onboard` | POST | Complete onboarding |
| `/api/searchFoods` | GET | Search foods |
| `/api/favorites` | GET/POST/DELETE | Manage favorites |
| `/api/mealDetail` | GET | Get meal details |
| `/api/mealSuggestions` | GET | Smart suggestions |
| `/api/challenges` | GET/POST/PATCH | Gamification challenges |
| `/api/lookupBarcode` | GET | Open Food Facts lookup |
| `/api/exportData` | GET | Export JSON/CSV |
| `/api/importData` | POST | Import JSON |
| `/api/uploadImage` | POST | Upload meal photo |
| `/api/deleteLog` | DELETE | Delete a log entry |
| `/api/updateLog` | PATCH | Update a log entry |

**How to customize:** Each route is in `src/app/api/<name>/route.ts`. They use Prisma (`db`) and `ensureDemoUser()` from `src/lib/auth.ts`.

---

## 7. Pages & Layout (`src/app/`)

### `src/app/page.tsx`
**What it does:** The single page that renders the app. Contains:
- `BackButtonHandler` (Android back button)
- `TopBar` + `BottomNav`
- Tab content (Home / Progress / Settings)
- All modal sheets (rendered via `AnimatePresence`)
- Pull-to-refresh

**How to customize:**
- To add a new modal: add it to `ModalKey` in `store.ts`, import the component, and add a conditional render here.

### `src/app/layout.tsx`
**What it does:** Root layout with providers (Theme, ThemeColor, I18n, QueryClient) + fonts.
**How to customize:**
- To change fonts: edit the `Geist`/`Vazirmatn` imports.
- To change metadata: edit `metadata` and `viewport` exports.

### `src/app/globals.css`
**What it does:** Global styles, CSS variables, Tailwind theme.
**How to customize:** Change color variables, add custom animations.

---

## 8. Database & Prisma

### `prisma/schema.prisma`
**What it does:** Database schema.
**Models:** User, Food, Meal, Log, HealthDaily, Favorite, Challenge.
**How to customize:**
1. Edit the schema
2. Run `bun run db:push` to apply changes
3. Update `client-db.ts` to mirror the changes (for APK mode)

### `src/lib/db.ts`
**What it does:** Prisma client singleton.

### `src/scripts/seed.ts`
**What it does:** Seeds the database with starter + Persian foods (93 total).
**How to customize:** Add foods to `STARTER_FOODS` or `PERSIAN_FOODS` arrays.

---

## 9. Android APK Build

### `build-apk.sh`
**What it does:** Builds the APK.
**Steps:**
1. Install dependencies + Capacitor plugins
2. Build static export (`BUILD_STATIC=1 bun run build`)
3. Add Android platform (if not present)
4. Patch `AndroidManifest.xml` with permissions
5. Create `strings.xml` with app name
6. `cap copy` + `cap sync`
7. `gradlew assembleDebug`

### `instructions/AndroidManifest.template.xml`
**What it does:** Template manifest with all required permissions:
- `INTERNET` — for barcode lookups
- `CAMERA` — for meal/barcode scanning
- `POST_NOTIFICATIONS` — for reminders (Android 13+)
- `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE` — for saving photos

**How to customize:** If you need more permissions (e.g., location), add them here AND in the build script's patch loop.

### `capacitor.config.ts`
See [Configuration Files](#2-configuration-files) above.

---

## 10. Common Customization Tasks

### How to change the app name
1. `capacitor.config.ts` → `appName`
2. `instructions/AndroidManifest.template.xml` → `<string name="app_name">`
3. `src/lib/i18n.tsx` → `appName` key (for in-app display)
4. `src/app/layout.tsx` → `metadata.title`

### How to change the app icon
- Replace `android/app/src/main/res/mipmap-*/ic_launcher.png` with your icon
- Or use `bunx @capacitor/assets generate` with a source image

### How to add a new food to the database
- **Web mode:** Edit `src/scripts/seed.ts`, add to `STARTER_FOODS` or `PERSIAN_FOODS`, run `bun run src/scripts/seed.ts`
- **APK mode:** Use the "Create Food" button in the app (saves to IndexedDB)

### How to change the calorie calculation formula
- `src/lib/ai-engine/index.ts` → `calculateMacros()` function
- `src/lib/client-db.ts` → `onboardUser()` function (TDEE calculation)

### How to add a new language
1. `src/lib/i18n.tsx`:
   - Add `"fr"` to `Locale` type
   - Add French translations to the `translations` object
   - Update `setLocale` + `dir` logic
2. `src/features/settings/language-sheet.tsx` → add the option

### How to change the theme colors
1. `src/lib/theme-color.tsx` → `PALETTES` object
2. `src/lib/i18n.tsx` → add translation keys for the new palette name

### How to add a new settings row
1. `src/features/settings/settings-screen.tsx` → add a `<Row>` component
2. `src/lib/store.ts` → add a new `ModalKey` if it opens a sheet
3. `src/app/page.tsx` → render the new sheet
4. Create the sheet component in `src/features/settings/`

### How to change the back button behavior
- `src/components/back-button-handler.tsx` → edit the callback logic
- The callback receives `true` = handled (don't exit), `false` = not handled (exit)

### How to change toast duration
- `src/components/ui/sonner.tsx` → `duration={3500}` (milliseconds)

### How to change the goal celebration popup
- `src/features/dashboard/goal-celebration.tsx`:
  - `AUTO_DISMISS_MS` (default 4000) — how long it stays
  - Edit the `possible` array to add/remove celebration types
  - Tap the popup to dismiss early

### How to enable real AI meal analysis in the APK
The APK uses a heuristic `analyzeMeal()` in `client-db.ts` (recognizes 4 sample meals). For real AI:
1. Deploy the Next.js app to a server (e.g., Vercel)
2. Add an `API_BASE_URL` env var
3. In `src/lib/hooks.ts` → `useAnalyzeMeal`, replace the `isStaticMode()` branch with a fetch to `${API_BASE_URL}/api/analyzeMeal`

### How to add a new Capacitor plugin
1. `bun add @capacitor/<plugin-name>`
2. `src/lib/native-bridge.ts` → add a wrapper function using `tryImport("@capacitor/<plugin-name>")`
3. `build-apk.sh` → add the package to the `bun add` line
4. `instructions/AndroidManifest.template.xml` → add any required permissions

### How to debug the APK
1. `capacitor.config.ts` → `webContentsDebuggingEnabled: true` (already set)
2. Connect your phone via USB
3. `chrome://inspect` in Chrome → find the WebView
4. Use Chrome DevTools to debug

---

## File Change Log (Round 14)

### Files changed in this round:

1. **`src/features/dashboard/goal-celebration.tsx`**
   - **What changed:** Split the show/dismiss logic into two separate effects. The dismiss timer now only depends on `active` (not `data`), so query refetches don't cancel it.
   - **Why:** The "Right on track 82%" popup never disappeared because TanStack Query refetches were clearing the dismiss timeout.
   - **Options:** Change `AUTO_DISMISS_MS` to adjust how long it stays. Tap to dismiss early.

2. **`src/features/scanner/scanner-sheet.tsx`**
   - **What changed:** On native (Capacitor), shows a "Tap to open camera" prompt instead of trying `getUserMedia` (which fails in WebView). The Retry button now increments `retryCount` to force the effect to re-run.
   - **Why:** `getUserMedia` doesn't work reliably in Capacitor WebViews. The native `@capacitor/camera` plugin opens the device's camera UI and is reliable.
   - **Options:** To use live preview instead, you'd need to configure the WebView's `WebChromeClient` to grant `onPermissionRequest` (advanced native Android code).

3. **`src/lib/native-bridge.ts`**
   - **What changed:** Added `isNativePlatform()` export. Changed `registerBackButtonHandler()` to NOT gate on `isStaticMode()` — it always tries to import `@capacitor/app`.
   - **Why:** The back button handler wasn't registering because `isStaticMode()` might return `false` if `window.Capacitor` isn't injected yet when the effect runs.
   - **Options:** The handler always tries to import `@capacitor/app`. If the import fails (web), it does nothing.

4. **`build-apk.sh`**
   - **What changed:** More robust manifest patching + creates `strings.xml` with app name.
   - **Why:** Ensure permissions are always declared, even if the manifest already exists.

5. **`instructions/AndroidManifest.template.xml`** (new)
   - **What:** Template manifest with all required permissions.
   - **Why:** Fallback if the patch script fails.

6. **`src/lib/i18n.tsx`**
   - **What changed:** Added 3 new translation keys: `tapToOpenCamera`, `cameraOpensNative`, `openCamera`.
