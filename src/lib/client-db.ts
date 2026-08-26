// Client-side database using IndexedDB — replaces all server-side API routes.
// This allows the app to work fully offline inside a Capacitor APK.
import { openDB, type IDBPDatabase } from "idb";
import { calculateMacros } from "@/lib/ai-engine";

const DB_NAME = "ds-cali-db";
const DB_VERSION = 1;

export interface ClientUser {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  goals: { calories: number; protein: number; carbs: number; fat: number };
  weightKg: number | null;
  heightCm: number | null;
  age: number | null;
  sex: string | null;
  activityLevel: string | null;
  goal: string | null;
  onboarded: boolean;
  subscriptionStatus: string;
  streak: number;
  createdAt: string;
  lastLoginAt: string;
}

export interface ClientFood {
  id: string;
  name: string;
  servingSize: string;
  servingWeightGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: string;
  barcode: string | null;
  densityGramsPerMl: number | null;
  category: string | null;
  emoji: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface ClientMeal {
  id: string;
  userId: string;
  source: string;
  ingredients: string; // JSON string
  macros: string; // JSON string
  healthScore: number;
  imageUrl: string | null;
  title: string | null;
  mealSlot: string | null;
  createdAt: string;
}

export interface ClientLog {
  id: string;
  userId: string;
  type: string;
  mealId: string | null;
  macros: string | null;
  waterMl: number | null;
  workoutSummary: string | null;
  imageUrl: string | null;
  title: string | null;
  mealSlot: string | null;
  timestamp: string;
  corrected: boolean;
}

export interface ClientHealthDaily {
  id: string;
  userId: string;
  date: string;
  steps: number;
  activeEnergyKcal: number;
  waterMl: number;
  weightKg: number | null;
  workouts: string;
  updatedAt: string;
}

export interface ClientFavorite {
  id: string;
  userId: string;
  name: string;
  emoji: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string | null;
  createdAt: string;
}

let dbInstance: IDBPDatabase | null = null;

async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("users")) db.createObjectStore("users", { keyPath: "id" });
      if (!db.objectStoreNames.contains("foods")) db.createObjectStore("foods", { keyPath: "id" });
      if (!db.objectStoreNames.contains("meals")) db.createObjectStore("meals", { keyPath: "id" });
      if (!db.objectStoreNames.contains("logs")) db.createObjectStore("logs", { keyPath: "id" });
      if (!db.objectStoreNames.contains("healthDaily")) db.createObjectStore("healthDaily", { keyPath: "id" });
      if (!db.objectStoreNames.contains("favorites")) db.createObjectStore("favorites", { keyPath: "id" });
    },
  });
  return dbInstance;
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function parseJSON<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try { return JSON.parse(s) as T; } catch { return fallback; }
}

// ============ USER ============

