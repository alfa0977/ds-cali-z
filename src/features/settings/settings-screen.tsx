"use client";
import { useDashboard, useUpdateUser, useImportData, exportData, deleteAccount } from "@/lib/hooks";
import { useApp } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { getSubscriptionConfig } from "@/lib/subscription";
import {
  ChevronRight, Moon, Bell, Shield, Trash2, LogOut, Heart, Pencil,
  Download, FileText, Upload, Share2, Globe, Palette, Trophy, HelpCircle,
  UserCircle, Cpu, Crown,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProgressRing } from "@/components/progress-ring";
import { toast } from "sonner";
import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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

export function SettingsScreen() {
  const { data } = useDashboard();
  const { setModal } = useApp();
  const { locale, t } = useI18n();
  const user = data?.user;
  const importData = useImportData();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [subConfig, setSubConfig] = useState(() => getSubscriptionConfig());

  async function downloadExport(format: "json" | "csv") {
    try {
      const text = await exportData(format);
      const blob = new Blob([text], { type: format === "json" ? "application/json" : "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ds-cali-export-${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`${t("exportingData")} ${format.toUpperCase()}…`);
    } catch (e) {
      console.error("Export failed:", e);
      toast.error(t("failedToUpdate"));
    }
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
        toast.error(t("invalidJsonFile"));
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  async function handleLogout() {
    // In this app there's no remote session — "logging out" just clears the in-memory
    // query cache and reloads to the welcome screen. Local data stays intact.
    toast.success(t("loggedOut"));
    await qc.clear();
    setTimeout(() => window.location.reload(), 400);
  }

  async function handleDeleteAccount() {
    try {
      await deleteAccount();
      await qc.clear();
      toast.success(t("accountDeleted"));
      setTimeout(() => window.location.reload(), 600);
    } catch (e) {
      console.error(e);
      toast.error(t("failedToDelete"));
    }
  }

  return (
    <div className="space-y-4 px-4 pb-4">
      <h1 className="px-1 text-3xl font-bold tracking-tight">{t("settings")}</h1>

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
            <h3 className="text-sm font-semibold">{t("dailyGoals")}</h3>
            <button onClick={() => setModal("edit-goals")} className="text-xs font-medium text-muted-foreground">{t("edit")}</button>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <GoalStat label={t("cal")} value={user.goals.calories} color="var(--streak)" />
            <GoalStat label={t("proteinLeft").replace(" left", "").replace(" باقی", "")} value={user.goals.protein} unit="g" color="var(--protein)" />
            <GoalStat label={t("carbsLeft").replace(" left", "").replace(" باقی", "")} value={user.goals.carbs} unit="g" color="var(--carbs)" />
            <GoalStat label={t("fatsLeft").replace(" left", "").replace(" باقی", "")} value={user.goals.fat} unit="g" color="var(--fats)" />
          </div>
        </div>
      )}

      {/* Appearance & personalization */}
      <div>
        <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {locale === "fa" ? "شخصی‌سازی" : "Personalization"}
        </h3>
        <div className="overflow-hidden rounded-2xl bg-card shadow-ios">
          <Row icon={Moon} label={t("appearance")} right={<ThemeToggle />} onClick={() => {}} />
          <Divider />
          <Row icon={Palette} label={t("themeColor")} right={<ChevronRight className="h-4 w-4 text-muted-foreground" />} onClick={() => setModal("theme-color")} />
          <Divider />
          <Row icon={Globe} label={t("language")} right={<span className="text-xs font-medium text-muted-foreground">{locale === "fa" ? "فارسی" : "English"}</span>} onClick={() => setModal("language")} />
        </div>
      </div>

      {/* Gamification */}
      <div>
        <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {locale === "fa" ? "گیمیفیکیشن" : "Gamification"}
        </h3>
        <div className="overflow-hidden rounded-2xl bg-card shadow-ios">
          <Row icon={Trophy} label={t("challenges")} right={<ChevronRight className="h-4 w-4 text-muted-foreground" />} onClick={() => setModal("challenges")} />
        </div>
      </div>

      {/* Notifications & sharing */}
      <div>
        <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {locale === "fa" ? "اعلان‌ها و اشتراک" : "Notifications & Sharing"}
        </h3>
        <div className="overflow-hidden rounded-2xl bg-card shadow-ios">
          <Row icon={Bell} label={t("reminders")} right={<ChevronRight className="h-4 w-4 text-muted-foreground" />} onClick={() => setModal("reminders")} />
          <Divider />
          <Row icon={Share2} label={t("shareProgress")} right={<ChevronRight className="h-4 w-4 text-muted-foreground" />} onClick={() => setModal("share")} />
        </div>
      </div>

      {/* Health & privacy */}
      <div>
        <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {locale === "fa" ? "سلامت و حریم خصوصی" : "Health & Privacy"}
        </h3>
        <div className="overflow-hidden rounded-2xl bg-card shadow-ios">
          <Row icon={Heart} label={t("healthConnections")} right={<span className="text-xs font-medium text-success">{t("connected")}</span>} onClick={() => {}} />
          <Divider />
          <Row icon={Shield} label={t("privacyData")} right={<ChevronRight className="h-4 w-4 text-muted-foreground" />} onClick={() => setModal("privacy-data")} />
        </div>
      </div>

      {/* Account */}
      <div>
        <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {locale === "fa" ? "حساب کاربری" : "Account"}
        </h3>
        <div className="overflow-hidden rounded-2xl bg-card shadow-ios">
          <Row icon={UserCircle} label={locale === "fa" ? "ورود / ثبت‌نام" : "Login / Sign up"} right={<ChevronRight className="h-4 w-4 text-muted-foreground" />} onClick={() => setModal("login")} />
          <Divider />
          <Row icon={Crown} label={locale === "fa" ? "پریمیوم" : "Premium"} right={<span className="text-xs font-medium text-streak">{subConfig.tier === "premium" ? "👑" : "🆓"}</span>} onClick={() => setModal("paywall")} />
        </div>
      </div>

      {/* Developer */}
      <div>
        <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {locale === "fa" ? "توسعه‌دهنده" : "Developer"}
        </h3>
        <div className="overflow-hidden rounded-2xl bg-card shadow-ios">
          <Row icon={Cpu} label={locale === "fa" ? "تنظیمات توسعه‌دهنده" : "Developer Settings"} right={<ChevronRight className="h-4 w-4 text-muted-foreground" />} onClick={() => setModal("developer")} />
        </div>
      </div>

      {/* data export */}
      <div>
        <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("data")}</h3>
        <div className="overflow-hidden rounded-2xl bg-card shadow-ios">
          <Row icon={FileText} label={t("exportJson")} right={<ChevronRight className="h-4 w-4 text-muted-foreground" />} onClick={() => downloadExport("json")} />
          <Divider />
          <Row icon={Download} label={t("exportCsv")} right={<ChevronRight className="h-4 w-4 text-muted-foreground" />} onClick={() => downloadExport("csv")} />
          <Divider />
          <Row icon={Upload} label={t("importJson")} right={<ChevronRight className="h-4 w-4 text-muted-foreground" />} onClick={() => fileRef.current?.click()} />
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" onChange={onImportFile} className="hidden" />
      </div>

      <div className="overflow-hidden rounded-2xl bg-card shadow-ios">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Row icon={LogOut} label={t("logOut")} danger />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("logOut")}</AlertDialogTitle>
              <AlertDialogDescription>{t("logOutConfirm")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout}>{t("logOut")}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Divider />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Row icon={Trash2} label={t("deleteAccount")} danger />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("deleteAccount")}</AlertDialogTitle>
              <AlertDialogDescription>{t("deleteAccountConfirm")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t("delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <p className="flex items-center justify-center gap-1 pt-2 text-center text-xs text-muted-foreground">
        <HelpCircle className="h-3 w-3" />
        DS-Cali v1.0.0 · {locale === "fa" ? "ساخته‌شده با 💚" : "Made with 💚"}
      </p>
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
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-secondary"
    >
      <Icon className={danger ? "h-5 w-5 text-destructive" : "h-5 w-5 text-muted-foreground"} />
      <span className={danger ? "flex-1 text-sm font-medium text-destructive" : "flex-1 text-sm font-medium"}>{label}</span>
      {right}
    </div>
  );
}

function Divider() {
  return <div className="ml-12 border-t border-border" />;
}
