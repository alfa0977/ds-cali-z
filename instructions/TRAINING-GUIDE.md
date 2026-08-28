# DS-Cali Training Guide

This guide walks you through everything you need to know to develop, customize, and extend the DS-Cali app. Each section builds on the previous one.

---

## Part 1: Understanding the Architecture

### 1.1 Two-Mode System

DS-Cali runs in **two modes**:

```
┌─────────────────────────────────────────────────────────────┐
│  WEB MODE (dev server)          │  APK MODE (Capacitor)     │
│  ──────────────────────────────  │  ──────────────────────  │
│  Browser at localhost:3000       │  Android app on phone     │
│  Data: Prisma + SQLite           │  Data: IndexedDB          │
│  AI: z-ai-web-dev-sdk (server)   │  AI: Multi-engine system  │
│  Camera: getUserMedia            │  Camera: @capacitor/camera│
│  Notifications: Web API          │  Notifications: Capacitor  │
│  Back button: Browser history    │  Back button: App plugin   │
└─────────────────────────────────────────────────────────────┘
```

**How the mode is detected:**
- `src/lib/env.ts` → `isStaticMode()` checks `window.Capacitor.isNativePlatform()`
- `src/lib/native-bridge.ts` → `isNativePlatform()` is the same check, exported for convenience

**Why this matters:** Every data hook checks `isStaticMode()` and routes to either the API or the IndexedDB client. This is the most important pattern in the codebase.

### 1.2 File Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # Server-side API routes (web mode only)
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # The single page (all modals rendered here)
│   └── globals.css        # Global styles + CSS variables
├── components/            # Shared UI components
│   ├── ui/                # shadcn/ui library
│   ├── back-button-handler.tsx
│   ├── bottom-nav.tsx
│   ├── top-bar.tsx
│   └── sonner.tsx         # Toast configuration
├── features/              # Feature-specific components
│   ├── auth/              # Login screen
│   ├── dashboard/         # Home dashboard cards
│   ├── food-database/     # Food search + create
│   ├── onboarding/        # Welcome wizard
│   ├── paywall/           # Premium UI
│   ├── progress/          # Progress page
│   ├── scanner/           # Camera scanner + barcode
│   └── settings/          # Settings + developer panel
└── lib/                   # Core logic
    ├── ai-engines/        # Multi-engine AI system
    ├── contracts/         # Zod schemas + types
    ├── ai-engine/         # Server-side z-ai VLM (web mode only)
    ├── client-db.ts       # IndexedDB (APK mode)
    ├── env.ts             # isStaticMode()
    ├── hooks.ts           # React Query hooks
    ├── i18n.tsx           # Persian/English translations
    ├── native-bridge.ts   # Capacitor plugin wrappers
    ├── notifications.ts   # Notification utility
    ├── store.ts           # Zustand UI state
    ├── subscription.ts    # Free vs Premium
    └── theme-color.tsx    # 12 color palettes
```

---

## Part 2: How to Make Changes

### 2.1 Adding a New Food

**File:** `src/lib/seed-data.ts`

```typescript
// Add to STARTER_FOODS or PERSIAN_FOODS array:
["Your Food Name", "1 serving", 100, 250, 15, 30, 8, "protein", "🍖", 1.0, null],
//  Format: [name, serving, weight(g), cal, protein, carbs, fat, category, emoji, density, barcode]
```

**To make it bilingual**, also add to `src/lib/food-translations.ts`:
```typescript
"Your Food Name": "نام غذای شما",
```

**Or use the bilingual format** (no translation file needed):
```typescript
["Your Food Name|||نام غذای شما", "1 serving", ...]
```

The `translateFoodName(name, locale)` function in `food-translations.ts` automatically splits `"English|||Persian"` and returns the correct part based on the current locale.

### 2.2 Adding a New Color Palette

**File:** `src/lib/theme-color.tsx`

```typescript
// 1. Add the key to ThemeColorKey type:
export type ThemeColorKey = "orange" | "green" | ... | "yourcolor";

// 2. Add the palette to PALETTES:
const PALETTES = {
  // ... existing palettes
  yourcolor: {
    streak: "#FF6B6B",    // primary accent
    protein: "#FF6B6B",   // protein UI
    carbs: "#F4A261",     // carbs UI
    fats: "#4A90D9",      // fats UI
    success: "#34C759",   // success states
    water: "#007AFF",     // water UI
  },
};

// 3. Add to THEME_COLOR_OPTIONS:
export const THEME_COLOR_OPTIONS = [
  // ... existing options
  { key: "yourcolor", labelFa: "رنگ شما", labelEn: "Your Color", swatch: "#FF6B6B" },
];
```

### 2.3 Adding a New AI Engine

**File:** `src/lib/ai-engines/index.ts`

```typescript
// 1. Add the key to AiEngineKey:
export type AiEngineKey = "heuristic" | "openai" | "gemini" | "remote" | "your-engine";