export async function ensureUser(): Promise<ClientUser> {
  const db = await getDB();
  let user = await db.get("users", "demo");
  if (!user) {
    user = {
      id: "demo",
      email: "demo@ds-cali.app",
      displayName: "Alex Carter",
      avatarUrl: null,
      goals: { calories: 2500, protein: 150, carbs: 250, fat: 70 },
      weightKg: 78,
      heightCm: 178,
      age: null,
      sex: null,
      activityLevel: null,
      goal: null,
      onboarded: false,
      subscriptionStatus: "trialing",
      streak: 15,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    await db.put("users", user);
  }
  return user;
}

export async function getActiveUserId(): Promise<string> {
  const user = await ensureUser();
  return user.id;
}

export async function updateUser(data: Partial<ClientUser>): Promise<ClientUser> {
  const db = await getDB();
  const user = await ensureUser();
  const updated = { ...user, ...data };
  if (data.goals) updated.goals = data.goals;
  await db.put("users", updated);
  return updated;
}

export async function onboardUser(data: {
  displayName: string; sex: string; age: number; heightCm: number; weightKg: number;
  activityLevel: string; goal: string;
}): Promise<{ user: ClientUser; goals: { calories: number; protein: number; carbs: number; fat: number } }> {
  const bmrBase = 10 * data.weightKg + 6.25 * data.heightCm - 5 * data.age;
  const bmr = data.sex === "male" ? bmrBase + 5 : bmrBase - 161;
  const factors: Record<string, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
  let tdee = bmr * (factors[data.activityLevel] ?? 1.2);
  if (data.goal === "lose") tdee -= 500;
  else if (data.goal === "gain") tdee += 400;
  const goals = {
    calories: Math.round(tdee),
    protein: Math.round((tdee * 0.3) / 4),
    carbs: Math.round((tdee * 0.4) / 4),
    fat: Math.round((tdee * 0.3) / 9),
  };
  const updated = await updateUser({
    displayName: data.displayName, sex: data.sex, age: data.age, heightCm: data.heightCm,
    weightKg: data.weightKg, activityLevel: data.activityLevel, goal: data.goal,
    goals, onboarded: true,
  });
  return { user: updated, goals };
}

// ============ FOODS ============

export async function searchFoods(q: string, category?: string, limit = 60): Promise<ClientFood[]> {
  const db = await getDB();
  let foods = await db.getAll("foods");
  if (q.trim()) {
    const ql = q.trim().toLowerCase();
    foods = foods.filter((f: ClientFood) => f.name.toLowerCase().includes(ql));
  }
  if (category && category !== "All") {
    foods = foods.filter((f: ClientFood) => f.category === category);
  }
  return foods.sort((a: ClientFood, b: ClientFood) => a.name.localeCompare(b.name)).slice(0, limit);
}

export async function seedFoods(): Promise<void> {
  const db = await getDB();
  const count = await db.count("foods");
  if (count > 0) return;
  // Minimal seed — the full 96 foods are in the seed script
  const { STARTER_FOODS, PERSIAN_FOODS } = await import("./seed-data");
  const all = [...STARTER_FOODS, ...PERSIAN_FOODS];
  for (const f of all) {
    await db.put("foods", {
      id: genId(),
      name: f[0], servingSize: f[1], servingWeightGrams: f[2],
      calories: f[3], protein: f[4], carbs: f[5], fat: f[6],
      category: f[7], emoji: f[8], densityGramsPerMl: f[9],
      barcode: f[10] ?? null, source: "database", createdBy: null,
      createdAt: new Date().toISOString(),
    });
  }
  // Seed health data
  await seedHealthData();
  // Seed sample meals
  await seedSampleMeals();
}

async function seedHealthData(): Promise<void> {
  const db = await getDB();
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const steps = 6000 + Math.floor(Math.random() * 5500);
    await db.put("healthDaily", {
      id: genId(), userId: "demo", date: key,
      steps, activeEnergyKcal: Math.floor(steps * 0.035) + Math.floor(Math.random() * 80),
      waterMl: 1200 + Math.floor(Math.random() * 1200),
      weightKg: Math.round((78 - i * 0.15 + (Math.random() - 0.5) * 0.4) * 10) / 10,
      workouts: i % 3 === 0 ? JSON.stringify([{ type: "Weight lifting", durationMinutes: 45, intensity: "medium", caloriesBurned: 180 }]) : "[]",
      updatedAt: new Date().toISOString(),
    });
  }
}

