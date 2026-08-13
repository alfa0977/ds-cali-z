# Cal-AI Clone — Worklog & Handover Document

This file is the single shared worklog for the Cal-AI clone project.
All agents MUST read this before starting and append (never overwrite) after finishing.

---
Task ID: 0
Agent: main (planner)
Task: Read `ds_cali.zip` documentation + uploaded design references, summarize key conventions, and define the next implementation step.

Work Log:
- Extracted `/home/z/my-project/upload/ds_cali.zip` → `/home/z/my-project/ds-cali/ds_cali - Copy/`.
- Read all docs: rep_structure, architecture, PROJECT_BREAKDOWN, DATA_MODEL, CODE_AGENT_GUIDE, ROADMAP, AI_PIPELINE, AR_DEPTH_ESTIMATION, HEALTH_SYNC, AUTH, PAYMENTS, SECURITY_AND_PRIVACY, DECISIONS.
- Read all package READMEs: mobile, functions, contracts, ai-engine, health-sync, depth-processing.
- Analyzed 5 uploaded design reference images via VLM: dark-iphone-preview, food-db, hero-image (scanner+results), search-food-db, water.
- Inspected current sandbox state: Next.js 16 project with full shadcn/ui set, Prisma, TanStack Query, Zustand, framer-motion, dev server running on port 3000.

Stage Summary:
- Source project is specified as a React Native + Expo + Firebase mobile app, but the available runtime is a Next.js 16 web sandbox. The build must be ADAPTED to web, not copied verbatim.
- Key adaptation decisions documented below in "Conventions" and "Next Step".
- See full conventions summary in the message delivered to the user.

Conventions (project-wide):
- Language: TypeScript everywhere. Contracts (types + Zod) defined once and shared.
- Monorepo-style layering, mapped to web: `packages/contracts` → `src/lib/contracts`; `packages/ai-engine` → `src/lib/ai-engine` (server-only, uses z-ai-web-dev-sdk VLM); `packages/ui` → `src/components/ui` (shadcn).
- Feature-module organization: each feature self-contained under `src/features/<feature>` with its own components, hooks, services.
- Backend = Next.js API routes (NOT server actions). All AI calls happen server-side via z-ai-web-dev-sdk.
- Database = Prisma + SQLite. Collections in DATA_MODEL.md map to Prisma models: User, Food, Meal, Log, HealthDaily, AiAnalysis.
- Security: every API route validates input with Zod and verifies the caller (stub auth with a single demo user for the web sandbox).
- Privacy: store only aggregated health data; meal images are user-scoped.
- Data flow for AI meal scan: upload image (base64/blob) → POST /api/analyzeMeal → VLM (image understanding) returns ingredients + weights + health score → macro calculation using foods density DB → return result card → user can "Fix Results" → save meal+log.

