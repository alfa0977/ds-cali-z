"use client";
import { useEffect, useState } from "react";
import { X, Shield, Database, Lock, Trash2, Info, HardDrive } from "lucide-react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { deleteAccount } from "@/lib/hooks";
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

export function PrivacyDataSheet() {
  const { setModal } = useApp();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [storageEstimate, setStorageEstimate] = useState<string>("—");

  useEffect(() => {
    // Estimate IndexedDB usage (best-effort; not all browsers support this)
    try {
      (navigator as Navigator & { storage?: { estimate?: () => Promise<{ usage?: number; quota?: number }> } }).storage?.estimate?.().then((est) => {
        if (est?.usage != null) {
          const kb = est.usage / 1024;
          const mb = kb / 1024;
          setStorageEstimate(mb >= 1 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(1)} KB`);
        }
      });
    } catch {}
  }, []);

  async function handleClearData() {
    try {
      await deleteAccount();
      await qc.invalidateQueries();
      toast.success(t("accountDeleted"));
      setModal(null);
      // Reload after a short delay so the toast is visible
      setTimeout(() => window.location.reload(), 600);
    } catch (e) {
      console.error(e);
      toast.error(t("failedToDelete"));
    }
  }

  const sections = [
    {
      icon: Lock,
      title: t("privacyDataTitle"),
      body: t("privacyDataDesc"),
      color: "var(--success)",
    },
    {
      icon: Database,
      title: t("data"),
      body: t("privacyDataDesc"),
      color: "var(--protein)",
    },
  ];

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={() => setModal(null)} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
          <X className="h-5 w-5" />
        </button>
        <h2 className="flex items-center gap-1.5 text-base font-semibold">
          <Shield className="h-4 w-4" />
          {t("privacyDataTitle")}
        </h2>
        <div className="h-9 w-9" />
      </div>

      <div className="flex-1 overflow-y-auto thin-scrollbar px-4 pb-4">
        {/* Hero */}
        <div className="mt-2 rounded-2xl bg-success/10 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/15">
              <Info className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm font-semibold text-success">{t("privacyDataTitle")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("privacyDataDesc")}</p>
            </div>
          </div>
        </div>

        {/* Storage usage */}
        <div className="mt-4 rounded-2xl bg-card p-4 shadow-ios">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
              <HardDrive className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">{t("storageUsed")}</div>
              <div className="text-xs text-muted-foreground">{t("privacyDataDesc")}</div>
            </div>
            <div className="text-sm font-bold tabular-nums">{storageEstimate}</div>
          </div>
        </div>

        {/* Privacy principles */}
        <div className="mt-4 space-y-2">
          {sections.map((s, i) => (
            <div key={i} className="rounded-2xl bg-card p-4 shadow-ios">
              <div className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `color-mix(in srgb, ${s.color} 15%, transparent)` }}
                >
                  <s.icon className="h-5 w-5" style={{ color: s.color }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{s.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{s.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Danger zone */}
        <div className="mt-4 overflow-hidden rounded-2xl bg-destructive/5">
          <div className="flex items-start gap-3 border-b border-destructive/10 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-destructive">{t("clearAllData")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("clearDataConfirm")}</p>
            </div>
          </div>
          <div className="p-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full rounded-full">
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("clearAllData")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("clearAllData")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("clearDataConfirm")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearData}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {t("delete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}