async function seedSampleMeals(): Promise<void> {
  const userId = await getActiveUserId();
  const samples = [
    {
      title: "Greek Yogurt with Blueberries",
      ingredients: [{ name: "Greek Yogurt", estimatedWeightGrams: 227, confidence: 0.9 }, { name: "Blueberries", estimatedWeightGrams: 80, confidence: 0.85 }, { name: "Honey", estimatedWeightGrams: 15, confidence: 0.7 }],
      macros: { calories: 215, protein: 19, carbs: 30, fat: 3 },
      healthScore: 82, mealSlot: "breakfast",
    },
    {
      title: "Grilled Chicken Salad",
      ingredients: [{ name: "Chicken Breast", estimatedWeightGrams: 150, confidence: 0.92 }, { name: "Spinach", estimatedWeightGrams: 60, confidence: 0.8 }, { name: "Avocado", estimatedWeightGrams: 80, confidence: 0.85 }],
      macros: { calories: 410, protein: 50, carbs: 14, fat: 18 },
      healthScore: 90, mealSlot: "lunch",
    },
  ];
  for (const s of samples) {
    const mealId = genId();
    const now = new Date();
    now.setHours(now.getHours() - 3);
    await (await getDB()).put("meals", {
      id: mealId, userId, source: "ai",
      ingredients: JSON.stringify(s.ingredients),
      macros: JSON.stringify(s.macros),
      healthScore: s.healthScore, imageUrl: null,
      title: s.title, mealSlot: s.mealSlot, createdAt: now.toISOString(),
    });
    await (await getDB()).put("logs", {
      id: genId(), userId, type: "meal", mealId,
      macros: JSON.stringify(s.macros), title: s.title,
      mealSlot: s.mealSlot, timestamp: now.toISOString(),
      imageUrl: null, workoutSummary: null, waterMl: null, corrected: false,
    });
  }
  // Water logs
  for (let i = 0; i < 3; i++) {
    const t = new Date();
    t.setHours(t.getHours() - (5 - i) * 2);
    await (await getDB()).put("logs", {
      id: genId(), userId, type: "water", waterMl: 250,
      timestamp: t.toISOString(), mealId: null, macros: null,
      workoutSummary: null, imageUrl: null, title: null, mealSlot: null, corrected: false,
    });
  }
  // Workout log
  const wt = new Date();
  wt.setHours(wt.getHours() - 6);
  await (await getDB()).put("logs", {
    id: genId(), userId, type: "workout", title: "Morning Run",
    workoutSummary: JSON.stringify({ type: "Running", durationMinutes: 30, intensity: "high", caloriesBurned: 320 }),
    timestamp: wt.toISOString(), mealId: null, macros: null,
    waterMl: null, imageUrl: null, mealSlot: null, corrected: false,
  });
}

export async function createFood(data: {
  name: string; servingSize: string; servingWeightGrams: number;
  calories: number; protein: number; carbs: number; fat: number;
  emoji?: string; category?: string;
}): Promise<ClientFood> {
  const db = await getDB();
  const food: ClientFood = {
    id: genId(), ...data, source: "user", barcode: null,
    densityGramsPerMl: null, createdBy: "demo",
    createdAt: new Date().toISOString(),
  };
  await db.put("foods", food);
  return food;
}

// ============ MEALS & LOGS ============

export async function logMeal(data: {
  source: string; ingredients: Array<{ name: string; estimatedWeightGrams: number; confidence: number; volumeMl?: number; nameFa?: string }>;
  macros: { calories: number; protein: number; carbs: number; fat: number };
  healthScore: number; imageUrl?: string; title?: string; mealSlot?: string; corrected?: boolean; timestamp?: string;
}): Promise<{ mealId: string; logId: string }> {
  const db = await getDB();
  const userId = await getActiveUserId();
  const mealId = genId();
  const logId = genId();
  const ts = data.timestamp ?? new Date().toISOString();
  await db.put("meals", {
    id: mealId, userId, source: data.source,
    ingredients: JSON.stringify(data.ingredients),
    macros: JSON.stringify(data.macros),
    healthScore: data.healthScore, imageUrl: data.imageUrl ?? null,
    title: data.title ?? null, mealSlot: data.mealSlot ?? null,
    createdAt: ts,
  });
  await db.put("logs", {
    id: logId, userId, type: "meal", mealId,
    macros: JSON.stringify(data.macros), title: data.title ?? null,
    mealSlot: data.mealSlot ?? null, timestamp: ts,
    imageUrl: data.imageUrl ?? null, workoutSummary: null,
    waterMl: null, corrected: data.corrected ?? false,
  });
  // Bump streak
  const user = await ensureUser();
  await db.put("users", { ...user, streak: user.streak + 1 });
  return { mealId, logId };
}

