"use client";
import { useDashboard, useUpdateUser, useImportData } from "@/lib/hooks";
import { useApp } from "@/lib/store";
import { ChevronRight, Crown, Moon, Bell, Shield, Trash2, LogOut, Heart, Pencil, Download, FileText, Database, Upload, Share2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProgressRing } from "@/components/progress-ring";
import { toast } from "sonner";
import { useRef } from "react";

export function SettingsScreen() {
  const { data } = useDashboard();
  const { setModal } = useApp();
  const user = data?.user;
  const importData = useImportData();
  const fileRef = useRef<HTMLInputElement>(null);

  function downloadExport(format: "json" | "csv") {
    const a = document.createElement("a");
    a.href = `/api/exportData?format=${format}`;
    a.download = `calai-export-${new Date().toISOString().slice(0, 10)}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`Exporting data as ${format.toUpperCase()}…`);
  }

  function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string);
        importData.mutate(json);
      } catch {
        toast.error("Invalid JSON file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="space-y-4 px-4 pb-4">
      <h1 className="px-1 text-3xl font-bold tracking-tight">Settings</h1>

      {/* profile card */}
      <button
        onClick={() => setModal("edit-profile")}
        className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 shadow-ios"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-streak to-protein text-xl font-bold text-white">
          {(user?.displayName ?? "A").charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 text-left">
          <div className="text-base font-semibold">{user?.displayName ?? "User"}</div>
          <div className="text-xs text-muted-foreground">{user?.email}</div>
        </div>
        <Pencil className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* goals summary */}
      {user && (
        <div className="rounded-2xl bg-card p-4 shadow-ios">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Daily goals</h3>
            <button onClick={() => setModal("edit-goals")} className="text-xs font-medium text-muted-foreground">Edit</button>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <GoalStat label="Cal" value={user.goals.calories} color="var(--streak)" />
            <GoalStat label="Protein" value={user.goals.protein} unit="g" color="var(--protein)" />
            <GoalStat label="Carbs" value={user.goals.carbs} unit="g" color="var(--carbs)" />
            <GoalStat label="Fats" value={user.goals.fat} unit="g" color="var(--fats)" />
          </div>
        </div>
      )}

      {/* premium upsell */}
      <button
        onClick={() => setModal("paywall")}
        className="flex w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-400 to-streak p-4 text-white shadow-ios"
      >
        <Crown className="h-6 w-6" />
        <div className="flex-1 text-left">
          <div className="text-sm font-bold">CalAI Premium</div>
          <div className="text-xs text-white/80">Unlimited scans · Advanced analytics</div>
        </div>
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* settings list */}
      <div className="overflow-hidden rounded-2xl bg-card shadow-ios">
        <Row icon={Moon} label="Appearance" right={<ThemeToggle />} />
        <Divider />
        <Row icon={Bell} label="Reminders" right={<ChevronRight className="h-4 w-4 text-muted-foreground" />} onClick={() => setModal("reminders")} />
        <Divider />
        <Row icon={Share2} label="Share progress" right={<ChevronRight className="h-4 w-4 text-muted-foreground" />} onClick={() => setModal("share")} />
        <Divider />
        <Row icon={Heart} label="Health connections" right={<span className="text-xs font-medium text-success">Connected</span>} />
        <Divider />
        <Row icon={Shield} label="Privacy & data" right={<ChevronRight className="h-4 w-4 text-muted-foreground" />} />
      </div>

      {/* data export */}
      <div>
        <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Data</h3>
        <div className="overflow-hidden rounded-2xl bg-card shadow-ios">
          <Row icon={FileText} label="Export as JSON" right={<ChevronRight className="h-4 w-4 text-muted-foreground" />} onClick={() => downloadExport("json")} />
          <Divider />
          <Row icon={Download} label="Export as CSV" right={<ChevronRight className="h-4 w-4 text-muted-foreground" />} onClick={() => downloadExport("csv")} />
          <Divider />
          <Row icon={Upload} label="Import from JSON" right={<ChevronRight className="h-4 w-4 text-muted-foreground" />} onClick={() => fileRef.current?.click()} />
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" onChange={onImportFile} className="hidden" />
      </div>

      <div className="overflow-hidden rounded-2xl bg-card shadow-ios">
        <Row icon={LogOut} label="Log out" danger />
        <Divider />
        <Row icon={Trash2} label="Delete account" danger />
      </div>

      <p className="pt-2 text-center text-xs text-muted-foreground">CalAI v1.0.0 · Made with 💚</p>
    </div>
  );
}

function GoalStat({ label, value, unit, color }: { label: string; value: number; unit?: string; color: string }) {
  return (
    <div>
      <ProgressRing value={100} size={44} strokeWidth={5} color={color}>
        <span className="text-[10px] font-bold tabular-nums">{value}</span>
      </ProgressRing>
      <div className="mt-1 text-[11px] text-muted-foreground">{label}{unit ? ` ${unit}` : ""}</div>
    </div>
  );
}

function Row({ icon: Icon, label, right, danger, onClick }: { icon: typeof Moon; label: string; right?: React.ReactNode; danger?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-secondary">
      <Icon className={danger ? "h-5 w-5 text-destructive" : "h-5 w-5 text-muted-foreground"} />
      <span className={danger ? "flex-1 text-sm font-medium text-destructive" : "flex-1 text-sm font-medium"}>{label}</span>
      {right}
    </button>
  );
}

function Divider() {
  return <div className="ml-12 border-t border-border" />;
}
