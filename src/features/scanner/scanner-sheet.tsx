"use client";
import { useRef, useState } from "react";
import { Camera, ImagePlus, X, ScanLine, Loader2, Apple, Barcode, Bookmark, Pencil } from "lucide-react";
import { useAnalyzeMeal, useLogMeal, uploadMealImage } from "@/lib/hooks";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { formatNumber } from "@/lib/date-utils";
import { translateFoodName } from "@/lib/food-translations";

interface Ingredient {
  name: string;
  estimatedWeightGrams: number;
  confidence: number;
  volumeMl?: number;
}

const SAMPLE_MEALS = [
  { label: "Pancakes", emoji: "🥞", url: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80" },
  { label: "Salad", emoji: "🥗", url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80" },
  { label: "Burger", emoji: "🍔", url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80" },
  { label: "Sushi", emoji: "🍣", url: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&q=80" },
];

export function ScannerSheet() {
  const { setModal } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const analyze = useAnalyzeMeal();
  const { t } = useI18n();

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImage(dataUrl);
      analyze.mutate(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  function handleSample(url: string) {
    setImage(url);
    analyze.mutate(url);
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={() => setModal(null)} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-base font-semibold">{t("scanner")}</h2>
        <div className="h-9 w-9" />
      </div>

      {/* camera / preview area */}
      <div className="relative mx-4 flex-1 overflow-hidden rounded-3xl bg-black">
        {image ? (
          <img src={image} alt="meal" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-white/70">
            <Camera className="h-12 w-12" />
            <p className="text-sm">{t("pointCamera")}</p>
          </div>
        )}

        {/* framing brackets */}
        {!image && (
          <div className="pointer-events-none absolute inset-8">
            <div className="absolute left-0 top-0 h-10 w-10 rounded-tl-2xl border-l-4 border-t-4 border-white/80" />
            <div className="absolute right-0 top-0 h-10 w-10 rounded-tr-2xl border-r-4 border-t-4 border-white/80" />
            <div className="absolute bottom-0 left-0 h-10 w-10 rounded-bl-2xl border-b-4 border-l-4 border-white/80" />
            <div className="absolute bottom-0 right-0 h-10 w-10 rounded-br-2xl border-b-4 border-r-4 border-white/80" />
          </div>
        )}

        {analyze.isPending && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50 backdrop-blur-sm">
            <Loader2 className="h-10 w-10 animate-spin text-white" />
            <p className="text-sm font-medium text-white">{t("analyzing")}</p>
          </div>
        )}

        {/* scan pill */}
        {!image && !analyze.isPending && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 shadow-lg">
              <Apple className="h-4 w-4 text-foreground" />
              <span className="text-sm font-semibold text-foreground">{t("scanFood")}</span>
            </div>
          </div>
        )}

        {/* bottom tool bar */}
        {!image && (
          <div className="absolute bottom-16 left-1/2 flex -translate-x-1/2 items-center gap-4">
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm">
              <Barcode className="h-5 w-5" />
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm"
            >
              <ImagePlus className="h-5 w-5" />
            </button>
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm">
              <Bookmark className="h-5 w-5" />
            </button>
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm">
              <Pencil className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* sample meals */}
      {!image && (
        <div className="px-4 py-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">{t("trySample")}</p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {SAMPLE_MEALS.map((s) => (
              <button
                key={s.label}
                onClick={() => handleSample(s.url)}
                disabled={analyze.isPending}
                className="flex shrink-0 items-center gap-2 rounded-full bg-secondary px-3 py-2 text-sm font-medium transition-transform active:scale-95 disabled:opacity-50"
              >
                <span>{s.emoji}</span>
                {translateFoodName(s.label, "en")}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* capture button */}
      {!image && (
        <div className="flex items-center justify-center gap-6 px-4 py-4">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={analyze.isPending}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-fab ring-4 ring-white/30 transition-transform active:scale-95 disabled:opacity-50"
          >
            <ScanLine className="h-7 w-7 text-black" />
          </button>
        </div>
      )}

      {image && (
        <div className="px-4 py-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setImage(null);
              analyze.reset();
            }}
          >
            {t("scanAnother")}
          </Button>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onFile} className="hidden" />

      {/* result */}
      {analyze.data && image && <ResultCard analysis={analyze.data} image={image} />}
    </div>
  );
}

function ResultCard({
  analysis,
  image,
}: {
  analysis: {
    ingredients: Ingredient[];
    macros: { calories: number; protein: number; carbs: number; fat: number };
    healthScore: number;
    mealTitle?: string | null;
    detectedCategory?: string | null;
  };
  image: string;
}) {
  const { setModal } = useApp();
  const logMeal = useLogMeal();
  const { locale, t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>(analysis.ingredients);
  const [servings, setServings] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState<string>(() => {
    const h = new Date().getHours();
    if (h < 11) return "breakfast";
    if (h < 16) return "lunch";
    if (h < 22) return "dinner";
    return "snack";
  });
  const [mealTime, setMealTime] = useState<string>(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  });

  const macros = analysis.macros;
  const scaledMacros = {
    calories: Math.round(macros.calories * servings),
    protein: Math.round(macros.protein * servings * 10) / 10,
    carbs: Math.round(macros.carbs * servings * 10) / 10,
    fat: Math.round(macros.fat * servings * 10) / 10,
  };

  function updateWeight(i: number, w: number) {
    setIngredients((prev) => prev.map((ing, idx) => (idx === i ? { ...ing, estimatedWeightGrams: Math.max(0, w) } : ing)));
  }
  function remove(i: number) {
    setIngredients((prev) => prev.filter((_, idx) => idx !== i));
  }
  function add() {
    setIngredients((prev) => [...prev, { name: t("newIngredient"), estimatedWeightGrams: 50, confidence: 0.5 }]);
  }

  const [persisting, setPersisting] = useState(false);

  async function done() {
    setPersisting(true);
    const persistedUrl = await uploadMealImage(image);
    setPersisting(false);
    // Build timestamp from selected time
    const today = new Date();
    const [hours, minutes] = mealTime.split(":").map(Number);
    today.setHours(hours, minutes, 0, 0);
    logMeal.mutate(
      {
        source: "ai",
        ingredients,
        macros: scaledMacros,
        healthScore: analysis.healthScore,
        imageUrl: persistedUrl,
        title: analysis.mealTitle ?? (locale === "fa" ? "وعده اسکن‌شده" : "Scanned meal"),
        mealSlot: selectedSlot as "breakfast" | "lunch" | "dinner" | "snack",
        corrected: editing,
        timestamp: today.toISOString(),
      },
      { onSuccess: () => setModal(null) }
    );
  }

  return (
    <div className="border-t border-border bg-card">
      {/* detection bubbles over image would be in a real impl; here show inline */}
      <div className="px-4 pt-4">
        <div className="flex flex-wrap gap-1.5">
          {analysis.ingredients.map((ing, i) => (
            <span key={i} className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium">
              {translateFoodName(ing.name, locale)} {formatNumber(Math.round(ing.estimatedWeightGrams), locale)}g
            </span>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        <p className="text-xs text-muted-foreground">{translateFoodName(analysis.detectedCategory ?? "Meal", locale)}</p>
        <h2 className="text-xl font-bold">{translateFoodName(analysis.mealTitle ?? "Scanned meal", locale)}</h2>

        {/* servings stepper */}
        <div className="mt-3 flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">{t("servings")}</span>
          <div className="flex items-center gap-3 rounded-full border border-border px-1 py-1">
            <button onClick={() => setServings((s) => Math.max(0.5, Math.round((s - 0.5) * 10) / 10))} className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-sm font-bold">−</button>
            <span className="min-w-6 text-center text-sm font-semibold tabular-nums">{formatNumber(servings, locale)}</span>
            <button onClick={() => setServings((s) => Math.round((s + 0.5) * 10) / 10)} className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background text-sm font-bold">+</button>
          </div>
        </div>

        {/* meal slot selector + time picker */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="flex gap-1.5">
            {[
              { key: "breakfast", emoji: "🌅", label: t("breakfast") },
              { key: "lunch", emoji: "☀️", label: t("lunch") },
              { key: "dinner", emoji: "🌙", label: t("dinner") },
              { key: "snack", emoji: "🍿", label: t("snacks") },
            ].map((slot) => (
              <button
                key={slot.key}
                onClick={() => setSelectedSlot(slot.key)}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${selectedSlot === slot.key ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"}`}
              >
                <span>{slot.emoji}</span>
                {slot.label}
              </button>
            ))}
          </div>
          <input
            type="time"
            value={mealTime}
            onChange={(e) => setMealTime(e.target.value)}
            className="rounded-full bg-secondary px-3 py-1 text-[11px] font-medium text-foreground outline-none"
          />
        </div>

        {/* nutrition grid */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <NutBox label={t("calories")} value={scaledMacros.calories} unit="" icon="🔥" color="text-streak" />
          <NutBox label={t("carbs")} value={scaledMacros.carbs} unit="g" icon="🌾" color="text-carbs" />
          <NutBox label={t("protein")} value={scaledMacros.protein} unit="g" icon="🍗" color="text-protein" />
          <NutBox label={t("fats")} value={scaledMacros.fat} unit="g" icon="💧" color="text-fats" />
        </div>

        {/* health score */}
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-secondary p-3">
          <span className="text-lg">❤️</span>
          <span className="text-sm font-medium">{t("healthScore")}</span>
          <div className="ml-auto flex items-center gap-2">
            <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-success" style={{ width: `${analysis.healthScore}%` }} />
            </div>
            <span className="text-sm font-bold tabular-nums">{formatNumber(analysis.healthScore, locale)}/100</span>
          </div>
        </div>

        {/* ingredients editor */}
        {editing && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">{t("editIngredients")}</p>
            {ingredients.map((ing, i) => (
              <div key={i} className="flex items-center gap-2 rounded-xl bg-secondary p-2">
                <input
                  value={ing.name}
                  onChange={(e) => setIngredients((prev) => prev.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)))}
                  className="flex-1 bg-transparent text-sm font-medium outline-none"
                />
                <input
                  type="number"
                  value={Math.round(ing.estimatedWeightGrams)}
                  onChange={(e) => updateWeight(i, Number(e.target.value))}
                  className="w-16 rounded-lg bg-background px-2 py-1 text-sm tabular-nums outline-none"
                />
                <span className="text-xs text-muted-foreground">{t("g")}</span>
                <button onClick={() => remove(i)} className="flex h-7 w-7 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button onClick={add} className="w-full rounded-xl border border-dashed border-border py-2 text-sm font-medium text-muted-foreground">
              {t("addIngredient")}
            </button>
          </div>
        )}

        {/* actions */}
        <div className="mt-4 flex gap-3">
          <Button variant="outline" className="flex-1 rounded-full" onClick={() => setEditing((e) => !e)}>
            {editing ? t("doneEditing") : t("fixResults")}
          </Button>
          <Button className="flex-1 rounded-full" onClick={done} disabled={logMeal.isPending || persisting}>
            {persisting ? t("savingPhoto") : logMeal.isPending ? t("saving") : t("done")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function NutBox({ label, value, unit, icon, color }: { label: string; value: number; unit: string; icon: string; color: string }) {
  const { locale } = useI18n();
  return (
    <div className="rounded-2xl bg-secondary p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>{icon}</span>
        {label}
      </div>
      <div className={cn("mt-0.5 text-xl font-bold tabular-nums", color)}>
        {formatNumber(value, locale)}
        <span className="text-xs font-medium text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}