export async function logFood(foodId: string, servings: number, mealSlot?: string): Promise<{ mealId: string; logId: string }> {
  const db = await getDB();
  const food = await db.get("foods", foodId);
  if (!food) throw new Error("Food not found");
  const macros = {
    calories: Math.round(food.calories * servings),
    protein: Math.round(food.protein * servings * 10) / 10,
    carbs: Math.round(food.carbs * servings * 10) / 10,
    fat: Math.round(food.fat * servings * 10) / 10,
  };
  return logMeal({
    source: "manual", ingredients: [{ name: food.name, estimatedWeightGrams: Math.round(food.servingWeightGrams * servings), confidence: 1 }],
    macros, healthScore: 60, title: food.name, mealSlot,
  });
}

export async function logWater(deltaMl: number, date?: string): Promise<{ waterMl: number }> {
  const db = await getDB();
  const userId = await getActiveUserId();
  const dateKey = date ?? new Date().toISOString().slice(0, 10);
  const existing = await db.getAll("healthDaily");
  const dayHealth = existing.find((h: ClientHealthDaily) => h.date === dateKey);
  const current = dayHealth?.waterMl ?? 0;
  const next = Math.max(0, current + deltaMl);
  if (dayHealth) {
    await db.put("healthDaily", { ...dayHealth, waterMl: next, updatedAt: new Date().toISOString() });
  } else {
    await db.put("healthDaily", { id: genId(), userId, date: dateKey, waterMl: next, steps: 0, activeEnergyKcal: 0, weightKg: null, workouts: "[]", updatedAt: new Date().toISOString() });
  }
  await db.put("logs", { id: genId(), userId, type: "water", waterMl: deltaMl, timestamp: new Date().toISOString(), mealId: null, macros: null, workoutSummary: null, imageUrl: null, title: null, mealSlot: null, corrected: false });
  return { waterMl: next };
}

export async function logWorkout(data: { type: string; durationMinutes: number; intensity: string; caloriesBurned: number }): Promise<{ logId: string }> {
  const db = await getDB();
  const userId = await getActiveUserId();
  const logId = genId();
  await db.put("logs", { id: logId, userId, type: "workout", title: data.type, workoutSummary: JSON.stringify(data), timestamp: new Date().toISOString(), mealId: null, macros: null, waterMl: null, imageUrl: null, mealSlot: null, corrected: false });
  const today = new Date().toISOString().slice(0, 10);
  const existing = await db.getAll("healthDaily");
  const dayHealth = existing.find((h: ClientHealthDaily) => h.date === today);
  if (dayHealth) {
    const workouts = parseJSON(dayHealth.workouts, []);
    workouts.push(data);
    await db.put("healthDaily", { ...dayHealth, workouts: JSON.stringify(workouts), activeEnergyKcal: dayHealth.activeEnergyKcal + data.caloriesBurned, updatedAt: new Date().toISOString() });
  }
  return { logId };
}

export async function deleteLog(logId: string): Promise<void> {
  const db = await getDB();
  const log = await db.get("logs", logId);
  if (!log) return;
  if (log.mealId) await db.delete("meals", log.mealId);
  await db.delete("logs", logId);
}

export async function updateLog(data: { logId: string; title?: string; macros?: { calories: number; protein: number; carbs: number; fat: number }; mealSlot?: string; ingredients?: Array<Record<string, unknown>> }): Promise<void> {
  const db = await getDB();
  const log = await db.get("logs", data.logId);
  if (!log) return;
  const logData: Partial<ClientLog> = { corrected: true };
  if (data.title) logData.title = data.title;
  if (data.macros) logData.macros = JSON.stringify(data.macros);
  if (data.mealSlot) logData.mealSlot = data.mealSlot;
  await db.put("logs", { ...log, ...logData });
  if (log.mealId) {
    const meal = await db.get("meals", log.mealId);
    if (meal) {
      const mealData: Partial<ClientMeal> = {};
      if (data.title) mealData.title = data.title;
      if (data.macros) mealData.macros = JSON.stringify(data.macros);
      if (data.ingredients) mealData.ingredients = JSON.stringify(data.ingredients);
      await db.put("meals", { ...meal, ...mealData });
    }
  }
}

