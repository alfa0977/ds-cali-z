"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Locale = "fa" | "en";

// All app strings. Persian is the default.
// `fa` values are RTL Persian text; `en` values are English.
export const translations = {
  // App / brand
  appName: { fa: "دی‌اس‌کالی", en: "DS-Cali" },
  tagline: { fa: "ردیاب هوشمند کالری", en: "AI Calorie Tracker" },

  // Nav
  home: { fa: "خانه", en: "Home" },
  progress: { fa: "پیشرفت", en: "Progress" },
  settings: { fa: "تنظیمات", en: "Settings" },
  add: { fa: "افزودن", en: "Add" },

  // Date
  today: { fa: "امروز", en: "Today" },
  yesterday: { fa: "دیروز", en: "Yesterday" },

  // Home dashboard
  caloriesLeft: { fa: "کالری باقی‌مانده", en: "Calories left" },
  eaten: { fa: "مصرف‌شده", en: "eaten" },
  burned: { fa: "سوزانده‌شده", en: "burned" },
  proteinLeft: { fa: "پروتئین باقی", en: "Protein left" },
  carbsLeft: { fa: "کربوهیدرات باقی", en: "Carbs left" },
  fatsLeft: { fa: "چربی باقی", en: "Fats left" },
  todayIntake: { fa: "مصرف امروز", en: "Today's intake" },
  macroSplit: { fa: "تقسیم درشت‌مغذی‌ها", en: "Macro split" },
  thisWeek: { fa: "این هفته", en: "This week" },
  weeklyHabit: { fa: "عادت هفتگی", en: "Weekly habit" },
  days: { fa: "روز", en: "days" },
  stepsToday: { fa: "گام‌های امروز", en: "Steps today" },
  caloriesBurned: { fa: "کالری سوزانده‌شده", en: "Calories burned" },
  steps: { fa: "گام‌ها", en: "Steps" },
  workout: { fa: "تمرین", en: "Workout" },
  water: { fa: "آب", en: "Water" },
  cups: { fa: "لیوان", en: "cups" },
  quickAdd: { fa: "افزودن سریع", en: "Quick add" },
  seeAll: { fa: "همه", en: "See all" },
  recentFoods: { fa: "غذاهای اخیر", en: "Recent foods" },
  smartSuggestions: { fa: "پیشنهاد هوشمند", en: "Smart suggestions" },
  needMore: { fa: "نیاز به", en: "Need more" },
  meals: { fa: "وعده‌ها", en: "Meals" },
  breakfast: { fa: "صبحانه", en: "Breakfast" },
  lunch: { fa: "ناهار", en: "Lunch" },
  dinner: { fa: "شام", en: "Dinner" },
  snacks: { fa: "میان‌وعده", en: "Snacks" },
  nothingLogged: { fa: "هنوز چیزی ثبت نشده", en: "Nothing logged yet" },
  recentlyLogged: { fa: "ثبت‌شده‌های اخیر", en: "Recently logged" },
  noLogsToday: { fa: "امروز هنوز چیزی ثبت نشده", en: "No logs yet today" },
  tapToAdd: { fa: "برای افزودن روی + بزنید", en: "Tap + to scan a meal or add food." },

  // Insights
  insights: { fa: "بصیرت‌ها", en: "Insights" },
  lowOnProtein: { fa: "پروتئین کم است", en: "Low on protein" },
  proteinGoalHit: { fa: "هدف پروتئین محقق شد! 💪", en: "Protein goal hit! 💪" },
  overCalorieGoal: { fa: "بیش از هدف کالری", en: "Over calorie goal" },
  rightOnTrack: { fa: "در مسیر درست", en: "Right on track" },
  stayHydrated: { fa: "هیدراته بمانید", en: "Stay hydrated" },
  hydrationGoalMet: { fa: "هدف آبرسانی محقق شد! 💧", en: "Hydration goal met! 💧" },
  stepsCrushed: { fa: "۱۰هزار گام محقق شد! 🚶", en: "10K steps crushed! 🚶" },
  timeForWalk: { fa: "وقت یک قدم زدن؟", en: "Time for a walk?" },
  dayStreak: { fa: "روز استمرار! 🔥", en: "day streak! 🔥" },
  consistencyIsKey: { fa: "استمرار کلید موفقیت است. به ثبت کردن ادامه دهید!", en: "Consistency is paying off. Keep logging to build your streak!" },
  eatingMore: { fa: "بیشتر از حد معمول می‌خورید", en: "Eating more than usual" },
  eatingLess: { fa: "کمتر از حد معمول می‌خورید", en: "Eating less than usual" },
  consistentIntake: { fa: "مصرف ثابت", en: "Consistent intake" },
  proteinUp: { fa: "پروتئین این هفته بیشتر است", en: "Protein up this week" },
  proteinDown: { fa: "پروتئین این هفته کمتر است", en: "Protein down this week" },
  drinkingMoreWater: { fa: "آب بیشتری می‌نوشید 💧", en: "Drinking more water 💧" },
  drinkMoreWater: { fa: "آب بیشتری بنوشید", en: "Drink more water" },

  // Scanner
  scanner: { fa: "اسکنر", en: "Scanner" },
  pointCamera: { fa: "دوربین را به سمت غذا بگیرید", en: "Point your camera at your meal" },
  scanFood: { fa: "اسکن غذا", en: "Scan food" },
  analyzing: { fa: "در حال تحلیل غذا…", en: "Analyzing your meal…" },
  trySample: { fa: "یک غذای نمونه امتحان کنید:", en: "Try a sample meal:" },
  scanAnother: { fa: "اسکن بعدی", en: "Scan another" },
  nutrition: { fa: "تغذیه", en: "Nutrition" },
  fixResults: { fa: "اصلاح نتایج", en: "Fix Results" },
  done: { fa: "تأیید", en: "Done" },
  servings: { fa: "وعده", en: "Servings" },
  healthScore: { fa: "امتیاز سلامت", en: "Health score" },
  editIngredients: { fa: "ویرایش مواد تشکیل‌دهنده", en: "Edit ingredients" },
  addIngredient: { fa: "+ افزودن ماده", en: "+ Add ingredient" },

  // Food database
  foodDatabase: { fa: "پایگاه غذایی", en: "Food Database" },
  describeWhatYouAte: { fa: "توضیح دهید چه خوردید", en: "Describe what you ate" },
  all: { fa: "همه", en: "All" },
  myMeals: { fa: "وعده‌های من", en: "My meals" },
  myFoods: { fa: "غذاهای من", en: "My foods" },
  savedScans: { fa: "اسکن‌های ذخیره‌شده", en: "Saved scans" },
  createCustomFood: { fa: "ساخت غذای دلخواه", en: "Create custom food" },
  suggestions: { fa: "پیشنهادات", en: "Suggestions" },
  noFoodsFound: { fa: "غذایی یافت نشد.", en: "No foods found." },
  loading: { fa: "در حال بارگذاری…", en: "Loading…" },

  // Categories
  cat_protein: { fa: "پروتئین", en: "Protein" },
  cat_grain: { fa: "غلات", en: "Grains" },
  cat_vegetable: { fa: "سبزیجات", en: "Vegetables" },
  cat_fruit: { fa: "میوه", en: "Fruit" },
  cat_dairy: { fa: "لبنیات", en: "Dairy" },
  cat_snack: { fa: "تنقلات", en: "Snacks" },
  cat_beverage: { fa: "نوشیدنی", en: "Beverages" },
  cat_fat: { fa: "چربی‌ها", en: "Fats" },
  cat_sauce: { fa: "سس‌ها", en: "Sauces" },

  // Progress
  lastWeight: { fa: "آخرین وزن", en: "Last weight" },
  daysLogged: { fa: "روزهای ثبت‌شده", en: "Days logged" },
  daysLoggedShort: { fa: "ثبت‌شده", en: "logged" },
  cheat: { fa: "تقلب", en: "Cheat" },
  goalProgress: { fa: "پیشرفت هدف", en: "Goal Progress" },
  ofGoal: { fa: "از هدف", en: "of goal" },
  macroTrends: { fa: "روند درشت‌مغذی‌ها (۷ روز)", en: "Macro trends (7 days)" },
  avgDailyMacros: { fa: "میانگین درشت‌مغذی‌های روزانه", en: "Avg daily macros (7 days)" },
  greatJob: { fa: "آفرین! استمرار کلید موفقیت است و تو در آن استادی! 💪", en: "Great job! Consistency is key, and you're mastering it! 💪" },
  thisWeekSummary: { fa: "این هفته", en: "This week" },
  avgSteps: { fa: "میانگین گام", en: "Avg steps" },
  avgCalories: { fa: "میانگین کالری", en: "Avg calories" },
  avgWater: { fa: "میانگین آب", en: "Avg water" },
  waterIntake: { fa: "مصرف آب", en: "Water intake" },
  workoutHistory: { fa: "تاریخچه تمرین", en: "Workout history" },
  workouts: { fa: "تمرین", en: "workouts" },
  calories: { fa: "کالری", en: "Calories" },
  minutes: { fa: "دقیقه", en: "Minutes" },
  achievements: { fa: "دستاوردها", en: "Achievements" },
  unlocked: { fa: "باز‌شده", en: "unlocked" },
  streakStatistics: { fa: "آمار استمرار", en: "Streak statistics" },
  consistent: { fa: "منظم", en: "consistent" },
  weeklyConsistency: { fa: "سازگاری هفتگی", en: "Weekly consistency" },
  current: { fa: "فعلی", en: "Current" },
  best: { fa: "بهترین", en: "Best" },
  mealsLogged: { fa: "وعده‌های ثبت‌شده", en: "Meals logged" },

  // Achievements
  firstScan: { fa: "اولین اسکن", en: "First Scan" },
  firstScanDesc: { fa: "اولین وعده را با هوش مصنوعی ثبت کنید", en: "Log your first meal with AI" },
  streak3: { fa: "۳ روز استمرار", en: "3-Day Streak" },
  streak3Desc: { fa: "۳ روز پشت سر هم ثبت کنید", en: "Log meals 3 days in a row" },
  weekWarrior: { fa: "مبارز هفته", en: "Week Warrior" },
  weekWarriorDesc: { fa: "۷ روز استمرار در ثبت", en: "7-day logging streak" },
  monthlyMaster: { fa: "استاد ماهانه", en: "Monthly Master" },
  monthlyMasterDesc: { fa: "۳۰ روز استمرار در ثبت", en: "30-day logging streak" },
  steps10k: { fa: "۱۰هزار گام", en: "10K Steps" },
  steps10kDesc: { fa: "۱۰هزار گام در یک روز", en: "Hit 10,000 steps in a day" },
  hydrated: { fa: "هیدراته", en: "Hydrated" },
  hydratedDesc: { fa: "۲.۵ لیتر آب بنوشید", en: "Drink 2.5L of water" },
  mealLogger: { fa: "ثبت‌کننده وعده", en: "Meal Logger" },
  mealLoggerDesc: { fa: "۱۰ وعده غذایی ثبت کنید", en: "Log 10 meals total" },
  perfectWeek: { fa: "هفته کامل", en: "Perfect Week" },
  perfectWeekDesc: { fa: "تمام ۷ روز هفته را ثبت کنید", en: "Log all 7 days this week" },
  unlockedLabel: { fa: "باز شد", en: "UNLOCKED" },
  locked: { fa: "قفل", en: "Locked" },

  // Settings
  appearance: { fa: "ظاهر", en: "Appearance" },
  reminders: { fa: "یادآوری‌ها", en: "Reminders" },
  shareProgress: { fa: "اشتراک پیشرفت", en: "Share progress" },
  healthConnections: { fa: "اتصالات سلامت", en: "Health connections" },
  connected: { fa: "متصل", en: "Connected" },
  privacyData: { fa: "حریم خصوصی و داده", en: "Privacy & data" },
  data: { fa: "داده", en: "Data" },
  exportJson: { fa: "خروجی JSON", en: "Export as JSON" },
  exportCsv: { fa: "خروجی CSV", en: "Export as CSV" },
  importJson: { fa: "ورود از JSON", en: "Import from JSON" },
  logOut: { fa: "خروج از حساب", en: "Log out" },
  deleteAccount: { fa: "حذف حساب", en: "Delete account" },
  dailyGoals: { fa: "اهداف روزانه", en: "Daily goals" },
  edit: { fa: "ویرایش", en: "Edit" },
  editProfile: { fa: "ویرایش پروفایل", en: "Edit profile" },
  editGoals: { fa: "ویرایش اهداف", en: "Daily goals" },
  save: { fa: "ذخیره", en: "Save" },
  saveChanges: { fa: "ذخیره تغییرات", en: "Save changes" },
  saveGoals: { fa: "ذخیره اهداف", en: "Save goals" },
  saveReminders: { fa: "ذخیره یادآوری‌ها", en: "Save reminders" },
  name: { fa: "نام", en: "Name" },
  age: { fa: "سن", en: "Age" },
  height: { fa: "قد", en: "Height" },
  weight: { fa: "وزن", en: "Weight" },
  biologicalSex: { fa: "جنسیت بیولوژیکی", en: "Biological sex" },
  male: { fa: "مرد", en: "male" },
  female: { fa: "زن", en: "female" },
  other: { fa: "سایر", en: "other" },
  activityLevel: { fa: "سطح فعالیت", en: "Activity level" },
  sedentary: { fa: "بی‌تحرک", en: "Sedentary" },
  lightlyActive: { fa: "کم‌فعال", en: "Lightly active" },
  moderatelyActive: { fa: "متوسط فعال", en: "Moderately active" },
  veryActive: { fa: "بسیار فعال", en: "Very active" },
  extraActive: { fa: "فوق فعال", en: "Extra active" },
  yourGoal: { fa: "هدف شما", en: "Your goal" },
  loseWeight: { fa: "کاهش وزن", en: "Lose weight" },
  maintainWeight: { fa: "حفظ وزن", en: "Maintain weight" },
  gainMuscle: { fa: "افزایش عضله", en: "Gain muscle" },
  calculateMyGoals: { fa: "محاسبه اهداف من", en: "Calculate my goals" },
  startTracking: { fa: "شروع ثبت", en: "Start tracking" },
  getStarted: { fa: "شروع کنید", en: "Get started" },
  continue: { fa: "ادامه", en: "Continue" },
  welcomeTo: { fa: "خوش آمدید به", en: "Welcome to" },
  aboutYou: { fa: "درباره شما", en: "About you" },
  personalizeExperience: { fa: "تجربه خود را شخصی‌سازی کنیم", en: "Let's personalize your experience" },
  howActiveDayToday: { fa: "روزانه چقدر فعال هستید؟", en: "How active are you day-to-day?" },
  whatDoYouWantToAchieve: { fa: "چه چیزی می‌خواهید به دست آورید؟", en: "What do you want to achieve?" },
  youreAllSet: { fa: "همه چیز آماده است!", en: "You're all set!" },
  yourDailyGoals: { fa: "اهداف روزانه شما", en: "Your daily goals" },
  snapPhotoInstantNutrition: { fa: "عکس بگیرید، تغذیه فوری", en: "Snap a photo, get instant nutrition" },
  personalizedMacroGoals: { fa: "اهداف درشت‌مغذی شخصی‌سازی‌شده", en: "Personalized macro goals" },
  trackProgressOverTime: { fa: "ردیابی پیشرفت در طول زمان", en: "Track progress over time" },

  // Paywall
  calaiPremium: { fa: "DS-Cali پرمیوم", en: "DS-Cali Premium" },
  unlockYourFullPotential: { fa: "پتانسیل کامل خود را باز کنید", en: "Unlock your full potential" },
  unlimitedAiScans: { fa: "اسکن نامحدود هوش مصنوعی", en: "Unlimited AI scans" },
  scanEveryMealNoLimits: { fa: "هر وعده را اسکن کنید، بدون محدودیت", en: "Scan every meal, no daily limits" },
  advancedAnalytics: { fa: "تحلیل‌های پیشرفته", en: "Advanced analytics" },
  deepInsightsTrends: { fa: "بینش عمیق و روندها در طول زمان", en: "Deep insights & trends over time" },
  smartGoals: { fa: "اهداف هوشمند", en: "Smart goals" },
  aiPersonalizedMacroTargets: { fa: "اهداف درشت‌مغذی شخصی‌سازی‌شده با هوش مصنوعی", en: "AI-personalized macro targets" },
  adFreeExperience: { fa: "تجربه بدون تبلیغ", en: "Ad-free experience" },
  noInterruptionsEver: { fa: "بدون قطع، برای همیشه", en: "No interruptions, ever" },
  yearly: { fa: "سالانه", en: "Yearly" },
  monthly: { fa: "ماهانه", en: "Monthly" },
  perYear: { fa: "/سال", en: "/year" },
  perMonth: { fa: "/ماه", en: "/month" },
  save50: { fa: "۵۰٪ تخفیف", en: "Save 50%" },
  popular: { fa: "محبوب", en: "POPULAR" },
  start7DayFreeTrial: { fa: "شروع ۷ روز آزمایش رایگان", en: "Start 7-day free trial" },
  restorePurchases: { fa: "بازیابی خریدها", en: "Restore purchases" },

  // Add action sheet
  addToToday: { fa: "افزودن به امروز", en: "Add to today" },
  scanMeal: { fa: "اسکن وعده", en: "Scan meal" },
  aiPoweredFoodRecognition: { fa: "تشخیص غذا با هوش مصنوعی", en: "AI-powered food recognition" },
  barcodeScan: { fa: "اسکن بارکد", en: "Barcode scan" },
  lookUpPackagedFoods: { fa: "جستجوی غذاهای بسته‌بندی‌شده", en: "Look up packaged foods" },
  searchFoods: { fa: "جستجوی غذاها", en: "Search foods" },
  browseFoodDatabase: { fa: "مرور پایگاه غذایی", en: "Browse the food database" },
  logWorkout: { fa: "ثبت تمرین", en: "Log workout" },
  trackExercise: { fa: "تمرین خود را ثبت کنید", en: "Track your exercise" },

  // Workout
  activity: { fa: "فعالیت", en: "Activity" },
  running: { fa: "دویدن", en: "Running" },
  weightLifting: { fa: "وزنه‌برداری", en: "Weight lifting" },
  cycling: { fa: "دوچرخه‌سواری", en: "Cycling" },
  cardio: { fa: "هوازی", en: "Cardio" },
  walking: { fa: "پیاده‌روی", en: "Walking" },
  swimming: { fa: "شنا", en: "Swimming" },
  yoga: { fa: "یوگا", en: "Yoga" },
  hiit: { fa: "تمرین شدید", en: "HIIT" },
  duration: { fa: "مدت", en: "Duration" },
  intensity: { fa: "شدت", en: "Intensity" },
  low: { fa: "کم", en: "low" },
  medium: { fa: "متوسط", en: "medium" },
  high: { fa: "زیاد", en: "high" },
  estimatedCaloriesBurned: { fa: "کالری تخمینی سوزانده‌شده", en: "Estimated calories burned" },

  // Barcode
  barcodeScanner: { fa: "اسکنر بارکد", en: "Barcode Scanner" },
  resumeScanning: { fa: "ادامه اسکن", en: "Resume scanning" },
  orEnterBarcodeManually: { fa: "یا بارکد را دستی وارد کنید:", en: "Or enter barcode manually:" },
  lookingUpProduct: { fa: "در حال جستجوی محصول…", en: "Looking up product…" },
  productFound: { fa: "محصول یافت شد", en: "Product found" },
  logThisFood: { fa: "ثبت این غذا", en: "Log this food" },

  // Meal detail
  mealDetails: { fa: "جزئیات وعده", en: "Meal details" },
  ingredients: { fa: "مواد تشکیل‌دهنده", en: "Ingredients" },
  excellentNutritionalBalance: { fa: "تعادل تغذیه‌ای عالی", en: "Excellent nutritional balance" },
  moderateBalance: { fa: "تعادل متوسط", en: "Moderate balance" },
  couldBeHealthier: { fa: "می‌تواند سالم‌تر باشد", en: "Could be healthier" },
  addToFavorites: { fa: "افزودن به علاقه‌مندی‌ها", en: "Add to favorites" },
  delete: { fa: "حذف", en: "Delete" },
  deleteThisMeal: { fa: "حذف این وعده؟", en: "Delete this meal?" },
  thisPermanentlyRemoves: { fa: "این کار وعده و ثبت آن را برای همیشه حذف می‌کند.", en: "This permanently removes the meal and its log entry." },

  // Favorites
  favorites: { fa: "علاقه‌مندی‌ها", en: "Favorites" },
  noFavoritesYet: { fa: "هنوز علاقه‌مندی‌ای نیست", en: "No favorites yet" },
  tapStarToSave: { fa: "روی ستاره هر وعده بزنید تا اینجا ذخیره شود.", en: "Tap the star on any meal to save it here for quick logging." },

  // Reminders
  enableNotifications: { fa: "فعال‌سازی اعلان‌ها", en: "Enable notifications" },
  getGentleNudges: { fa: "یادآوری ملایم برای ثبت وعده‌ها", en: "Get gentle nudges to log meals" },
  enable: { fa: "فعال‌سازی", en: "Enable" },
  notificationsEnabled: { fa: "اعلان‌ها فعال شد", en: "Notifications enabled" },
  test: { fa: "آزمایش", en: "Test" },
  remindersTip: { fa: "یادآوری‌ها روی این دستگاه ذخیره می‌شوند. مرورگر را باز نگه دارید تا اعلان‌ها دریافت کنید.", en: "Reminders are saved on this device. Keep your browser open to receive notifications." },
  logBreakfast: { fa: "ثبت صبحانه", en: "Log breakfast" },
  startYourDayRight: { fa: "روز خود را خوب شروع کنید", en: "Start your day right" },
  logLunch: { fa: "ثبت ناهار", en: "Log lunch" },
  dontForgetMiddayMeals: { fa: "وعده‌های ناهار را فراموش نکنید", en: "Don't forget midday meals" },
  logDinner: { fa: "ثبت شام", en: "Log dinner" },
  trackYourEveningMeal: { fa: "وعده عصرانه خود را ثبت کنید", en: "Track your evening meal" },
  drinkWater: { fa: "آب بنوشید", en: "Drink water" },
  stayHydratedEvery2h: { fa: "هر ۲ ساعت هیدراته بمانید", en: "Stay hydrated every 2 hours" },

  // Share
  shareVia: { fa: "اشتراک‌گذاری از طریق…", en: "Share via…" },
  copyText: { fa: "کپی متن", en: "Copy text" },
  copied: { fa: "کپی شد!", en: "Copied!" },

  // Create food
  createFood: { fa: "ساخت غذا", en: "Create food" },
  foodName: { fa: "نام غذا", en: "Food name" },
  icon: { fa: "آیکون", en: "Icon" },
  servingSize: { fa: "اندازه وعده", en: "Serving size" },
  weightG: { fa: "وزن (گرم)", en: "Weight (g)" },
  caloriesPerServing: { fa: "کالری (هر وعده)", en: "Calories (per serving)" },
  createAndLog: { fa: "ساخت و ثبت", en: "Create & log" },

  // Language
  language: { fa: "زبان", en: "Language" },
  persian: { fa: "فارسی", en: "Persian" },
  english: { fa: "انگلیسی", en: "English" },

  // Theme color
  themeColor: { fa: "رنگ تم", en: "Theme color" },
  themeOrange: { fa: "نارنجی", en: "Orange" },
  themeGreen: { fa: "سبز", en: "Green" },
  themePurple: { fa: "بنفش", en: "Purple" },
  themeRose: { fa: "گل‌بهی", en: "Rose" },
  themeTeal: { fa: "فیروزه‌ای", en: "Teal" },

  // Challenges
  challenges: { fa: "چالش‌ها", en: "Challenges" },
  activeChallenges: { fa: "چالش‌های فعال", en: "Active Challenges" },
  noActiveChallenges: { fa: "هیچ چالش فعالی نیست", en: "No active challenges" },
  joinChallenge: { fa: "پیوستن به چالش", en: "Join Challenge" },
  challengeProgress: { fa: "پیشرفت چالش", en: "Challenge Progress" },
  days: { fa: "روز", en: "days" },
  reward: { fa: "جایزه", en: "Reward" },
  complete: { fa: "تکمیل", en: "Complete" },
  completed: { fa: "تکمیل شد", en: "Completed" },
  join: { fa: "پیوستن", en: "Join" },
  leave: { fa: "ترک", en: "Leave" },
  waterWeekChallenge: { fa: "هفته آبرسانی", en: "Hydration Week" },
  waterWeekDesc: { fa: "۷ روز پیاپی ۲.۵ لیتر آب بنوشید", en: "Drink 2.5L water for 7 days straight" },
  proteinBoostChallenge: { fa: "افزایش پروتئین", en: "Protein Boost" },
  proteinBoostDesc: { fa: "۵ روز به هدف پروتئین برسید", en: "Hit your protein goal 5 days" },
  stepMasterChallenge: { fa: "استاد گام", en: "Step Master" },
  stepMasterDesc: { fa: "۳ روز به ۱۰هزار گام برسید", en: "Reach 10K steps 3 days" },
  cleanEatingChallenge: { fa: "تغذیه سالم", en: "Clean Eating" },
  cleanEatingDesc: { fa: "۷ روز وعده با امتیاز سلامت ۷۰+ ثبت کنید", en: "Log meals with 70+ health score 7 days" },
  streakWarriorChallenge: { fa: "مبارز استمرار", en: "Streak Warrior" },
  streakWarriorDesc: { fa: "۱۰ روز پیاپی ثبت کنید", en: "Log meals 10 days in a row" },

  // Misc
  cal: { fa: "کال", en: "cal" },
  kcal: { fa: "کیلوکالری", en: "kcal" },
  g: { fa: "گ", en: "g" },
  min: { fa: "دقیقه", en: "min" },
  L: { fa: "لیتر", en: "L" },
  ml: { fa: "میلی‌لیتر", en: "ml" },
  flOz: { fa: "اونس", en: "fl oz" },
  kg: { fa: "کیلوگرم", en: "kg" },
  cm: { fa: "سانتی‌متر", en: "cm" },
  goal: { fa: "هدف", en: "Goal" },
  ofGoalDone: { fa: "از هدف انجام شد", en: "of goal done" },
  avg: { fa: "میانگین", en: "avg" },
  cancel: { fa: "انصراف", en: "Cancel" },
  saving: { fa: "در حال ذخیره…", en: "Saving…" },
  savingPhoto: { fa: "در حال ذخیره عکس…", en: "Saving photo…" },
  scanMealLogged: { fa: "وعده اسکن شد!", en: "Meal analyzed!" },
  mealLogged: { fa: "وعده ثبت شد", en: "Meal logged" },
  foodLogged: { fa: "غذا ثبت شد", en: "Food logged" },
  workoutLogged: { fa: "تمرین ثبت شد", en: "Workout logged" },
  entryDeleted: { fa: "ورودی حذف شد", en: "Entry deleted" },
  entryUpdated: { fa: "ورودی به‌روزرسانی شد", en: "Entry updated" },
  profileUpdated: { fa: "پروفایل به‌روزرسانی شد", en: "Profile updated" },
  addedToFavorites: { fa: "به علاقه‌مندی‌ها اضافه شد", en: "Added to favorites" },
  removedFromFavorites: { fa: "از علاقه‌مندی‌ها حذف شد", en: "Removed from favorites" },
  copiedToClipboard: { fa: "در کلیپ‌بورد کپی شد!", en: "Copied to clipboard!" },
  exportingData: { fa: "در حال خروجی گرفتن داده…", en: "Exporting data" },
  invalidJsonFile: { fa: "فایل JSON نامعتبر", en: "Invalid JSON file" },
  testNotificationSent: { fa: "اعلان آزمایشی ارسال شد", en: "Test notification sent" },
  notificationsEnabledToast: { fa: "اعلان‌ها فعال شد!", en: "Notifications enabled!" },
  notificationPermissionDenied: { fa: "مجوز اعلان رد شد", en: "Notification permission denied" },
  welcomeToast: { fa: "به DS-Cali خوش آمدید! 🎉", en: "Welcome to DS-Cali! 🎉" },
  onboardingFailed: { fa: "تکمیل راه‌اندازی ناموفق بود", en: "Failed to complete onboarding" },
  cameraUnavailable: { fa: "دوربین در دسترس نیست. بارکد را دستی وارد کنید.", en: "Camera unavailable. Enter the barcode manually." },
  lookupFailed: { fa: "جستجو ناموفق بود", en: "Lookup failed" },
  productNotFound: { fa: "محصول یافت نشد", en: "Product not found" },
  analysisFailed: { fa: "تحلیل ناموفق بود", en: "Analysis failed" },
  failedToLogMeal: { fa: "ثبت وعده ناموفق بود", en: "Failed to log meal" },
  failedToLogFood: { fa: "ثبت غذا ناموفق بود", en: "Failed to log food" },
  failedToLogWorkout: { fa: "ثبت تمرین ناموفق بود", en: "Failed to log workout" },
  failedToDelete: { fa: "حذف ناموفق بود", en: "Failed to delete" },
  failedToUpdate: { fa: "به‌روزرسانی ناموفق بود", en: "Failed to update" },
  failedToAddFavorite: { fa: "افزودن به علاقه‌مندی‌ها ناموفق بود", en: "Failed to add favorite" },
  failedToLoadFavorites: { fa: "بارگذاری علاقه‌مندی‌ها ناموفق بود", en: "Failed to load favorites" },
  failedToImport: { fa: "ورود داده ناموفق بود", en: "Failed to import data" },
  failedToLoadDashboard: { fa: "بارگذاری داشبورد ناموفق بود", en: "Failed to load dashboard" },
} as const;

export type TranslationKey = keyof typeof translations;

interface I18nContext {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
  dir: "rtl" | "ltr";
}

const I18nContext = createContext<I18nContext | null>(null);

const STORAGE_KEY = "ds-cali-locale";

export function I18nProvider({ children }: { children: ReactNode }) {
  // Default to Persian (fa). Read from localStorage on mount.
  const [locale, setLocaleState] = useState<Locale>("fa");

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
        if (saved === "fa" || saved === "en") {
          setLocaleState(saved);
        }
      } catch {}
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {}
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "fa" ? "rtl" : "ltr";
  }, [locale]);

  const setLocale = (l: Locale) => setLocaleState(l);
  const t = (key: TranslationKey) => translations[key]?.[locale] ?? String(key);
  const dir = locale === "fa" ? "rtl" : "ltr";

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, dir }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Fallback for SSR / pre-provider
    return {
      locale: "fa" as Locale,
      setLocale: () => {},
      t: (key: TranslationKey) => translations[key]?.fa ?? String(key),
      dir: "rtl" as const,
    };
  }
  return ctx;
}
