"use client";
import { useState } from "react";
import { X, Drumstick, Wheat, Droplets, Flame, Check, Globe } from "lucide-react";
import { useApp } from "@/lib/store";
import { useLogFood } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

const EMOJI_CHOICES = ["🍽️", "🍎", "🥗", "🍗", "🍝", "🍞", "🥑", "🧀", "🥚", "🐟", "🥦", "🍌", "🥜", "🍫", "🍕", "🍔", "🍣", "🌮", "☕", "🥛"];

export function CreateFoodSheet() {
  const { setModal, setQuickLogPayload } = useApp();
  const logFood = useLogFood();
  const { locale, t } = useI18n();
  const [nameEn, setNameEn] = useState("");
  const [nameFa, setNameFa] = useState("");
  const [servingSize, setServingSize] = useState(locale === "fa" ? "۱ وعده" : "1 serving");
  const [servingWeight, setServingWeight] = useState("100");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [emoji, setEmoji] = useState("🍽️");

  // Build the bilingual name: "English|||Persian" if both are provided,
  // otherwise just whichever one was entered. The translateFoodName() function
  // in food-translations.ts knows how to split this format.
  function buildBilingualName(): string {
    const en = nameEn.trim();
    const fa = nameFa.trim();
    if (en && fa) return `${en}|||${fa}`;
    return en || fa;
  }

  function save() {
    const name = buildBilingualName();
    if (!name || !calories) return;
    // Route through QuickLogSheet so the user can pick servings, slot, and time.
    setQuickLogPayload({
      name,
      emoji,
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      servingSize,
      servingWeightGrams: Number(servingWeight) || 100,
    });
    setModal("quick-log");
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={() => setModal(null)} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-base font-semibold">{t("createFood")}</h2>
        <div className="h-9 w-9" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        {/* Bilingual name inputs */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
            {t("foodName")} ({locale === "fa" ? "انگلیسی" : "English"})
          </Label>
          <Input
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            placeholder="e.g. Homemade granola"
            dir="ltr"
            className="rounded-xl bg-secondary border-0 h-12"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
            {t("foodName")} ({locale === "fa" ? "فارسی" : "Persian"})
          </Label>
          <Input
            value={nameFa}
            onChange={(e) => setNameFa(e.target.value)}
            placeholder="مثلاً: گرنولای خانگی"
            dir="rtl"
            className="rounded-xl bg-secondary border-0 h-12"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {locale === "fa"
            ? "نام فارسی وقتی زبان فارسی است نمایش داده می‌شود."
            : "The Persian name is shown when the app language is Persian."}
        </p>

        <div className="space-y-1.5">
          <Label>{t("icon")}</Label>
          <div className="flex flex-wrap gap-2">
            {EMOJI_CHOICES.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl border-2 text-xl transition-colors",
                  emoji === e ? "border-foreground bg-card" : "border-border bg-card"
                )}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>{t("servingSize")}</Label>
            <Input value={servingSize} onChange={(e) => setServingSize(e.target.value)} className="rounded-xl bg-secondary border-0 h-12" />
          </div>
          <div className="space-y-1.5">
            <Label>{t("weightG")}</Label>
            <Input type="number" value={servingWeight} onChange={(e) => setServingWeight(e.target.value)} className="rounded-xl bg-secondary border-0 h-12" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5"><Flame className="h-3.5 w-3.5 text-streak" /> {t("caloriesPerServing")}</Label>
          <Input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="0" className="rounded-xl bg-secondary border-0 h-12" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1 text-protein"><Drumstick className="h-3.5 w-3.5" /> {t("protein")}</Label>
            <Input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="0" className="rounded-xl bg-secondary border-0 h-12" />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1 text-carbs"><Wheat className="h-3.5 w-3.5" /> {t("carbs")}</Label>
            <Input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="0" className="rounded-xl bg-secondary border-0 h-12" />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1 text-fats"><Droplets className="h-3.5 w-3.5" /> {t("fats")}</Label>
            <Input type="number" value={fat} onChange={(e) => setFat(e.target.value)} placeholder="0" className="rounded-xl bg-secondary border-0 h-12" />
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-card px-4 py-3 pb-safe">
        <Button
          className="w-full rounded-full py-3"
          size="lg"
          disabled={(!nameEn && !nameFa) || !calories}
          onClick={save}
        >
          {t("createAndLog")}
          <Check className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
