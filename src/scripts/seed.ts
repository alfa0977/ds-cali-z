// Seed script: creates the demo user, a starter food database, and
// 7 days of health + some sample meals/logs so the dashboard looks alive.
// Run with: bun run src/scripts/seed.ts
import { db } from "../lib/db";
import { ensureDemoUser } from "../lib/auth";

const STARTER_FOODS = [
  // name, serving, weight(g), cal, pro, carb, fat, category, emoji, density, barcode?
  ["Apple", "1 medium", 182, 95, 0.5, 25, 0.3, "fruit", "🍎", 0.78, null],
  ["Banana", "1 medium", 118, 105, 1.3, 27, 0.4, "fruit", "🍌", 0.94, null],
  ["Avocado", "1 serving", 100, 160, 2, 9, 15, "fruit", "🥑", 0.96, null],
  ["Egg", "1 large", 50, 78, 6.3, 0.6, 5.3, "protein", "🥚", 1.03, null],
  ["Chicken Breast", "100g", 100, 165, 31, 0, 3.6, "protein", "🍗", 1.05, null],
  ["Salmon", "100g", 100, 208, 20, 0, 13, "protein", "🐟", 1.0, null],
  ["Beef Steak", "100g", 100, 271, 27, 0, 19, "protein", "🥩", 1.05, null],
  ["Shrimp", "100g", 100, 99, 24, 0.2, 0.3, "protein", "🦐", 1.0, null],
  ["Tofu", "100g", 100, 76, 8, 1.9, 4.8, "protein", "🧈", 0.95, null],
  ["Greek Yogurt", "1 cup", 227, 130, 17, 9, 0.7, "dairy", "🥛", 1.03, null],
  ["Milk (2%)", "1 cup", 244, 122, 8, 12, 5, "dairy", "🥛", 1.03, null],
  ["Cheddar Cheese", "1 slice", 21, 85, 5.3, 0.3, 7, "dairy", "🧀", 0.9, null],
  ["Butter", "1 tbsp", 14, 102, 0.1, 0, 11.5, "dairy", "🧈", 0.95, null],
  ["White Rice (cooked)", "1 cup", 158, 206, 4.3, 45, 0.4, "grain", "🍚", 0.85, null],
  ["Brown Rice (cooked)", "1 cup", 195, 216, 5, 45, 1.8, "grain", "🍚", 0.85, null],
  ["Pasta (cooked)", "1 cup", 140, 220, 8, 43, 1.3, "grain", "🍝", 0.85, null],
  ["Bread (white)", "1 slice", 28, 75, 2.6, 14, 1, "grain", "🍞", 0.5, null],
  ["Bread (whole wheat)", "1 slice", 28, 70, 3.6, 12, 1, "grain", "🍞", 0.5, null],
  ["Oatmeal (cooked)", "1 cup", 234, 158, 6, 27, 3, "grain", "🥣", 0.8, null],
  ["Pancake", "1 medium", 80, 182, 5, 22, 8, "grain", "🥞", 0.7, null],
  ["Potato (baked)", "1 medium", 173, 161, 4.3, 37, 0.2, "vegetable", "🥔", 1.05, null],
  ["Sweet Potato", "1 medium", 151, 130, 2.4, 30, 0.2, "vegetable", "🍠", 1.05, null],
  ["Spinach", "1 cup", 30, 7, 0.9, 1.1, 0.1, "vegetable", "🥬", 0.35, null],
  ["Broccoli", "1 cup", 91, 31, 2.5, 6, 0.3, "vegetable", "🥦", 0.5, null],
  ["Tomato", "1 medium", 123, 22, 1.1, 4.8, 0.2, "vegetable", "🍅", 0.95, null],
  ["Carrot", "1 medium", 61, 25, 0.6, 6, 0.1, "vegetable", "🥕", 0.9, null],
  ["Lettuce", "1 cup", 36, 5, 0.5, 1, 0.1, "vegetable", "🥬", 0.3, null],
  ["Onion", "1 medium", 110, 44, 1.2, 10, 0.1, "vegetable", "🧅", 0.9, null],
  ["Cucumber", "1 cup", 104, 16, 0.7, 3.8, 0.1, "vegetable", "🥒", 0.95, null],
  ["Bell Pepper", "1 medium", 119, 31, 1, 7, 0.3, "vegetable", "🫑", 0.9, null],
  ["Mushroom", "1 cup", 70, 15, 2.2, 2.3, 0.2, "vegetable", "🍄", 0.6, null],
  ["Corn", "1 cup", 149, 143, 5.4, 31, 2.2, "vegetable", "🌽", 0.75, null],
  ["Blueberries", "1 cup", 148, 84, 1.1, 21, 0.5, "fruit", "🫐", 0.85, null],
  ["Strawberries", "1 cup", 152, 49, 1, 11.7, 0.5, "fruit", "🍓", 0.7, null],
  ["Orange", "1 medium", 131, 62, 1.2, 15, 0.2, "fruit", "🍊", 0.9, null],
  ["Grapes", "1 cup", 151, 104, 1.1, 27, 0.2, "fruit", "🍇", 0.95, null],
  ["Almonds", "1 oz", 28, 164, 6, 6, 14, "snack", "🌰", 0.55, null],
  ["Peanut Butter", "1 tbsp", 16, 94, 4, 3, 8, "snack", "🥜", 1.1, null],
  ["Walnuts", "1 oz", 28, 185, 4.3, 3.9, 18, "snack", "🌰", 0.55, null],
  ["Granola Bar", "1 bar", 40, 180, 4, 24, 7, "snack", "🍫", 0.7, null],
  ["Dark Chocolate", "1 oz", 28, 155, 1.4, 13, 12, "snack", "🍫", 0.85, null],
  ["Olive Oil", "1 tbsp", 14, 119, 0, 0, 14, "fat", "🫒", 0.92, null],
  ["Maple Syrup", "1 tbsp", 20, 52, 0, 13, 0, "sauce", "🍯", 1.33, null],
  ["Honey", "1 tbsp", 21, 64, 0.1, 17, 0, "sauce", "🍯", 1.42, null],
  ["Soy Sauce", "1 tbsp", 18, 8, 0.9, 1, 0, "sauce", "🧂", 1.1, null],
  ["Ketchup", "1 tbsp", 17, 17, 0.2, 4, 0, "sauce", "🍅", 1.1, null],
  ["Mayonnaise", "1 tbsp", 14, 90, 0.1, 0.1, 10, "sauce", "🥚", 0.91, null],
  ["Black Coffee", "1 cup", 240, 2, 0.3, 0, 0, "beverage", "☕", 1.0, null],
  ["Orange Juice", "1 cup", 248, 112, 1.7, 26, 0.5, "beverage", "🧃", 1.05, null],
  ["Green Tea", "1 cup", 245, 2, 0.5, 0, 0, "beverage", "🍵", 1.0, null],
  ["Sparkling Water", "1 can", 355, 0, 0, 0, 0, "beverage", "💧", 1.0, null],
  ["Pizza Slice", "1 slice", 107, 285, 12, 36, 10, "snack", "🍕", 0.6, null],
  ["Burger", "1 burger", 220, 540, 27, 40, 30, "snack", "🍔", 0.8, null],
  ["French Fries", "medium", 117, 365, 4, 48, 17, "snack", "🍟", 0.6, null],
  ["Sushi Roll", "6 pieces", 180, 250, 9, 38, 7, "snack", "🍣", 0.95, null],
  ["Taco", "1 taco", 102, 170, 8, 13, 9, "snack", "🌮", 0.7, null],
  ["Croissant", "1 medium", 57, 231, 4.7, 26, 12, "grain", "🥐", 0.4, null],
] as const;

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

