"use client";
import { useState } from "react";
import { Plus, GripVertical } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { motion } from "framer-motion";
import { useDashboard, useUpdateLog } from "@/lib/hooks";
import { useApp } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { translateFoodName } from "@/lib/food-translations";
import { formatNumber, formatTime } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MEAL_SLOTS = [
  { key: "breakfast", labelKey: "breakfast" as const, emoji: "🌅" },
  { key: "lunch", labelKey: "lunch" as const, emoji: "☀️" },
  { key: "dinner", labelKey: "dinner" as const, emoji: "🌙" },
  { key: "snack", labelKey: "snacks" as const, emoji: "🍿" },
] as const;

type SlotKey = (typeof MEAL_SLOTS)[number]["key"];

interface MealItem {
  id: string;
  type: string;
  title: string | null;
  macros: { calories: number; protein: number; carbs: number; fat: number } | null;
  mealId: string | null;
  imageUrl: string | null;
  timestamp: string;
  mealSlot: string | null;
}

function DraggableMeal({
  meal,
  onOpen,
}: {
  meal: MealItem;
  onOpen: (m: MealItem) => void;
}) {
  const { locale, t } = useI18n();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: meal.id,
    data: { mealId: meal.mealId, currentSlot: meal.mealSlot },
  });

  return (
    <div className="flex items-center gap-1">
      <button
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        className="flex h-8 w-5 shrink-0 cursor-grab items-center justify-center text-muted-foreground/40 transition-colors hover:text-muted-foreground active:cursor-grabbing"
        aria-label={t("dragToReorder")}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onOpen}
        className={cn(
          "flex flex-1 items-center gap-2 rounded-lg p-1.5 text-left transition-colors hover:bg-secondary/50",
          isDragging && "opacity-40"
        )}
      >
        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-secondary text-sm">
          {meal.imageUrl ? <img src={meal.imageUrl} alt="" className="h-8 w-8 object-cover" /> : "🍽️"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="truncate text-xs font-medium">{translateFoodName(meal.title, locale)}</div>
          <div className="text-[10px] text-muted-foreground">
            {meal.macros && (
              <>
                <span className="text-streak">{formatNumber(meal.macros.calories, locale)} {t("cal")}</span>
                <span className="mx-1">·</span>
                <span className="text-protein">{locale === "fa" ? "پ" : "P"}{formatNumber(Math.round(meal.macros.protein), locale)}</span>
                <span className="mx-0.5">·</span>
                <span className="text-carbs">{locale === "fa" ? "ک" : "C"}{formatNumber(Math.round(meal.macros.carbs), locale)}</span>
                <span className="mx-0.5">·</span>
                <span className="text-fats">{locale === "fa" ? "چ" : "F"}{formatNumber(Math.round(meal.macros.fat), locale)}</span>
              </>
            )}
          </div>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {formatTime(meal.timestamp, locale)}
        </span>
      </motion.button>
    </div>
  );
}

function DroppableSlot({
  slot,
  meals,
  onOpen,
  onAddMeal,
}: {
  slot: (typeof MEAL_SLOTS)[number];
  meals: MealItem[];
  onOpen: (m: MealItem) => void;
  onAddMeal: () => void;
}) {
  const { locale, t } = useI18n();
  const { setNodeRef, isOver } = useDroppable({ id: slot.key, data: { slot: slot.key } });
  const slotCalories = meals.reduce((sum, m) => sum + (m.macros?.calories ?? 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl bg-card p-4 shadow-ios transition-colors",
        isOver && "ring-2 ring-streak ring-offset-2 ring-offset-background"
      )}
    >
      <div ref={setNodeRef} className="min-h-[60px]">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{slot.emoji}</span>
            <h3 className="text-sm font-semibold">{t(slot.labelKey)}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground tabular-nums">
              {slotCalories > 0 ? `${formatNumber(slotCalories, locale)} ${t("cal")}` : "—"}
            </span>
            <button
              onClick={onAddMeal}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
              aria-label={t(slot.labelKey)}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
        {meals.length > 0 ? (
          <div className="space-y-1.5">
            {meals.map((m) => (
              <DraggableMeal key={m.id} meal={m} onOpen={() => onOpen(m)} />
            ))}
          </div>
        ) : (
          <p className="py-1 text-xs text-muted-foreground/60">{t("nothingLogged")}</p>
        )}
      </div>
    </motion.div>
  );
}

export function MealsBySlot() {
  const { data } = useDashboard();
  const { setModal, setEditingLog } = useApp();
  const { locale, t } = useI18n();
  const updateLog = useUpdateLog();
  const mealsBySlot = data?.mealsBySlot;
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  if (!mealsBySlot) return null;

  // Collect all meals across slots to find the active drag item
  const allMeals: MealItem[] = [
    ...(mealsBySlot.breakfast as unknown as MealItem[]),
    ...(mealsBySlot.lunch as unknown as MealItem[]),
    ...(mealsBySlot.dinner as unknown as MealItem[]),
    ...(mealsBySlot.snack as unknown as MealItem[]),
  ];
  const activeMeal = activeId ? allMeals.find((m) => m.id === activeId) : null;

  function openMealDetail(m: MealItem) {
    if (m.type === "meal" && m.mealId) {
      setEditingLog({
        id: m.id,
        type: m.type,
        title: m.title,
        macros: m.macros,
        mealId: m.mealId,
      });
      setModal("meal-detail");
    }
  }

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const mealId = String(active.id);
    const targetSlot = String(over.id) as SlotKey;
    if (!["breakfast", "lunch", "dinner", "snack"].includes(targetSlot)) return;
    // Find current slot of this meal
    const meal = allMeals.find((m) => m.id === mealId);
    if (!meal) return;
    if (meal.mealSlot === targetSlot) return; // no change

    // Optimistic: call update API
    updateLog.mutate(
      { logId: meal.id, mealSlot: targetSlot },
      {
        onSuccess: () => toast.success(t("mealMoved")),
        onError: () => toast.error(t("failedToUpdate")),
      }
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="space-y-3">
        {MEAL_SLOTS.map((slot) => {
          const meals = (mealsBySlot[slot.key as keyof typeof mealsBySlot] ?? []) as unknown as MealItem[];
          return (
            <DroppableSlot
              key={slot.key}
              slot={slot}
              meals={meals}
              onOpen={openMealDetail}
              onAddMeal={() => setModal("add-action")}
            />
          );
        })}
      </div>
      <DragOverlay>
        {activeMeal ? (
          <div className="flex items-center gap-2 rounded-lg bg-card p-1.5 shadow-lg ring-2 ring-streak">
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-secondary text-sm">
              {activeMeal.imageUrl ? <img src={activeMeal.imageUrl} alt="" className="h-8 w-8 object-cover" /> : "🍽️"}
            </div>
            <span className="text-xs font-medium">
              {translateFoodName(activeMeal.title, locale)}
            </span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
