# Persian Translation Audit Report

## Summary
- **Total feature files**: 32
- **Files WITH i18n (useI18n imported)**: 6
- **Files WITHOUT i18n (English only)**: 26
- **Remaining English strings found**: 80+

---

## Files Needing Translation (26 files)

### Dashboard Components (8 files)
| File | English Strings | Fix |
|------|----------------|-----|
| `nutrition-insights.tsx` | All insight titles/descriptions ("Low on protein", "Protein goal hit!", "Over calorie goal", "Right on track", "Stay hydrated", "Hydration goal met!", "Time for a walk?", "Consistency is paying off", "Protein up/down this week", "Drinking more water", "Eat more/less than usual", "Consistent intake") | Add `useI18n()`, use `t()` for all titles/descriptions |
| `macro-ratio-card.tsx` | "Protein", "Carbs", "Fats", "Macro split", "kcal" | Add `useI18n()`, use `t()` + `formatNumber()` |
| `goal-celebration.tsx` | "Protein goal smashed!", "Hydration goal met!", "Right on track!", "10K steps crushed!" + descriptions | Add `useI18n()`, use `t()` |
| `nutrition-timeline.tsx` | "Today's timeline", "cal total" | Add `useI18n()`, use `t()` + `formatNumber()` |
| `meal-suggestions.tsx` | "Smart suggestions", "Need more [macro]", "cal", food names | Add `useI18n()`, use `t()` + `translateFoodName()` |
| `recents-section.tsx` | "Recent foods", food names, "cal" | Add `useI18n()`, use `t()` + `translateFoodName()` |
| `favorites-quick-add.tsx` | "Quick add", "See all", food names, "cal" | Add `useI18n()`, use `t()` + `translateFoodName()` |
| `favorites-sheet.tsx` | "Favorites", "Loading…", "No favorites yet", food names | Add `useI18n()`, use `t()` + `translateFoodName()` |
| `add-action-sheet.tsx` | "Add to today", "Scan meal", "Barcode scan", "Search foods", "Log workout" + descriptions | Add `useI18n()`, use `t()` |

### Progress Page (5 files)
| File | English Strings | Fix |
|------|----------------|-----|
| `progress-dashboard.tsx` | "Progress", "Last weight", "Days logged", "logged", "Cheat", "Goal Progress", "of goal", "Macro trends (7 days)", "Avg daily macros (7 days)", "Calories", "Goal:", "This week", "Avg steps", "Avg calories", "Avg water", "cups", range labels | Add `useI18n()`, use `t()` + `formatNumber()` + `getWeekdayShort()` |
| `streak-statistics.tsx` | "Streak statistics", "consistent", "day streak", "Current", "Best", "This week", "Meals logged", "Weekly consistency", "days" | Add `useI18n()`, use `t()` + `formatNumber()` |
| `achievements-section.tsx` | "Achievements", "unlocked", "UNLOCKED", "Locked", all 8 badge names + descriptions | Add `useI18n()`, use `t()` + `formatNumber()` |
| `water-chart.tsx` | "Water intake", "Goal:", "today", "of goal", "7-day avg", weekday labels | Add `useI18n()`, use `t()` + `formatNumber()` + `getWeekdayShort()` |
| `workout-history.tsx` | "Workout history", "workouts", "Calories", "Minutes", workout type names, intensity labels, "min" | Add `useI18n()`, use `t()` + `translateFoodName()` + `formatNumber()` + `formatTime()` |

