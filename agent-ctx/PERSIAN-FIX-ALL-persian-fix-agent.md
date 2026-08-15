# PERSIAN-FIX-ALL — Work Record

## Agent
- **Agent name**: persian-fix-agent
- **Task ID**: PERSIAN-FIX-ALL
- **Date**: 2026-08-15

## Summary
Fixed Persian (Farsi) internationalization across the DS-Cali calorie tracker app. All 25 existing files (out of 26 listed in PERSIAN_AUDIT.md — `user-management-sheet.tsx` does not exist in the codebase) now use `useI18n()`, `formatNumber()`, `formatTime()`, `formatDate()`, `getWeekdayShort()`, and `translateFoodName()` for full Persian RTL + Shamsi date + Persian digit + Persian food-name support.

## Files Fixed (25 total)

### Dashboard (9)
1. `src/features/dashboard/nutrition-insights.tsx` — titles/descriptions for all 15 insight variants, numbers formatted
2. `src/features/dashboard/macro-ratio-card.tsx` — Protein/Carbs/Fats labels, kcal, calories number
3. `src/features/dashboard/goal-celebration.tsx` — 4 celebration titles + descriptions
4. `src/features/dashboard/nutrition-timeline.tsx` — "Today's timeline", "cal total", hour labels, numbers
5. `src/features/dashboard/meal-suggestions.tsx` — "Smart suggestions", "Need more X", food names, cal
6. `src/features/dashboard/recents-section.tsx` — "Recent foods", food names, calories
7. `src/features/dashboard/favorites-quick-add.tsx` — "Quick add", "See all", food names, calories
8. `src/features/dashboard/favorites-sheet.tsx` — "Favorites", "Loading…", "No favorites yet", food names, macros
9. `src/features/dashboard/add-action-sheet.tsx` — All 4 action labels + descriptions

### Scanner (5)
10. `src/features/scanner/scanner-sheet.tsx` — All UI strings, ingredient/food translations, numbers
11. `src/features/scanner/barcode-scanner-sheet.tsx` — All UI strings, food translations, numbers
12. `src/features/scanner/add-workout-sheet.tsx` — Activity types, intensity, duration, calories
13. `src/features/scanner/meal-detail-sheet.tsx` — Meal details, ingredients, health score, edit/delete
14. `src/features/scanner/edit-log-sheet.tsx` — Edit entry, macro labels, delete dialog

### Progress (5)
15. `src/features/progress/progress-dashboard.tsx` — All sections: stat cards, range selector, charts, weekly summary
16. `src/features/progress/streak-statistics.tsx` — Streak stats, weekly consistency
17. `src/features/progress/achievements-section.tsx` — 8 achievement badges with labels + descriptions
18. `src/features/progress/water-chart.tsx` — Water intake chart, weekdays, 7-day avg
19. `src/features/progress/workout-history.tsx` — Workout list with food translations, dates/times

### Food Database (2)
20. `src/features/food-database/food-database-sheet.tsx` — Tabs, categories, search, food list
21. `src/features/food-database/create-food-sheet.tsx` — All form labels, macro labels

### Settings (3)
22. `src/features/settings/reminders-sheet.tsx` — Permission prompts, reminder labels, tips
23. `src/features/settings/share-sheet.tsx` — Share card, text template with placeholders, platforms
24. `src/features/settings/edit-sheets.tsx` — Edit profile + Edit goals sheets with all labels

### Other (2)
25. `src/features/onboarding/onboarding-flow.tsx` — All 5 steps (welcome, about, activity, goal, ready)
26. `src/features/paywall/paywall-sheet.tsx` — Premium features, plans, trial button

## i18n.tsx Additions
Added ~60 new translation keys (both `fa` and `en`) to `src/lib/i18n.tsx`:
- Macro labels: `protein`, `carbs`, `fats`
- Insight descriptions with `{0}`, `{1}`, `{2}` placeholders (15 keys)
- Goal celebration titles/descriptions (5 keys)
- Timeline labels (`todayTimeline`, `calTotal`)
- Progress ranges (`range90Days`, `range6Months`, `range1Year`, `rangeAllTime`), `sevenDayAvg`, `weightUnit`, `goalLabel`, `cheatCount`, `todayLabel`
- Scanner extras (`doneEditing`, `newIngredient`, `meal`)
- Edit-log labels (`editEntry`, `titleLabel`, `deleteThisEntry`, `deleteEntryDesc`, `onlyMealMacrosDesc`, `loadingMealDetails`)
- Reminder labels (`gentleNudgesDesc`, `remindersSavedDesc`, `remindersEnabledTitle`, `remindersEnabledBody`, `testReminderTitle`, `testReminderBody`, `tipLabel`)
- Share-sheet templates (`trackingMyNutrition`, `myProgressTitle`, `shareTextTemplate`)
- Edit-sheet labels (`weightKg`, `heightCm`, `proteinG`, `carbsG`, `fatsG`, `yourNamePlaceholder`)
- Onboarding strings (`welcomeToCalAI`, `welcomeDesc`, `unitsCmKg`, activity descriptions, goal descriptions)
- Food database (`cat_all`, `veg`, `drinks`)
- "Need more X" macro variants (`needMoreProtein`, `needMoreCarbs`, `needMoreFats`)
- Quick log toast template (`loggedToast` with `{0}` placeholder)

## Verification
- `bun run lint` → EXIT 0 (no errors, no warnings)
- Dev server returns HTTP 200 on http://localhost:3000/
- Page output verified: `lang="fa" dir="rtl"` with both "DS-Cali" and "دی‌اس‌کالی" strings present
- All 25 fixed files compile successfully (dev log shows `✓ Compiled` for each file change)
- Only log errors are the pre-existing EADDRINUSE message from the dev.sh wrapper trying to start a second Next.js process (harmless; the first process is the actual server)

## Issues / Notes
- `user-management-sheet.tsx` listed in PERSIAN_AUDIT.md does not exist in this codebase — skipped
- The audit's suggested hack `t("proteinLeft").replace(" left", "").replace(" باقیمانده", "")` was NOT used; instead cleaner standalone keys `protein`, `carbs`, `fats` were added to `i18n.tsx` (allowed per task rules)
- All existing i18n keys, date-utils, and food-translations files left intact (only ADDED new keys to i18n.tsx)
- `bottom-nav.tsx` and `settings-screen.tsx` Row component NOT modified (as instructed)