// ============ FAVORITES ============

export async function getFavorites(): Promise<ClientFavorite[]> {
  const db = await getDB();
  const userId = await getActiveUserId();
  const all = await db.getAll("favorites");
  return all.filter((f: ClientFavorite) => f.userId === userId).sort((a: ClientFavorite, b: ClientFavorite) => b.createdAt.localeCompare(a.createdAt));
}

export async function addFavorite(data: { name: string; emoji?: string; calories: number; protein: number; carbs: number; fat: number; servingSize?: string; foodId?: string }): Promise<ClientFavorite> {
  const db = await getDB();
  const userId = await getActiveUserId();
  const fav: ClientFavorite = { id: genId(), userId, ...data, emoji: data.emoji ?? null, servingSize: data.servingSize ?? null, createdAt: new Date().toISOString() };
  await db.put("favorites", fav);
  return fav;
}

export async function removeFavorite(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("favorites", id);
}

// ============ MEAL DETAIL ============

export async function getMealDetail(mealId: string): Promise<Record<string, unknown> | null> {
  const db = await getDB();
  const meal = await db.get("meals", mealId);
  if (!meal) return null;
  return {
    ...meal,
    ingredients: parseJSON(meal.ingredients, []),
    macros: parseJSON(meal.macros, { calories: 0, protein: 0, carbs: 0, fat: 0 }),
  };
}

// ============ DASHBOARD ============

