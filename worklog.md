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
