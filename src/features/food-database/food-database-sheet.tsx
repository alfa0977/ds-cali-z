"use client";
import { useState, useMemo } from "react";
import { ArrowLeft, Search, Plus, Pencil } from "lucide-react";
import { useSearchFoods } from "@/lib/hooks";
import { useApp } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { formatNumber } from "@/lib/date-utils";
import { translateFoodName } from "@/lib/food-translations";

const TAB_KEYS = ["all", "myMeals", "myFoods", "savedScans"] as const;

const CATEGORY_KEYS = [
  { key: "All", labelKey: "cat_all", emoji: "🍽️" },
  { key: "protein", labelKey: "cat_protein", emoji: "🍗" },
  { key: "grain", labelKey: "cat_grain", emoji: "🍚" },
  { key: "vegetable", labelKey: "cat_vegetable", emoji: "🥦" },
  { key: "fruit", labelKey: "cat_fruit", emoji: "🍎" },
  { key: "dairy", labelKey: "cat_dairy", emoji: "🥛" },
  { key: "snack", labelKey: "cat_snack", emoji: "🍫" },
  { key: "beverage", labelKey: "cat_beverage", emoji: "☕" },
  { key: "fat", labelKey: "cat_fat", emoji: "🫒" },
  { key: "sauce", labelKey: "cat_sauce", emoji: "🍯" },
] as const;

export function FoodDatabaseSheet() {
  const { setModal, setQuickLogPayload } = useApp();
  const { data: foods, isLoading } = useSearchFoods();
  const [q, setQ] = useState("");
  const [tabIdx, setTabIdx] = useState(0);
  const [category, setCategory] = useState<string>("All");
  const { locale, t } = useI18n();

  const tab = TAB_KEYS[tabIdx];

  const filtered = useMemo(() => {
    if (!foods) return [];
    const query = q.trim().toLowerCase();
    let list = foods;
    if (query) {
      // Search in both English and Persian names
      list = list.filter((f) => {
        const enName = f.name.toLowerCase();
        const faName = translateFoodName(f.name, "fa").toLowerCase();
        return enName.includes(query) || faName.includes(query);
      });
    }
    if (tab === "myFoods") list = list.filter((f) => f.source === "user");
    if (category !== "All") list = list.filter((f) => f.category === category);
    return list;
  }, [foods, q, tab, category]);

  function openQuickLog(food: {
    id: string;
    name: string;
    emoji: string | null;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    servingSize: string;
    servingWeightGrams: number;
  }) {
    setQuickLogPayload({
      foodId: food.id,
      name: food.name,
      emoji: food.emoji ?? "🍽️",
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      servingSize: food.servingSize,
      servingWeightGrams: food.servingWeightGrams,
    });
    setModal("quick-log");
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <button onClick={() => setModal(null)} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="flex-1 text-center text-base font-semibold">{t("foodDatabase")}</h2>
        <div className="h-9 w-9" />
      </div>

      <div className="px-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("describeWhatYouAte")}
            className="rounded-xl border-0 bg-secondary pl-9"
          />
        </div>

        <div className="mt-3 flex gap-4 border-b border-border">
          {TAB_KEYS.map((tabKey, idx) => (
            <button
              key={tabKey}
              onClick={() => setTabIdx(idx)}
              className={cn(
                "relative pb-2 text-sm font-medium transition-colors",
                tabIdx === idx ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {t(tabKey)}
              {tabIdx === idx && <span className="absolute -bottom-px left-0 right-0 h-0.5 rounded-full bg-foreground" />}
            </button>
          ))}
        </div>

        {/* category filter chips */}
        <div className="mt-3 flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {CATEGORY_KEYS.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={cn(
                "flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                category === c.key
                  ? "bg-foreground text-background"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              <span>{c.emoji}</span>
              {t(c.labelKey as "cat_protein")}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-3">
        <Button variant="outline" className="w-full rounded-full" onClick={() => setModal("create-food")}>
          <Pencil className="mr-2 h-4 w-4" />
          {t("createCustomFood")}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto thin-scrollbar px-4 pb-4">
        <h3 className="mb-2 text-sm font-semibold">{t("suggestions")}</h3>
        {isLoading && <p className="text-sm text-muted-foreground">{t("loading")}</p>}
        <div className="space-y-2">
          {filtered.map((food) => (
            <div key={food.id} className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-ios">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-xl">
                {food.emoji ?? "🍽️"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm font-semibold">{translateFoodName(food.name, locale)}</div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>🔥 {formatNumber(Math.round(food.calories), locale)} {t("cal")}</span>
                  <span>·</span>
                  <span>{food.servingSize}</span>
                </div>
              </div>
              <button
                onClick={() => openQuickLog(food)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background transition-transform active:scale-90"
              >
                <Plus className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>
          ))}
          {filtered.length === 0 && !isLoading && (
            <p className="py-6 text-center text-sm text-muted-foreground">{t("noFoodsFound")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