export async function getDashboard(date?: string): Promise<Record<string, unknown>> {
  await seedFoods();
  const db = await getDB();
  const user = await ensureUser();
  const dateParam = date ?? new Date().toISOString().slice(0, 10);

  const allLogs = await db.getAll("logs");
  const userLogs = allLogs.filter((l: ClientLog) => l.userId === user.id);

  // Day logs
  const dayStart = new Date(dateParam + "T00:00:00.000Z");
  const dayEnd = new Date(dateParam + "T23:59:59.999Z");
  const dayLogs = userLogs.filter((l: ClientLog) => {
    const ts = new Date(l.timestamp);
    return ts >= dayStart && ts <= dayEnd;
  }).sort((a: ClientLog, b: ClientLog) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Calculate consumed
  let consumed = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  let burned = 0;
  for (const log of dayLogs) {
    if (log.type === "meal" && log.macros) {
      const m = parseJSON(log.macros, { calories: 0, protein: 0, carbs: 0, fat: 0 });
      consumed.calories += m.calories; consumed.protein += m.protein; consumed.carbs += m.carbs; consumed.fat += m.fat;
    } else if (log.type === "workout" && log.workoutSummary) {
      const w = parseJSON(log.workoutSummary, { caloriesBurned: 0 });
      burned += w.caloriesBurned ?? 0;
    }
  }

  // Today health
  const allHealth = await db.getAll("healthDaily");
  const todayHealth = allHealth.find((h: ClientHealthDaily) => h.date === dateParam) ?? null;

  // Week health
  const sevenDaysAgo = new Date(dayStart);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const weekHealth = allHealth
    .filter((h: ClientHealthDaily) => h.date >= sevenDaysAgo.toISOString().slice(0, 10) && h.date <= dateParam)
    .sort((a: ClientHealthDaily, b: ClientHealthDaily) => a.date.localeCompare(b.date));

  // Month health
  const thirtyDaysAgo = new Date(dayStart);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  const monthHealth = allHealth
    .filter((h: ClientHealthDaily) => h.date >= thirtyDaysAgo.toISOString().slice(0, 10) && h.date <= dateParam)
    .sort((a: ClientHealthDaily, b: ClientHealthDaily) => a.date.localeCompare(b.date));

  // Macro trend (7 days)
  const macroTrend: Array<{ date: string; calories: number; protein: number; carbs: number; fat: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(sevenDaysAgo);
    d.setDate(sevenDaysAgo.getDate() + (6 - i));
    const key = d.toISOString().slice(0, 10);
    const dayLogsT = userLogs.filter((l: ClientLog) => l.type === "meal" && l.timestamp.slice(0, 10) === key);
    const sum = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    for (const l of dayLogsT) {
      if (l.macros) {
        const m = parseJSON(l.macros, { calories: 0, protein: 0, carbs: 0, fat: 0 });
        sum.calories += m.calories; sum.protein += m.protein; sum.carbs += m.carbs; sum.fat += m.fat;
      }
    }
    macroTrend.push({ date: key, ...sum });
  }

  // Meals by slot
  const mealsBySlot = {
    breakfast: dayLogs.filter((l: ClientLog) => l.type === "meal" && (l.mealSlot === "breakfast" || (!l.mealSlot && new Date(l.timestamp).getHours() < 11))).map((l: ClientLog) => ({ ...l, macros: l.macros ? parseJSON(l.macros, null) : null, workoutSummary: l.workoutSummary ? parseJSON(l.workoutSummary, null) : null })),
    lunch: dayLogs.filter((l: ClientLog) => l.type === "meal" && (l.mealSlot === "lunch" || (!l.mealSlot && new Date(l.timestamp).getHours() >= 11 && new Date(l.timestamp).getHours() < 16))).map((l: ClientLog) => ({ ...l, macros: l.macros ? parseJSON(l.macros, null) : null, workoutSummary: l.workoutSummary ? parseJSON(l.workoutSummary, null) : null })),
    dinner: dayLogs.filter((l: ClientLog) => l.type === "meal" && (l.mealSlot === "dinner" || (!l.mealSlot && new Date(l.timestamp).getHours() >= 16))).map((l: ClientLog) => ({ ...l, macros: l.macros ? parseJSON(l.macros, null) : null, workoutSummary: l.workoutSummary ? parseJSON(l.workoutSummary, null) : null })),
    snack: dayLogs.filter((l: ClientLog) => l.type === "meal" && l.mealSlot === "snack").map((l: ClientLog) => ({ ...l, macros: l.macros ? parseJSON(l.macros, null) : null, workoutSummary: l.workoutSummary ? parseJSON(l.workoutSummary, null) : null })),
  };

  // Recent logs
  const recentLogs = userLogs.slice(0, 20).map((l: ClientLog) => ({ ...l, macros: l.macros ? parseJSON(l.macros, null) : null, workoutSummary: l.workoutSummary ? parseJSON(l.workoutSummary, null) : null }));

  // Days logged
  const daysLogged = weekHealth.filter((h: ClientHealthDaily) => h.steps > 0 || h.waterMl > 0).length;

  // Streak
  const loggedDays = new Set(userLogs.filter((l: ClientLog) => l.type === "meal").map((l: ClientLog) => l.timestamp.slice(0, 10)));
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(dayStart);
    d.setDate(d.getDate() - i);
    if (loggedDays.has(d.toISOString().slice(0, 10))) streak++;
    else if (i > 0) break;
  }

  return {
    user: { ...user, goals: user.goals, streak },
    todayHealth: todayHealth ? { ...todayHealth, workouts: parseJSON(todayHealth.workouts, []) } : null,
    consumed, burned,
    netCalories: consumed.calories - burned,
    dayLogs: dayLogs.map((l: ClientLog) => ({ ...l, macros: l.macros ? parseJSON(l.macros, null) : null, workoutSummary: l.workoutSummary ? parseJSON(l.workoutSummary, null) : null })),
    mealsBySlot,
    weekHealth, monthHealth, macroTrend,
    recentLogs,
    daysLogged,
  };
}

// ============ MEAL SUGGESTIONS ============

