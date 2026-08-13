"use client";
import { useState } from "react";
import { X, Trash2, Drumstick, Wheat, Droplets, Flame } from "lucide-react";
import { useApp } from "@/lib/store";
import { useDeleteLog, useUpdateLog } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export function EditLogSheet() {
  const { editingLog, setModal, setEditingLog } = useApp();
  const deleteLog = useDeleteLog();
  const updateLog = useUpdateLog();
  const [title, setTitle] = useState(editingLog?.title ?? "");
  const [calories, setCalories] = useState(String(editingLog?.macros?.calories ?? 0));
  const [protein, setProtein] = useState(String(editingLog?.macros?.protein ?? 0));
  const [carbs, setCarbs] = useState(String(editingLog?.macros?.carbs ?? 0));
  const [fat, setFat] = useState(String(editingLog?.macros?.fat ?? 0));

  if (!editingLog) return null;

  function save() {
    updateLog.mutate(
      {
        logId: editingLog!.id,
        title,
        macros: {
          calories: Number(calories) || 0,
          protein: Number(protein) || 0,
          carbs: Number(carbs) || 0,
          fat: Number(fat) || 0,
        },
      },
      {
        onSuccess: () => {
          setEditingLog(null);
          setModal(null);
        },
      }
    );
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
        <h2 className="text-base font-semibold">Edit entry</h2>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Trash2 className="h-5 w-5" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove the entry and its meal record. This action cannot be undone.
              </AlertDialogDescription>
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

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        <div className="space-y-1.5">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl bg-secondary border-0" />
        </div>

        {editingLog.type === "meal" && editingLog.macros && (
          <>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><Flame className="h-3.5 w-3.5 text-streak" /> Calories</Label>
              <Input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} className="rounded-xl bg-secondary border-0" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-protein"><Drumstick className="h-3.5 w-3.5" /> Protein</Label>
                <Input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} className="rounded-xl bg-secondary border-0" />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-carbs"><Wheat className="h-3.5 w-3.5" /> Carbs</Label>
                <Input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} className="rounded-xl bg-secondary border-0" />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-fats"><Droplets className="h-3.5 w-3.5" /> Fats</Label>
                <Input type="number" value={fat} onChange={(e) => setFat(e.target.value)} className="rounded-xl bg-secondary border-0" />
              </div>
            </div>
          </>
        )}

        {editingLog.type !== "meal" && (
          <p className="rounded-xl bg-secondary p-3 text-sm text-muted-foreground">
            Only meal entries can have macros edited. This {editingLog.type} entry can be deleted.
          </p>
        )}
      </div>

      <div className="border-t border-border bg-card px-4 py-3 pb-safe">
        <Button
          className="w-full rounded-full py-3"
          size="lg"
          disabled={updateLog.isPending}
          onClick={save}
        >
          {updateLog.isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
