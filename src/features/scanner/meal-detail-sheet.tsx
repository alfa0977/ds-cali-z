"use client";
import { X, Flame, Drumstick, Wheat, Droplets, Star, Pencil, Trash2, Clock } from "lucide-react";
import { useApp } from "@/lib/store";
import { useMealDetail, useAddFavorite, useDeleteLog } from "@/lib/hooks";
import { ProgressRing } from "@/components/progress-ring";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";

export function MealDetailSheet() {
  const { editingLog, setModal, setEditingLog } = useApp();
  const mealId = editingLog?.mealId ?? undefined;
  const { data: meal, isLoading } = useMealDetail(mealId);
  const addFavorite = useAddFavorite();
  const deleteLog = useDeleteLog();

  if (!editingLog) return null;

  const macros = meal?.macros ?? editingLog.macros;
  const ingredients = meal?.ingredients ?? [];
  const title = meal?.title ?? editingLog.title ?? "Meal";
  const imageUrl = meal?.imageUrl;
  const healthScore = meal?.healthScore ?? 0;
  const ts = editingLog.timestamp ?? meal?.createdAt;
  const time = ts ? new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "";

  function addFav() {
    if (!macros) return;
    addFavorite.mutate({
      name: title,
      calories: macros.calories,
      protein: macros.protein,
      carbs: macros.carbs,
      fat: macros.fat,
      emoji: "🍽️",
    });
  }

  function remove() {
    deleteLog.mutate(editingLog!.id, {
      onSuccess: () => {
        setEditingLog(null);
        setModal(null);
      },
    });
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={() => { setEditingLog(null); setModal(null); }} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-base font-semibold">Meal details</h2>
        <button onClick={addFav} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary" aria-label="Add to favorites">
          <Star className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto thin-scrollbar pb-4">
        {/* hero image */}
        {imageUrl && (
          <div className="relative mx-4 mb-4 h-48 overflow-hidden rounded-2xl">
            <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              <div className="flex items-center gap-1.5 text-white/90">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">{time}</span>
              </div>
              <h1 className="text-xl font-bold text-white">{title}</h1>
            </div>
          </div>
        )}

        {!imageUrl && (
          <div className="px-4 pb-3">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-xs">{time}</span>
            </div>
            <h1 className="text-2xl font-bold">{title}</h1>
          </div>
        )}

        {/* nutrition summary */}
        <div className="px-4">
          <div className="grid grid-cols-4 gap-2">
            <NutCard label="Calories" value={macros?.calories ?? 0} unit="" icon={Flame} color="var(--streak)" />
            <NutCard label="Protein" value={macros?.protein ?? 0} unit="g" icon={Drumstick} color="var(--protein)" />
            <NutCard label="Carbs" value={macros?.carbs ?? 0} unit="g" icon={Wheat} color="var(--carbs)" />
            <NutCard label="Fats" value={macros?.fat ?? 0} unit="g" icon={Droplets} color="var(--fats)" />
          </div>
        </div>

        {/* health score */}
        {healthScore > 0 && (
          <div className="px-4 mt-3">
            <div className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-ios">
              <ProgressRing value={healthScore} size={48} strokeWidth={5} color={healthScore >= 70 ? "var(--success)" : healthScore >= 40 ? "var(--carbs)" : "var(--protein)"}>
                <span className="text-xs font-bold">{healthScore}</span>
              </ProgressRing>
              <div className="flex-1">
                <div className="text-sm font-semibold">Health score</div>
                <div className="text-xs text-muted-foreground">
                  {healthScore >= 70 ? "Excellent nutritional balance" : healthScore >= 40 ? "Moderate balance" : "Could be healthier"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ingredients */}
        {ingredients.length > 0 && (
          <div className="px-4 mt-4">
            <h3 className="mb-2 text-sm font-semibold">Ingredients ({ingredients.length})</h3>
            <div className="space-y-2">
              {ingredients.map((ing: { name: string; estimatedWeightGrams: number; confidence: number; volumeMl?: number }, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-ios"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-sm">
                    {ing.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{ing.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round(ing.estimatedWeightGrams)}g
                      {ing.volumeMl && ` · ${Math.round(ing.volumeMl)}ml`}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${ing.confidence * 100}%`,
                          backgroundColor: ing.confidence > 0.7 ? "var(--success)" : ing.confidence > 0.4 ? "var(--carbs)" : "var(--protein)",
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{Math.round(ing.confidence * 100)}%</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {isLoading && !meal && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">Loading meal details…</div>
        )}

        {/* actions */}
        <div className="px-4 mt-4 flex gap-3">
          <Button variant="outline" className="flex-1 rounded-full" onClick={() => setModal("edit-log")}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="flex-1 rounded-full text-destructive border-destructive/30 hover:bg-destructive/10">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this meal?</AlertDialogTitle>
                <AlertDialogDescription>This permanently removes the meal and its log entry.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

function NutCard({ label, value, unit, icon: Icon, color }: { label: string; value: number; unit: string; icon: typeof Flame; color: string }) {
  return (
    <div className="rounded-2xl bg-card p-2.5 shadow-ios text-center">
      <Icon className="mx-auto h-4 w-4 mb-1" style={{ color }} />
      <div className="text-base font-bold tabular-nums" style={{ color }}>
        {value}
        {unit && <span className="text-[10px] font-medium text-muted-foreground">{unit}</span>}
      </div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