async function main() {
  console.log("🌱 Seeding Cal-AI demo data...");

  const user = await ensureDemoUser();
  console.log(`  ✓ Demo user: ${user.id} (${user.displayName})`);

  // Foods
  const existing = await db.food.count();
  if (existing === 0) {
    await db.food.createMany({
      data: STARTER_FOODS.map((f) => ({
        name: f[0] as string,
        servingSize: f[1] as string,
        servingWeightGrams: f[2] as number,
        calories: f[3] as number,
        protein: f[4] as number,
        carbs: f[5] as number,
        fat: f[6] as number,
        category: f[7] as string,
        emoji: f[8] as string,
        densityGramsPerMl: f[9] as number,
        barcode: (f[10] as string | null) ?? null,
        source: "database",
      })),
    });
    console.log(`  ✓ Inserted ${STARTER_FOODS.length} foods`);
  } else {
    console.log(`  ↪ Foods already seeded (${existing})`);
  }

  // Health daily — last 7 days with realistic-ish data
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = dateKey(d);
    const steps = 6000 + Math.floor(Math.random() * 5500);
    const active = Math.floor(steps * 0.035) + Math.floor(Math.random() * 80);
    const water = 1200 + Math.floor(Math.random() * 1200);
    const weight = 78 - i * 0.15 + (Math.random() - 0.5) * 0.4;
    await db.healthDaily.upsert({
      where: { userId_date: { userId: user.id, date: key } },
      update: {},
      create: {
        userId: user.id,
        date: key,
        steps,
        activeEnergyKcal: active,
        waterMl: water,
        weightKg: Math.round(weight * 10) / 10,
        workouts:
          i % 3 === 0
            ? JSON.stringify([
                {
                  type: "Weight lifting",
                  durationMinutes: 45,
                  intensity: "medium",
                  caloriesBurned: 180,
                },
              ])
            : "[]",
      },
    });
  }
  console.log(`  ✓ Health daily (7 days)`);

  // Sample meals + logs (today & yesterday)
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const sampleMeals = [
    {
      title: "Greek Yogurt with Blueberries",
      ingredients: [
        { name: "Greek Yogurt", estimatedWeightGrams: 227, confidence: 0.9 },
        { name: "Blueberries", estimatedWeightGrams: 80, confidence: 0.85 },
        { name: "Honey", estimatedWeightGrams: 15, confidence: 0.7 },
      ],
      healthScore: 82,
      time: new Date(now),
      macros: { calories: 215, protein: 19, carbs: 30, fat: 3 },
    },
    {
      title: "Grilled Chicken Salad",
      ingredients: [
        { name: "Chicken Breast", estimatedWeightGrams: 150, confidence: 0.92 },
        { name: "Spinach", estimatedWeightGrams: 60, confidence: 0.8 },
        { name: "Avocado", estimatedWeightGrams: 80, confidence: 0.85 },
        { name: "Tomato", estimatedWeightGrams: 60, confidence: 0.8 },
        { name: "Olive Oil", estimatedWeightGrams: 10, confidence: 0.6 },
      ],
      healthScore: 90,
      time: new Date(now.getTime() - 3 * 3600 * 1000),
      macros: { calories: 410, protein: 50, carbs: 14, fat: 18 },
    },
    {
      title: "Pancakes with Maple Syrup",
      ingredients: [
        { name: "Pancake", estimatedWeightGrams: 160, confidence: 0.9 },
        { name: "Maple Syrup", estimatedWeightGrams: 30, confidence: 0.8 },
        { name: "Butter", estimatedWeightGrams: 14, confidence: 0.7 },
      ],
      healthScore: 45,
      time: new Date(yesterday),
      macros: { calories: 540, protein: 8, carbs: 78, fat: 20 },
    },
  ];

  for (const sm of sampleMeals) {
    const meal = await db.meal.create({
      data: {
        userId: user.id,
        source: "ai",
        title: sm.title,
        ingredients: JSON.stringify(sm.ingredients),
        macros: JSON.stringify(sm.macros),
        healthScore: sm.healthScore,
      },
    });
    await db.log.create({
      data: {
        userId: user.id,
        type: "meal",
        mealId: meal.id,
        macros: JSON.stringify(sm.macros),
        title: sm.title,
        timestamp: sm.time,
      },
    });
  }
  console.log(`  ✓ Sample meals (${sampleMeals.length})`);

  // A workout log today
  await db.log.create({
    data: {
      userId: user.id,
      type: "workout",
      title: "Morning Run",
      workoutSummary: JSON.stringify({
        type: "Running",
        durationMinutes: 30,
        intensity: "high",
        caloriesBurned: 320,
      }),
      timestamp: new Date(now.getTime() - 6 * 3600 * 1000),
    },
  });

  // Some water logs today
  for (let i = 0; i < 3; i++) {
    await db.log.create({
      data: {
        userId: user.id,
        type: "water",
        waterMl: 250,
        timestamp: new Date(now.getTime() - (5 - i) * 2 * 3600 * 1000),
      },
    });
  }
  console.log(`  ✓ Workout + water logs`);

  console.log("🌱 Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
