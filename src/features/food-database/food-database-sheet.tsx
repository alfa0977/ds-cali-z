"use client";
import { useState, useMemo } from "react";
import { ArrowLeft, Search, Plus, Pencil } from "lucide-react";
import { useSearchFoods, useLogFood } from "@/lib/hooks";
import { useApp } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TABS = ["All", "My meals", "My foods", "Saved scans"] as const;

const CATEGORIES = [
  { key: "All", label: "All", emoji: "🍽️" },
  { key: "protein", label: "Protein", emoji: "🍗" },
  { key: "grain", label: "Grains", emoji: "🍚" },
  { key: "vegetable", label: "Veg", emoji: "🥦" },
  { key: "fruit", label: "Fruit", emoji: "🍎" },
  { key: "dairy", label: "Dairy", emoji: "🥛" },
  { key: "snack", label: "Snacks", emoji: "🍫" },
  { key: "beverage", label: "Drinks", emoji: "☕" },
  { key: "fat", label: "Fats", emoji: "🫒" },
  { key: "sauce", label: "Sauces", emoji: "🍯" },
] as const;

export function FoodDatabaseSheet() {
  const { setModal } = useApp();
  const { data: foods, isLoading } = useSearchFoods();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const [category, setCategory] = useState<string>("All");
  const logFood = useLogFood();

  const filtered = useMemo(() => {
    if (!foods) return [];
    const query = q.trim().toLowerCase();
    let list = foods;
    if (query) list = list.filter((f) => f.name.toLowerCase().includes(query));
    if (tab === "My foods") list = list.filter((f) => f.source === "user");
    if (category !== "All") list = list.filter((f) => f.category === category);
    return list;
  }, [foods, q, tab, category]);

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <button onClick={() => setModal(null)} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="flex-1 text-center text-base font-semibold">Food Database</h2>
        <div className="h-9 w-9" />
      </div>

      <div className="px-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Describe what you ate"
            className="rounded-xl border-0 bg-secondary pl-9"
          />
        </div>

        <div className="mt-3 flex gap-4 border-b border-border">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "relative pb-2 text-sm font-medium transition-colors",
                tab === t ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {t}
              {tab === t && <span className="absolute -bottom-px left-0 right-0 h-0.5 rounded-full bg-foreground" />}
            </button>
          ))}
        </div>

        {/* category filter chips */}
        <div className="mt-3 flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIES.map((c) => (
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
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-3">
        <Button variant="outline" className="w-full rounded-full" onClick={() => setModal("create-food")}>
          <Pencil className="mr-2 h-4 w-4" />
          Create custom food
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto thin-scrollbar px-4 pb-4">
        <h3 className="mb-2 text-sm font-semibold">Suggestions</h3>
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        <div className="space-y-2">
          {filtered.map((food) => (
            <div key={food.id} className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-ios">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-xl">
                {food.emoji ?? "🍽️"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm font-semibold">{food.name}</div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>🔥 {Math.round(food.calories)} cal</span>
                  <span>·</span>
                  <span>{food.servingSize}</span>
                </div>
              </div>
              <button
                onClick={() => logFood.mutate({ foodId: food.id, servings: 1 })}
                disabled={logFood.isPending}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background transition-transform active:scale-90 disabled:opacity-50"
              >
                <Plus className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>
          ))}
          {filtered.length === 0 && !isLoading && (
            <p className="py-6 text-center text-sm text-muted-foreground">No foods found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
