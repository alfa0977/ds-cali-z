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