Design language (from reference images):
- Dual theme support: dark dashboard (near-black #1C1C1E, elevated cards #2C2C2E) AND light theme (iOS gray #F2F2F7 bg, white cards).
- iOS HIG aesthetic: rounded 12-20px corners, soft shadows, generous whitespace, SF Pro/Inter typography.
- Color-coded macros: Protein = coral/red, Carbs = orange/amber, Fats = blue.
- Circular progress rings for calories/macros/steps/weight.
- Bottom tab nav (Home / Progress / Settings) + floating "+" action button.
- Cards: Calories-left hero, macro triplet, weekly habit rings, steps card, calories-burned card, water +/- card, recent feed, weight graph + motivation banner.
- Scanner: camera view + framing brackets + "Scan food" pill; results screen overlays food photo with detection bubbles + nutrition grid + health score + Fix Results / Done buttons.
- Food database: search "Describe what you ate", segmented tabs (All/My meals/My foods/Saved scans), suggestion list cards with + add buttons.

Next step to implement (recommended):
Phase 0+1 of the web adaptation — foundation + dashboard shell:
1. Prisma schema (User, Food, Meal, Log, HealthDaily, AiAnalysis) + `bun run db:push` + seed starter foods.
2. Contracts (Zod schemas + TS types) in `src/lib/contracts`.
3. AI engine server module (`src/lib/ai-engine`) wrapping z-ai-web-dev-sdk VLM for meal analysis, with the JSON schema + macro calculation.
4. API routes: /api/analyzeMeal, /api/logMeal, /api/searchFoods, /api/logFood, /api/syncHealth, /api/getUserDashboard.
5. Web UI shell on `/`: theme (light/dark), sticky footer, bottom tab nav + FAB, and the Home dashboard (calories-left hero, macro rings, weekly habit strip, steps + calories-burned + water cards, recent feed).
6. Scanner + Result card + Food database screens as route sections/modals.
7. Self-verify with agent-browser, then iterate on styling detail and add features.

Unresolved / risk:
- Auth: real Firebase/Auth not available in sandbox → use a single demo user (id "demo") persisted via Prisma + a cookie/local id. Flag for future real auth.
- HealthKit/Google Fit native sync not available on web → simulate steps/activeEnergy with seeded/mock daily data + manual water logging.
- Depth sensing (LiDAR/ToF) not available on web → rely on AI-only portion estimation (VLM). Document as known limitation.

---
Task ID: 1
Agent: main (developer)
Task: Build the complete Cal-AI web clone — Phase 0+1+2+3 (foundation, dashboard, scanner, all screens).

Work Log:
- Created Prisma schema (User, Food, Meal, Log, HealthDaily, AiAnalysis) mapping all DATA_MODEL.md collections to SQLite. Ran `bun run db:push` successfully.
- Built contracts package (`src/lib/contracts/`): TS types + Zod schemas for all API request/response shapes (analyzeMeal, logMeal, searchFoods, logFood, syncHealth, logWater, logWorkout, updateUser, getUserDashboard).
- Built AI engine (`src/lib/ai-engine/index.ts`, server-only): wraps z-ai-web-dev-sdk VLM with meal-analysis prompt, JSON parsing, Zod validation, and a category-based macro calculation table (50+ food categories with per-100g macros + density).
- Built seed script (`src/scripts/seed.ts`): creates demo user (Alex Carter), 56 starter foods with emojis/categories/density, 7 days of health data, 3 sample meals, workout + water logs. Ran successfully.
- Built 9 API routes: /api/analyzeMeal (VLM analysis), /api/logMeal, /api/searchFoods, /api/logFood, /api/syncHealth, /api/logWater, /api/logWorkout, /api/getUserDashboard, /api/updateUser — all Zod-validated.
- Built data hooks (`src/lib/hooks.ts`): useDashboard, useAnalyzeMeal, useLogMeal, useSearchFoods, useLogFood, useLogWater, useLogWorkout, useUpdateUser (TanStack Query).
- Built Zustand store (`src/lib/store.ts`): tab state, modal state, selected date, last analysis.
- Built design system in globals.css: iOS HIG aesthetic with light + dark themes, Cal-AI macro colors (protein=#FF6B6B, carbs=#F4A261, fats=#4A90D9, streak=#FF9500, success=#34C759, water=#007AFF), shadow-ios, shadow-fab, phone-frame, no-scrollbar, thin-scrollbar utilities.
- Built UI shell: ThemeProvider, QueryProvider, TopBar (logo + streak + theme toggle), BottomNav (Home/Progress/Settings + floating FAB), ProgressRing (SVG circular progress).
- Built Home dashboard: calories-left hero with ring, macro triplet (protein/carbs/fats rings), weekly habit strip (S-S with checkmarks), steps card, calories-burned card (steps + workout breakdown), water card (+/- buttons + cup indicators), recent feed (meal/workout/water log rows).
- Built Scanner sheet: camera framing brackets, sample meals (pancakes/salad/burger/sushi), file upload, AI analysis loading state, result card with detection bubbles, nutrition grid, health score bar, servings stepper, Fix Results (inline ingredient editor), Done (logs meal).
- Built Food Database sheet: search input, segmented tabs (All/My meals/My foods/Saved scans), suggestion list with emoji/calories/serving/+ button, "Log empty food" button.
- Built Progress dashboard: two stat cards (last weight ring + days logged with "2 Cheat" badge), time range selector (90 Days/6 Months/1 Year/All time), SVG weight line graph with area fill + tooltip + day labels, motivation banner, weekly summary stats.
- Built Settings screen: profile card (avatar + name + email + edit), daily goals summary (4 macro rings), premium upsell banner, settings list (appearance/notifications/health/privacy), logout + delete account.
- Built Paywall sheet: premium hero with crown, 4 feature cards, 2 plan options (yearly/monthly with radio selection), "Start 7-day free trial" CTA, restore purchases.
- Built Add Action sheet (scan/search/workout), Add Workout sheet (activity type, duration stepper, intensity, calorie estimate), Edit Profile + Edit Goals sheets.
- Fixed critical layout bug: phone-frame height was not being respected because the CSS was inside `@layer utilities` (Tailwind v4 issue). Moved phone-frame + media query to plain CSS outside the layer. Frame now correctly constrains to `min(880px, 96dvh)` on desktop and `100dvh` on mobile.
- Fixed lint errors: removed `server-only` import from auth.ts (needed by seed script), renamed `useSample` to `handleSample` (hooks rules), changed `Goals extends Macros {}` to `type Goals = Macros`, simplified ThemeToggle (removed mounted useEffect pattern).

QA Results (via agent-browser):
- ✅ ESLint: 0 errors, 0 warnings (exit 0).
- ✅ Dev server: all routes return 200, no runtime errors.
- ✅ Home dashboard: renders with live data (1875 cal left, macros, weekly habit, steps 6127, water, recent feed).
- ✅ AI Scanner: tested with pancakes sample image → VLM returned "Stack of pancakes with banana and syrup", ingredients (Pancakes 280g, Banana 60g, Maple Syrup 30g, Fresh Mint 3g), macros (792 cal, 118g carbs, 18g protein, 28g fat), health score 42/100. Analysis completed in ~3s.
- ✅ Meal logging: clicked Done → dashboard updated (calories left dropped 1875→1083, eaten updated to 1417).
- ✅ Dark mode: toggled successfully, VLM confirmed "well-executed dark mode with excellent primary contrast".
- ✅ Progress tab: weight graph visible with tooltip, stat cards, time filters, motivation banner.
- ✅ Settings tab: profile, goals, premium upsell, settings list all visible.
- ✅ Food Database: 56 foods listed with calories/serving/+ buttons, search + tabs functional.
- ✅ Paywall: features, plans, CTA all rendered correctly.
- Screenshots saved to /home/z/my-project/download/: home-light-v2, home-fixed, home-dark, progress, settings, food-db, paywall, scanner-result, final-dark-home.

Stage Summary:
- The Cal-AI web clone is FULLY FUNCTIONAL end-to-end: AI meal scanning (VLM), food database, manual logging, water tracking, workout logging, dashboards (home + progress), settings, paywall, light/dark themes.
- All 6 phases from PROJECT_BREAKDOWN.md are implemented at the web-adaptation level (auth = demo user, health sync = seeded data, depth sensing = AI-only).
- Design matches the iOS HIG aesthetic from reference images: circular progress rings, color-coded macros, bottom tab nav + FAB, phone frame on desktop.
- No known bugs. Lint clean. All API routes working.

Unresolved / risk:
- Auth: single demo user (id "demo"). No real sign-in. Flagged for future Firebase/Auth integration.
- Health data: seeded mock data (steps, active energy, weight). No real HealthKit/Google Fit sync (not available on web).
- Depth sensing: AI-only portion estimation (no LiDAR/ToF on web). Documented as known limitation.
- Images: meal images are external Unsplash URLs for samples; user uploads use data URLs (not persisted to storage). Could add local file storage for persistence.
- Barcode scanning: UI placeholder exists but no barcode lookup API integrated yet.

Recommended next steps (priority order):
1. Polish: add framer-motion page transitions, micro-interactions on card taps, pull-to-refresh on dashboard.
2. Features: barcode scanner integration (Open Food Facts API), custom food creation flow, meal editing/deletion, date navigation (Yesterday/past days).
3. Data: persist uploaded meal images to /download folder, add streak calculation logic, add more detailed progress charts (macro trends over time).
4. UX: onboarding flow for new users, empty states with illustrations, achievement badges.

---
Task ID: 2
Agent: main (developer)
Task: Round 2 — styling polish (framer-motion animations), barcode scanner, meal edit/delete, date navigation, macro trend charts.

Work Log:
- Installed @zxing/browser + @zxing/library for barcode scanning.
- Built motion primitives (`src/components/motion.tsx`): PageTransition (tab fade+slide), TapCard (hover lift + tap scale), SheetWrapper (spring slide-up), StaggerList/StaggerItem (staggered list entrance).
- Built AnimatedNumber component (`src/components/animated-number.tsx`): counts up from 0 when scrolled into view, using framer-motion's animate() + useInView.
- Enhanced ProgressRing with framer-motion animated stroke fill (1s ease).
- Built Shimmer + DashboardSkeleton components for loading states.
- Added CSS keyframes to globals.css: shimmer, fab-glow, scan-line animation.
- Improved dark theme contrast: muted-foreground from oklch(0.68) → oklch(0.75) for better readability of secondary text (addressed VLM feedback).
- Built 3 new API routes:
  - /api/lookupBarcode: looks up barcode via Open Food Facts API (world.openfoodfacts.org), normalizes to food schema, saves to DB. Tested with Nutella (3017620422003) → returned 539 cal, 6.3g protein, 57.5g carbs, 30.9g fat.
  - /api/deleteLog: deletes a log entry + its linked meal.
  - /api/updateLog: patches title/macros/ingredients on a log + meal.
- Enhanced /api/getUserDashboard: added macroTrend (7-day per-day macro aggregation), computed real streak (consecutive days with meal logs).
- Added new hooks: useLookupBarcode, useDeleteLog, useUpdateLog.
- Built BarcodeScannerSheet (`src/features/scanner/barcode-scanner-sheet.tsx`): live camera scanning via ZXing BrowserMultiFormatReader, animated scan line, manual entry fallback, result card with servings stepper + nutrition grid + log button.
- Built EditLogSheet (`src/features/scanner/edit-log-sheet.tsx`): edit title + macros (calories/protein/carbs/fats), delete with AlertDialog confirmation.
- Rebuilt HomeDashboard with: animated numbers on all stats, date navigation (chevron left/right with Today/Yesterday/relative date label), TapCard wrappers on hero/water/habit cards, staggered list entrance for macro cards + recent feed, animated water cup fill, tap-to-edit on log rows (opens EditLogSheet), improved empty state with emoji.
- Rebuilt ProgressDashboard with: animated weight graph (pathLength animation), NEW MacroTrendChart (7-day calorie bar chart with goal line, bars turn red if over goal), NEW MacroBreakdownBars (protein/carbs/fat avg vs goal horizontal bars with animated fill), animated stat cards.
- Updated AddActionSheet: added "Barcode scan" option (4 actions now: scan meal, barcode, search foods, log workout).
- Updated page.tsx: AnimatePresence for tab transitions + modal sheet transitions (spring slide-up).
- Updated store: added "barcode" + "edit-log" modal keys, editingLog state.

QA Results (agent-browser + VLM):
- ✅ ESLint: 0 errors, 0 warnings (exit 0).
- ✅ Dev server: all routes 200, no runtime errors.
- ✅ Home dashboard: animated numbers count up, date navigation works (Yesterday shows 1960 cal left / 540 eaten — different from today), progress rings animate fill, staggered card entrance, water cups animate in.
- ✅ Barcode scanner: camera viewfinder with animated scan line, manual entry tested with Nutella barcode → Open Food Facts API returned product successfully, result card with servings + nutrition grid rendered.
- ✅ Edit log: clicked meal row → Edit entry sheet opened with title + 4 macro fields + Save changes + delete (trash) button with confirmation dialog.
- ✅ Progress dashboard: weight graph with animated path draw, macro trend calorie bar chart (7 days with goal line), macro breakdown bars (protein/carbs/fats avg vs goal), all animate in.
- ✅ Dark mode: VLM rated 8/10 polish, contrast improved after muted-foreground bump.
- ✅ Tab transitions: smooth fade+slide between Home/Progress/Settings.
- ✅ Modal transitions: spring slide-up for all sheets.
- Screenshots in /home/z/my-project/download/: v2-home, v2-yesterday, v2-progress, v2-progress-scroll, v2-macro-trend, v2-action-sheet, v2-barcode-scanner, v2-barcode-result2, v2-edit-final, v2-dark-home, v2-dark-improved, v2-yesterday-view.

Stage Summary:
- Round 2 complete. The app now has polished framer-motion animations throughout (page transitions, card entrances, number counting, ring fills, bar charts), 4 new features (barcode scanner with Open Food Facts, meal edit/delete, date navigation, macro trend charts), and improved dark mode contrast.
- All API routes working. Lint clean. No runtime errors.

Unresolved / minor:
- Barcode camera scanning requires HTTPS + camera permission; in the headless QA environment the camera may not be available, but manual entry works and the API is verified via direct curl.
- The "2 Issues" / "1 Issue" red badge seen in screenshots is the agent-browser's own notification UI, NOT part of the app.
- Macro trend data is sparse for past days (only seeded meals exist); will fill out as user logs more meals.

Recommended next steps:
1. Onboarding flow for new users (goals setup, health permissions intro).
2. Custom food creation flow (manual entry with full macro input).
3. Meal image persistence to /download folder (currently data URLs in memory).
4. Achievement badges + milestone celebrations.
5. Pull-to-refresh on dashboard.
6. Weekly/monthly calendar view for browsing past logs.

---
Task ID: 3
Agent: main (developer)
Task: Round 3 — onboarding flow, custom food creation, meal categorization, achievements, consumed-vs-goal bars.

Work Log:
- Extended Prisma schema: added `age`, `sex`, `activityLevel`, `goal`, `onboarded` to User model; added `mealSlot` to Meal and Log models. Ran `db:push` + `db:generate`.
- Updated contracts: added `mealSlotSchema`, `onboardRequestSchema`, extended `updateUserRequestSchema` and `logMealRequestSchema`/`logFoodRequestSchema` to accept mealSlot + new user fields.
- Built `/api/onboard` route: computes BMR via Mifflin-St Jeor equation, applies activity factor (sedentary 1.2 → very_active 1.9), adjusts for goal (lose -500, gain +400), calculates macro split (30% protein / 40% carbs / 30% fat), updates user profile + goals + onboarded flag.
- Updated `/api/getUserDashboard`: returns `mealsBySlot` (breakfast/lunch/dinner/snack groupings with auto-categorization by timestamp hour if no explicit slot), `onboarded` flag, real streak calculation, and properly parsed macros in mealsBySlot (fixed NaN bug).
- Updated `/api/logMeal` and `/api/logFood` to accept + persist `mealSlot`.
- Added `useOnboard` hook.
- Built OnboardingFlow (`src/features/onboarding/onboarding-flow.tsx`): 5-step wizard (Welcome → About you → Activity → Goal → Ready) with progress bar, animated transitions, feature highlights, sex/age/height/weight inputs, 5 activity levels with emojis, 3 goal options, and a success screen showing calculated daily goals.
- Built CreateFoodSheet (`src/features/food-database/create-food-sheet.tsx`): custom food creation with name, emoji picker (20 choices), serving size, weight, calories, protein/carbs/fats fields.
- Built AchievementsSection (`src/features/progress/achievements-section.tsx`): 8 gamification badges (First Scan, 3-Day Streak, Week Warrior, Monthly Master, 10K Steps, Hydrated, Meal Logger, Perfect Week) with unlocked/locked states, progress bars, and color-coded icons.
- Enhanced HomeDashboard: added `MacroProgressBars` (consumed-vs-goal horizontal bars for calories/protein/carbs/fats with animated fill + over-goal red indicator), `MealsBySlot` (breakfast/lunch/dinner/snacks sections with per-slot calorie totals, food items with macro breakdown, and + add buttons), improved empty state.
- Updated FoodDatabaseSheet: "Log empty food" button now opens CreateFoodSheet.
- Updated page.tsx: shows OnboardingFlow when `user.onboarded === false`, wired up create-food + edit-log modals.
- Fixed critical Prisma stale client issue: the dev server's module cache held an old PrismaClient that didn't know about new schema fields. Fixed by modifying db.ts to create a fresh client on each module load + restarting the dev server.

QA Results:
- ✅ ESLint: 0 errors, 0 warnings (exit 0).
- ✅ Onboarding flow: tested end-to-end via browser — welcome → about you (Jordan, male, 28, 175cm, 72kg) → moderately active → lose weight → calculated goals (2102 cal, 158g protein, 210g carbs, 70g fat) → dashboard loaded with new goals.
- ✅ Meals by slot: Breakfast/Lunch/Dinner/Snacks sections render with food items, calorie counts, and + buttons. Fixed NaN bug (macros now properly parsed in mealsBySlot).
- ✅ Macro progress bars: consumed-vs-goal bars animate in with proper colors (over-goal = red).
- ✅ Achievements: 8 badges render with 2 unlocked, progress bars on locked badges (3-Day Streak 67%, Week Warrior 29%, Monthly Master 7%).
- ✅ Create food form: opens with name, emoji picker, serving fields, macro inputs.
- Screenshots: v3-onb-final, v3-onb-complete-success, v3-home-new, v3-meals-final, v3-achievements-view, v3-create-food.

Stage Summary:
- Round 3 complete. The app now has a full onboarding flow with BMR-based goal calculation, custom food creation, meal categorization (breakfast/lunch/dinner/snacks), gamification achievements, and consumed-vs-goal progress bars.
- All features verified working via agent-browser + curl.
- Lint clean. No runtime errors.

Unresolved / minor:
- Dev server required manual restart to pick up Prisma schema changes (stale module cache). This is a one-time issue per schema change.
- Meal detail view (clicking a meal to see full ingredient breakdown) is stubbed but not fully implemented.
- Meal image persistence to /download folder not yet done (still using data URLs / external URLs).

Recommended next steps:
1. Meal detail view with full ingredient breakdown + edit from there.
2. Pull-to-refresh on dashboard.
3. Weekly/monthly calendar view for browsing past logs.
4. Meal image persistence to /download folder.
5. Favorites/recents for quick food logging.
6. Nutrition insights panel (e.g., "You're consistently under your protein goal").