export async function getMealSuggestions(slot?: string): Promise<{ suggestions: ClientFood[]; remaining: { calories: number; protein: number; carbs: number; fat: number }; biggestGap: string }> {
  const dash = await getDashboard();
  const goals = (dash.user as ClientUser).goals;
  const consumed = dash.consumed as { calories: number; protein: number; carbs: number; fat: number };
  const remaining = {
    calories: Math.max(0, goals.calories - consumed.calories),
    protein: Math.max(0, goals.protein - consumed.protein),
    carbs: Math.max(0, goals.carbs - consumed.carbs),
    fat: Math.max(0, goals.fat - consumed.fat),
  };
  const proteinPct = goals.protein > 0 ? remaining.protein / goals.protein : 0;
  const carbsPct = goals.carbs > 0 ? remaining.carbs / goals.carbs : 0;
  const fatPct = goals.fat > 0 ? remaining.fat / goals.fat : 0;
  let biggestGap = "protein";
  if (proteinPct >= carbsPct && proteinPct >= fatPct) biggestGap = "protein";
  else if (carbsPct >= fatPct) biggestGap = "carbs";
  else biggestGap = "fat";
  const foods = await searchFoods("", undefined, 30);
  const sorted = foods.sort((a: ClientFood, b: ClientFood) => (b[biggestGap as "protein"] as number) - (a[biggestGap as "protein"] as number));
  return { suggestions: sorted.slice(0, 8), remaining, biggestGap };
}

// ============ EXPORT/IMPORT ============

export async function exportData(format: "json" | "csv"): Promise<string> {
  const db = await getDB();
  const user = await ensureUser();
  const meals = await db.getAll("meals");
  const logs = await db.getAll("logs");
  const healthDaily = await db.getAll("healthDaily");
  const favorites = await db.getAll("favorites");
  const foods = await db.getAll("foods");

  if (format === "csv") {
    const headers = ["Date", "Type", "Title", "Calories", "Protein", "Carbs", "Fat", "Water(ml)", "Workout", "Duration(min)", "Meal Slot"];
    const rows = (logs as ClientLog[]).map((l) => {
      const m = l.macros ? parseJSON(l.macros, { calories: 0, protein: 0, carbs: 0, fat: 0 }) : null;
      const w = l.workoutSummary ? parseJSON(l.workoutSummary, { type: "", durationMinutes: 0, intensity: "", caloriesBurned: 0 }) : null;
      return [l.timestamp, l.type, l.title ?? "", m?.calories ?? "", m?.protein ?? "", m?.carbs ?? "", m?.fat ?? "", l.waterMl ?? "", w?.type ?? "", w?.durationMinutes ?? "", l.mealSlot ?? ""];
    });
    return [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  }

  return JSON.stringify({ exportedAt: new Date().toISOString(), user: { ...user, goals: user.goals }, meals, logs, healthDaily, favorites, customFoods: foods.filter((f: ClientFood) => f.source === "user") }, null, 2);
}

// ============ BARCODE ============

export async function lookupBarcode(code: string): Promise<{ food: ClientFood; source: string }> {
  const db = await getDB();
  const allFoods = await db.getAll("foods");
  const local = allFoods.find((f: ClientFood) => f.barcode === code);
  if (local) return { food: local, source: "local" };
  // Try Open Food Facts
  const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`, {
    headers: { "User-Agent": "DS-Cali/1.0" },
  });
  const data = await res.json();
  if (data.status !== 1 || !data.product) throw new Error("Product not found");
  const p = data.product;
  const n = p.nutriments || {};
  const servingG = p.serving_quantity ? Number(p.serving_quantity) : 100;
  const ratio = servingG / 100;
  const food: ClientFood = {
    id: genId(),
    name: p.product_name || "Unknown product",
    servingSize: servingG ? `${servingG}g` : "100g",
    servingWeightGrams: servingG || 100,
    calories: Math.round((Number(n["energy-kcal_100g"]) || Number(n.energy_100g) / 4.184 || 0) * ratio),
    protein: Math.round((Number(n.proteins_100g) || 0) * ratio * 10) / 10,
    carbs: Math.round((Number(n.carbohydrates_100g) || 0) * ratio * 10) / 10,
    fat: Math.round((Number(n.fat_100g) || 0) * ratio * 10) / 10,
    source: "database", barcode: code,
    category: p.categories_tags?.[0]?.replace("en:", "") ?? null,
    emoji: "📦", densityGramsPerMl: null, createdBy: "demo",
    createdAt: new Date().toISOString(),
  };
  await db.put("foods", food);
  return { food, source: "openfoodfacts" };
}
