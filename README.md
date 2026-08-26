# DS-Cali 🍎

> **ردیاب هوشمند کالری** — An AI-powered calorie & meal tracking web app with Persian (Farsi) and English language support, Shamsi calendar, gamification, and a beautiful iOS-inspired design.

![DS-Cali](https://img.shields.io/badge/DS--Cali-v1.0.0-orange) ![Next.js](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Prisma](https://img.shields.io/badge/Prisma-SQLite-teal)

---

## ✨ Features

### 📸 AI Meal Scanner
- Snap a photo of any meal → AI vision identifies ingredients, estimates weights, and calculates macros instantly
- Powered by `z-ai-web-dev-sdk` VLM (Vision Language Model)
- Ingredient-level confidence bars and editable portions
- Health score (0-100) based on nutritional balance
- Sample meals included for quick testing

### 🍽️ Food Database
- **96 foods** including **35 authentic Persian/Iranian dishes** (Chelo Kabab, Ghormeh Sabzi, Fesenjan, Doogh, and more)
- **Barcode scanner** with Open Food Facts API integration
- Category filter chips (Protein, Grains, Vegetables, Fruit, Dairy, Snacks, Drinks, Fats, Sauces)
- Custom food creation with emoji picker
- Smart meal suggestions based on remaining macro gaps

### 📊 Dashboard
- **Calories-left hero card** with animated progress ring and gradient bar
- **Macro triplet** (Protein/Carbs/Fats) with circular progress rings
- **Macro ratio donut chart** showing P/C/F calorie contribution split
- **Consumed vs goal progress bars** with over-goal red indicator
- **Weekly calendar** with Shamsi (Jalali) dates in Persian mode
- **Weekly habit strip** with checkmarks for logged days
- **Steps card** with 10K goal progress
- **Calories burned card** (steps + workout breakdown)
- **Water tracker** with +/- buttons and cup indicators
- **Quick add** (favorites carousel) + **Recent foods** carousel
- **Meal categorization** (Breakfast/Lunch/Dinner/Snacks) with per-slot calories
- **Nutrition timeline** (hourly calorie breakdown)
- **Smart insights** (protein trend, water trend, calorie trend vs 7-day average)

### 📈 Progress Page
- Weight graph with animated SVG line chart + Shamsi dates
- Goal progress percentage
- Macro trend bar chart (7-day calories with goal line)
- Average daily macros breakdown bars
- Water intake 7-day chart
- Workout history with intensity color-coding
- **8 achievements** with progress bars (First Scan, 3-Day Streak, Week Warrior, Monthly Master, 10K Steps, Hydrated, Meal Logger, Perfect Week)
- **Streak statistics** (current, best, this week, meals logged, consistency bar)
- Motivation banner

### 🎮 Gamification
- **5 challenges**: Hydration Week, Protein Boost, Step Master, Clean Eating, Streak Warrior
- Auto-computed progress from health data + meal logs
- Join/leave challenges, reward badges

### 🌍 Internationalization (i18n)
- **Persian (Farsi) is the default language** with full LTR layout
- **English** as secondary language
- **Shamsi (Jalali) calendar** for Persian mode with Persian month names and weekdays
- **Persian digits** (۰-۹) for all numbers in Persian mode
- 200+ translation keys covering every UI string
- Language switcher with flags (🇮🇷 / 🇬🇧)

### 🎨 Theming
- **Light / Dark / System** theme modes
- **5 theme color palettes**: Orange (default), Green, Purple, Rose, Teal
- Color-coded macros: Protein = coral, Carbs = orange, Fats = blue
- iOS HIG aesthetic with glassmorphism, premium card shadows, rounded corners
- Vazirmatn font for Persian, Geist for English

### 👤 User Management
- Create multiple users with separate profiles
- Switch between users instantly (cookie-based)
- Delete users (except demo)
- Each user has independent goals, meals, logs, favorites, challenges

### ⚙️ Settings
- Edit profile (name, weight, height)
- Edit daily goals (calories, protein, carbs, fats)
- Appearance (theme mode + color palette)
- Language selection
- Reminders with browser notification support
- Share progress to WhatsApp/Twitter/Facebook
- Health connections
- Privacy & data
- Data export (JSON/CSV) and import (JSON)

### 🔔 Other Features
- **Onboarding flow** (5-step wizard with BMR calculation using Mifflin-St Jeor)
- **Goal celebrations** with confetti animation (auto-dismiss + click to dismiss)
- **Pull-to-refresh** on dashboard
- **Meal detail view** with ingredient breakdown + confidence bars
- **Edit/delete** any log entry
- **Favorites system** with quick-add carousel
- **Paywall** with premium features
- **Data persistence** — meal images saved to `/download/meal-images/`
- **Responsive design** — phone frame on desktop, full-screen on mobile

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui (New York) |
| Database | Prisma ORM + SQLite |
| AI | z-ai-web-dev-sdk (VLM for meal analysis) |
| State | Zustand (client) + TanStack Query (server) |
| Animation | Framer Motion |
| Icons | Lucide React |
| Fonts | Geist + Vazirmatn (Persian) |
| Barcode | @zxing/browser |
| Calendar | jalaali-js (Shamsi) |
| Notifications | Browser Notification API |

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- Bun (recommended) or npm

### Installation

```bash
# Clone the repo
git clone <your-repo-url>
cd ds-cali

# Install dependencies
bun install

# Set up the database
bun run db:push

# Seed demo data + Persian foods
bun run src/scripts/seed.ts

# Start the dev server
bun run dev
```

Open `http://localhost:3000` in your browser.

### Environment Variables

Create a `.env` file:
```
DATABASE_URL=file:/path/to/custom.db
```

The `z-ai-web-dev-sdk` is pre-installed and configured — no API key needed.

---

## 📁 Project Structure

```
ds-cali/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API routes (15+ endpoints)
│   │   │   ├── analyzeMeal/    # AI meal analysis
│   │   │   ├── challenges/     # Gamification challenges
│   │   │   ├── exportData/     # JSON/CSV export
│   │   │   ├── favorites/      # Favorites CRUD
│   │   │   ├── lookupBarcode/  # Open Food Facts lookup
│   │   │   ├── users/          # User management
│   │   │   └── ...
│   │   ├── globals.css         # Theme tokens + RTL + glassmorphism
│   │   ├── layout.tsx          # Root layout with providers
│   │   └── page.tsx            # Main app (only route)
│   ├── components/              # Shared components
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── logo.tsx             # DS-Cali logo
│   │   ├── bottom-nav.tsx       # Tab bar + FAB
│   │   ├── progress-ring.tsx    # Circular progress
│   │   ├── donut-chart.tsx      # Multi-segment donut
│   │   └── ...
│   ├── features/                # Feature modules
│   │   ├── dashboard/           # Home dashboard components
│   │   ├── scanner/             # AI scanner + barcode + workout
│   │   ├── food-database/       # Food search + creation
│   │   ├── progress/            # Progress page components
│   │   ├── settings/            # Settings sheets
│   │   ├── onboarding/          # Onboarding wizard
│   │   └── paywall/             # Premium paywall
│   ├── lib/                     # Core libraries
│   │   ├── i18n.tsx             # Translation system (200+ keys)
│   │   ├── auth.ts              # User management (cookie-based)
│   │   ├── ai-engine/           # VLM wrapper + macro calculation
│   │   ├── food-translations.ts # 96+ English→Persian food names
│   │   ├── date-utils.ts        # Shamsi calendar + Persian digits
│   │   ├── theme-color.tsx      # 5 color palettes
│   │   ├── hooks.ts             # TanStack Query hooks
│   │   ├── store.ts             # Zustand store
│   │   └── ...
│   └── scripts/
│       └── seed.ts              # Database seeder (96 foods)
├── prisma/
│   └── schema.prisma            # Database schema (7 models)
├── public/                      # Static assets
└── package.json
```

---

## 🗄️ Database Schema

7 Prisma models:
- **User** — profile, goals, subscription, streak, onboarding
- **Food** — 96 foods with macros, density, emoji, barcode
- **Meal** — logged meals with ingredients JSON, macros, health score, meal slot
- **Log** — all log entries (meal, water, workout) with timestamps
- **HealthDaily** — daily aggregated health (steps, water, weight, workouts)
- **Favorite** — user's favorite foods for quick logging
- **Challenge** — gamification challenges with progress tracking
- **AiAnalysis** — raw + corrected AI analysis results

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analyzeMeal` | AI vision meal analysis |
| POST | `/api/logMeal` | Save a meal + log |
| GET | `/api/searchFoods` | Search food database |
| POST | `/api/logFood` | Log a food item |
| POST | `/api/logWater` | Adjust water intake |
| POST | `/api/logWorkout` | Log a workout |
| GET | `/api/getUserDashboard` | Full dashboard data |
| PATCH | `/api/updateUser` | Update profile/goals |
| PATCH | `/api/updateLog` | Edit a log entry |
| DELETE | `/api/deleteLog` | Delete a log entry |
| GET | `/api/favorites` | List favorites |
| POST | `/api/favorites` | Add favorite |
| DELETE | `/api/favorites` | Remove favorite |
| GET | `/api/mealSuggestions` | Smart food suggestions |
| GET | `/api/challenges` | List/join challenges |
| POST | `/api/challenges` | Join a challenge |
| PATCH | `/api/challenges` | Leave a challenge |
| GET | `/api/users` | List all users |
| POST | `/api/users` | Create a user |
| DELETE | `/api/users` | Delete a user |
| POST | `/api/switchUser` | Switch active user |
| GET | `/api/exportData` | Export JSON/CSV |
| POST | `/api/importData` | Import JSON backup |
| POST | `/api/uploadImage` | Upload meal image |
| GET | `/api/lookupBarcode` | Open Food Facts lookup |
| POST | `/api/onboard` | Complete onboarding |

---

## 🎯 App Screenshots

### Home Dashboard (Persian)
- Calories-left hero with progress ring
- Macro triplet + donut chart + progress bars
- Weekly calendar with Shamsi dates
- Steps, calories burned, water cards
- Quick add, recents, smart suggestions
- Meal categorization (Breakfast/Lunch/Dinner/Snacks)
- Insights with trend comparisons

### Progress Page
- Weight graph with Shamsi dates
- Macro trend bar charts
- Water intake chart
- Workout history
- 8 achievement badges
- Streak statistics

### AI Scanner
- Camera viewfinder with framing brackets
- Sample meals for quick testing
- AI analysis with loading spinner
- Result card with ingredients, nutrition grid, health score
- Fix Results editor
- Image persistence to server

### Settings
- Profile card + goals summary
- User management (create/switch/delete)
- Appearance (theme mode + color palette)
- Language (Persian/English)
- Challenges
- Reminders with notification support
- Share progress
- Data export/import

---

## 📱 Android APK Build

See [ANDROID_BUILD.md](./ANDROID_BUILD.md) for instructions on creating an Android APK using Capacitor or Cordova.

---

## 📄 License

MIT License — feel free to use, modify, and distribute.

---

## 🙏 Acknowledgments

- [z-ai-web-dev-sdk](https://www.npmjs.com/package/z-ai-web-dev-sdk) for AI vision
- [shadcn/ui](https://ui.shadcn.com/) for component library
- [jalaali-js](https://www.npmjs.com/package/jalaali-js) for Shamsi calendar
- [Vazirmatn](https://fonts.google.com/specimen/Vazirmatn) for Persian font
- [Open Food Facts](https://world.openfoodfacts.org/) for barcode data

---

<div align="center">

**DS-Cali** — ساخته‌شده با 💚

Made with 💚

</div>