// 2. Add config to AI_ENGINES:
{
  key: "your-engine",
  label: "Your Engine",
  labelFa: "موتور شما",
  description: "Description...",
  descriptionFa: "توضیحات...",
  requiresApiKey: true,
  requiresUrl: false,
  icon: "🚀",
},

// 3. Add the implementation:
async function analyzeYourEngine(image: string, apiKey: string): Promise<AnalysisResult> {
  const res = await fetch("https://your-api.com/analyze", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({ image }),
  });
  const data = await res.json();
  return parseJsonResponse(data.result);
}

// 4. Add to the switch in analyzeMealWithEngine:
case "your-engine":
  if (!s.yourApiKey) throw new Error("Your API key not configured");
  return await analyzeYourEngine(image, s.yourApiKey);
```

**File:** `src/features/settings/developer-sheet.tsx`
- Add an API key input for your engine

### 2.4 Changing Free vs Premium Limits

**File:** `src/lib/subscription.ts`

```typescript
const FREE_TIER: SubscriptionConfig = {
  tier: "free",
  maxAiScansPerDay: 3,        // ← Change from 5 to 3
  maxFoodLogsPerDay: -1,      // unlimited
  advancedAnalytics: false,
  customThemes: false,        // free users can't use all 12 palettes
  exportData: true,
  challenges: true,
  mealPlanning: false,
};

const PREMIUM_TIER: SubscriptionConfig = {
  tier: "premium",
  maxAiScansPerDay: -1,       // unlimited
  // ...
};
```

### 2.5 Adding a Time Picker to a Food Logging Flow

The `QuickLogSheet` (`src/features/scanner/quick-log-sheet.tsx`) already has:
- Servings stepper
- Meal slot selector (breakfast/lunch/dinner/snack)
- Time picker (`<input type="time">`)
- Scaled macros preview

**To route any food-logging button through QuickLogSheet:**

```typescript
// In your component:
const { setModal, setQuickLogPayload } = useApp();

function openQuickLog(food) {
  setQuickLogPayload({
    foodId: food.id,           // optional — if from food database
    name: food.name,
    emoji: food.emoji,
    calories: food.calories,
    protein: food.protein,
    carbs: food.carbs,
    fat: food.fat,
    servingSize: food.servingSize,
    servingWeightGrams: 100,
  });
  setModal("quick-log");
}
```

### 2.6 Adding a New Settings Row

1. **`src/lib/store.ts`** — add `"your-modal"` to `ModalKey`
2. **`src/features/settings/settings-screen.tsx`** — add a `<Row>`:
   ```tsx
   <Row icon={YourIcon} label="Your Setting" onClick={() => setModal("your-modal")} />
   ```
3. **`src/features/settings/your-sheet.tsx`** — create the sheet component
4. **`src/app/page.tsx`** — add `{modal === "your-modal" && <YourSheet />}`

---

## Part 3: PowerShell Commands Cheat Sheet

All commands you need, in PowerShell format:

### Development

```powershell
# Install dependencies
bun install

# Start dev server (runs on port 3000)
bun run dev

# Run linter
bun run lint

# Push database schema
bun run db:push

# Generate Prisma client
bun run db:generate
```

### Building the APK

```powershell
# Full APK build (installs plugins, patches manifest, builds)
powershell -ExecutionPolicy Bypass -File build-apk.ps1

# Release build
powershell -ExecutionPolicy Bypass -File build-apk.ps1 -BuildType release
```

### Running the AI VLM Mini-Service

```powershell
cd mini-services\ai-vlm-service
bun install
bun run dev
# Runs on port 3031
# Set URL in Developer Settings to: /api/analyze?XTransformPort=3031
```

### Environment Variables

```powershell
# Set for current session:
$env:BUILD_STATIC = "1"
$env:ANDROID_HOME = "C:\Android\Sdk"
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.x.x"

# Permanent (user-level):
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "C:\Android\Sdk", "User")
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-17.x.x", "User")
```

### ADB (Android Debug Bridge)

```powershell
# Install APK on connected phone
adb install android\app\build\outputs\apk\debug\app-debug.apk

# Uninstall old APK (IMPORTANT before installing new one)
adb uninstall app.dscali

