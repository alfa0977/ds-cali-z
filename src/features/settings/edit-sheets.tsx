"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDashboard, useUpdateUser } from "@/lib/hooks";

export function EditProfileSheet() {
  const { setModal } = useApp();
  const { data } = useDashboard();
  const updateUser = useUpdateUser();
  const [displayName, setDisplayName] = useState(data?.user.displayName ?? "");
  const [weightKg, setWeightKg] = useState(String(data?.user.weightKg ?? ""));
  const [heightCm, setHeightCm] = useState(String(data?.user.heightCm ?? ""));

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={() => setModal(null)} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-base font-semibold">Edit profile</h2>
        <div className="h-9 w-9" />
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" className="rounded-xl bg-secondary border-0" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Weight (kg)</Label>
            <Input type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} className="rounded-xl bg-secondary border-0" />
          </div>
          <div className="space-y-1.5">
            <Label>Height (cm)</Label>
            <Input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className="rounded-xl bg-secondary border-0" />
          </div>
        </div>
      </div>
      <div className="border-t border-border bg-card px-4 py-3 pb-safe">
        <Button
          className="w-full rounded-full py-3"
          size="lg"
          disabled={updateUser.isPending}
          onClick={() =>
            updateUser.mutate(
              {
                displayName,
                weightKg: weightKg ? Number(weightKg) : undefined,
                heightCm: heightCm ? Number(heightCm) : undefined,
              },
              { onSuccess: () => setModal(null) }
            )
          }
        >
          {updateUser.isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}

export function EditGoalsSheet() {
  const { setModal } = useApp();
  const { data } = useDashboard();
  const updateUser = useUpdateUser();
  const g = data?.user.goals ?? { calories: 2500, protein: 150, carbs: 250, fat: 70 };
  const [calories, setCalories] = useState(String(g.calories));
  const [protein, setProtein] = useState(String(g.protein));
  const [carbs, setCarbs] = useState(String(g.carbs));
  const [fat, setFat] = useState(String(g.fat));

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={() => setModal(null)} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-base font-semibold">Daily goals</h2>
        <div className="h-9 w-9" />
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        <div className="space-y-1.5">
          <Label>Calories</Label>
          <Input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} className="rounded-xl bg-secondary border-0" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-protein">Protein (g)</Label>
            <Input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} className="rounded-xl bg-secondary border-0" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-carbs">Carbs (g)</Label>
            <Input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} className="rounded-xl bg-secondary border-0" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-fats">Fats (g)</Label>
            <Input type="number" value={fat} onChange={(e) => setFat(e.target.value)} className="rounded-xl bg-secondary border-0" />
          </div>
        </div>
      </div>
      <div className="border-t border-border bg-card px-4 py-3 pb-safe">
        <Button
          className="w-full rounded-full py-3"
          size="lg"
          disabled={updateUser.isPending}
          onClick={() =>
            updateUser.mutate(
              {
                goals: {
                  calories: Number(calories),
                  protein: Number(protein),
                  carbs: Number(carbs),
                  fat: Number(fat),
                },
              },
              { onSuccess: () => setModal(null) }
            )
          }
        >
          {updateUser.isPending ? "Saving…" : "Save goals"}
        </Button>
      </div>
    </div>
  );
}