### Scanner (5 files)
| File | English Strings | Fix |
|------|----------------|-----|
| `scanner-sheet.tsx` | "Scanner", "Point your camera at your meal", "Analyzing your meal…", "Scan food", "Try a sample meal:", "Scan another", "Servings", "Health score", nutrition labels, "Fix Results", "Done", "Done editing", "Edit ingredients", "+ Add ingredient", "New ingredient", "Saving…", "Saving photo…" | Add `useI18n()`, use `t()` + `translateFoodName()` + `formatNumber()` |
| `barcode-scanner-sheet.tsx` | "Barcode Scanner", "Looking up product…", "Resume scanning", "Or enter barcode manually:", "Camera unavailable", "Product found", "Servings", nutrition labels, "Log this food", "Saving…" | Add `useI18n()`, use `t()` + `translateFoodName()` |
| `add-workout-sheet.tsx` | "Log workout", "Activity", exercise names, "Duration", "min", "Intensity", "low/medium/high", "Estimated calories burned" | Add `useI18n()`, use `t()` + `formatNumber()` |
| `meal-detail-sheet.tsx` | "Meal details", "Health score", "Excellent nutritional balance", "Moderate balance", "Could be healthier", "Ingredients", "Edit", "Delete", "Delete this meal?", "Cancel", "Loading…" | Add `useI18n()`, use `t()` + `translateFoodName()` + `formatNumber()` |
| `edit-log-sheet.tsx` | "Edit entry", "Title", "Delete this entry?", "Cancel", "Delete", "Save changes", "Saving…", macro labels | Add `useI18n()`, use `t()` |

### Food Database (2 files)
| File | English Strings | Fix |
|------|----------------|-----|
| `food-database-sheet.tsx` | "Food Database", "Describe what you ate", tabs, "Create custom food", "Suggestions", "Loading…", "No foods found", food names, "cal", serving sizes | Add `useI18n()`, use `t()` + `translateFoodName()` + `formatNumber()` |
| `create-food-sheet.tsx` | "Create food", "Food name", "Icon", "Serving size", "Weight (g)", "Calories (per serving)", "Protein", "Carbs", "Fats", "Create & log", "Saving…" | Add `useI18n()`, use `t()` |

### Settings (3 files)
| File | English Strings | Fix |
|------|----------------|-----|
| `reminders-sheet.tsx` | "Reminders", "Enable notifications", "Get gentle nudges", "Enable", "Notifications enabled", "Test", "Save reminders", reminder labels/descriptions, tip text | Add `useI18n()`, use `t()` |
| `share-sheet.tsx` | "Share progress", "Share via…", "Copy text", "Copied!", share text | Add `useI18n()`, use `t()` + `formatNumber()` |
| `edit-sheets.tsx` | "Edit profile", "Name", "Weight (kg)", "Height (cm)", "Save", "Daily goals", "Calories", "Protein (g)", "Carbs (g)", "Fats (g)", "Save goals", "Saving…" | Add `useI18n()`, use `t()` |

### Other (3 files)
| File | English Strings | Fix |
|------|----------------|-----|
| `onboarding-flow.tsx` | "Welcome to CalAI", welcome description, feature highlights, "Get started", "Continue", "Calculate my goals", "You're all set!", "Your daily goals", "Start tracking", step titles, field labels, activity/goal options | Add `useI18n()`, use `t()` |
| `paywall-sheet.tsx` | "CalAI Premium", "Unlock your full potential", feature titles/descriptions, plan labels, "Save 50%", "POPULAR", "Start 7-day free trial", "Restore purchases" | Add `useI18n()`, use `t()` |
| `user-management-sheet.tsx` | "User Management", "Create New User", "User name", "Users", "Switch", "Streak", tip text | Add `useI18n()`, use `t()` |

---

## Proposed Fix Strategy

For each file:
1. Add `import { useI18n } from "@/lib/i18n"` 
2. Add `const { locale, t } = useI18n()` at top of component
3. Add `import { formatNumber, formatTime, formatDate } from "@/lib/date-utils"` where needed
4. Add `import { translateFoodName } from "@/lib/food-translations"` where food names appear
5. Replace all hardcoded English strings with `t("key")` calls
6. Replace all numbers with `formatNumber(num, locale)` 
7. Replace all food/meal names with `translateFoodName(name, locale)`
8. Replace all dates/times with `formatDate()`/`formatTime()`

**Priority order**: Dashboard → Scanner → Progress → Settings → Onboarding → Paywall