# View logs
adb logcat -s "Capacitor" "Console"
```

---

## Part 4: Bilingual Food Name System

### How it works

The `translateFoodName(name, locale)` function in `src/lib/food-translations.ts` handles 3 cases:

1. **Bilingual format** `"English|||Persian"` → splits and returns the correct part
2. **Translation dictionary** → looks up in `FOOD_NAME_TRANSLATIONS`
3. **Fallback** → returns the name as-is

### Adding a bilingual food

**Method A — Bilingual format in seed data:**
```typescript
// In src/lib/seed-data.ts:
["Homemade Granola|||گرانولای خانگی", "1 cup", 100, 450, 12, 60, 18, "grain", "🥣", 0.8, null],
```

**Method B — Translation dictionary:**
```typescript
// In src/lib/food-translations.ts:
"Homemade Granola": "گرانولای خانگی",
```

**Method C — In the Create Food sheet:**
The create-food sheet now has **two name inputs**: English and Persian. If you fill both, it saves as `"English|||Persian"`.

### Where food names are displayed

- `food-database-sheet.tsx` — search results show `translateFoodName(food.name, locale)`
- `quick-log-sheet.tsx` — confirmation modal shows translated name
- `barcode-scanner-sheet.tsx` — barcode result shows translated name
- `home-dashboard.tsx` — recent logs show translated name
- `meal-detail-sheet.tsx` — meal details show translated name

### Searching works in both languages

The food database search now matches both English and Persian names:
```typescript
// In food-database-sheet.tsx:
list = list.filter((f) => {
  const enName = f.name.toLowerCase();
  const faName = translateFoodName(f.name, "fa").toLowerCase();
  return enName.includes(query) || faName.includes(query);
});
```

---

## Part 5: The Time Picker Pattern

Every food-logging flow should let the user specify:
1. **When** they ate it (time picker)
2. **Which meal** (breakfast/lunch/dinner/snack)
3. **How much** (servings)

### Flows that have the time picker:

| Flow | Has time picker? | File |
|------|-----------------|------|
| Quick Log (favorites/suggestions/recents) | ✅ Yes | `quick-log-sheet.tsx` |
| Food Database → tap "+" | ✅ Yes (routes through QuickLog) | `food-database-sheet.tsx` |
| Create Food → Create & Log | ✅ Yes (routes through QuickLog) | `create-food-sheet.tsx` |
| Barcode scan result | ✅ Yes | `barcode-scanner-sheet.tsx` |
| Scanner → Done | ✅ Yes | `scanner-sheet.tsx` (ResultCard) |

### How the time is used

When the user picks a time, the `confirm()` function builds a timestamp:
```typescript
const today = new Date();
const [hours, minutes] = mealTime.split(":").map(Number);
today.setHours(hours, minutes, 0, 0);
// Then passes today.toISOString() as the log timestamp
```

This means the food appears in the correct time slot on the dashboard (breakfast section if time < 11:00, lunch if 11-16, etc.).

---

## Part 6: Testing Checklist

After making changes, verify these work:

- [ ] **Lint passes:** `bun run lint` → 0 errors
- [ ] **Dev server runs:** `bun run dev` → no errors in console
- [ ] **Home dashboard loads:** shows calories, macros, charts
- [ ] **Food database:** search finds foods in both English and Persian
- [ ] **Quick Log sheet:** opens with servings + slot + time + macros preview
- [ ] **Barcode result:** shows servings + slot + time + macros
- [ ] **Scanner:** camera opens (on web), native camera prompt (on APK)
- [ ] **Settings:** all sections visible, Account + Developer sections work
- [ ] **Developer panel:** AI engine selector, subscription toggle, data management
- [ ] **Login screen:** Google/Phone/Guest buttons visible
- [ ] **Theme colors:** 12 palettes available
- [ ] **Language:** switching to Persian shows RTL + translated food names

---

## Part 7: Common Issues and Solutions

### "Unexpected token '<' is not valid JSON"
**Cause:** `isStaticMode()` returned false in the APK, so it tried to call `/api/*` which returned HTML.
**Fix:** Make sure `src/lib/env.ts` detects `window.Capacitor`. Rebuild APK.

### Camera doesn't start in APK
**Cause:** `getUserMedia` fails in Capacitor WebView.
**Fix:** The scanner now shows a "Tap to open camera" prompt on native, which uses `@capacitor/camera`.

### Back button exits app
**Cause:** `@capacitor/app` plugin not installed or listener not registered.
**Fix:** Run `build-apk.ps1` which installs `@capacitor/app`. Check `back-button-handler.tsx`.

### Food names not translated
**Cause:** The food name isn't in `FOOD_NAME_TRANSLATIONS` and doesn't use the `|||` format.
**Fix:** Add the translation to `food-translations.ts` or use the bilingual format in seed data.

### AI always returns "Mixed meal"
**Cause:** The heuristic engine is the default. Real AI requires an API key.
**Fix:** Settings → Developer → AI Engine → select OpenAI/Gemini → enter API key.

### Goal celebration popup stays forever
**Cause:** The dismiss timer was in the same effect as the data dependency.
**Fix:** Already fixed — the dismiss timer is in a separate effect that only depends on `active`.

---

## Part 8: File Reference

See `DEVELOPER-GUIDE.md` for the complete file-by-file reference.

See `AI-RECOGNITION-EXPLAINED.md` for why the sandbox AI works but the APK uses the heuristic.

See `AndroidManifest.template.xml` for the required Android permissions.
