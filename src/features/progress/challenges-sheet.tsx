"use client";
import { X, Trophy, Flame, Check, Plus } from "lucide-react";
import { useApp } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { useChallenges, useJoinChallenge, useLeaveChallenge } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ChallengesSheet() {
  const { setModal } = useApp();
  const { locale, t } = useI18n();
  const { data, isLoading } = useChallenges();
  const join = useJoinChallenge();
  const leave = useLeaveChallenge();

  const active = data?.challenges.filter((c) => c.status === "active") ?? [];
  const completed = data?.challenges.filter((c) => c.status === "completed") ?? [];
  const available = data?.available ?? [];

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={() => setModal(null)} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
          <X className="h-5 w-5" />
        </button>
        <h2 className="flex items-center gap-1.5 text-base font-semibold">
          <Trophy className="h-4 w-4 text-streak" />
          {t("challenges")}
        </h2>
        <div className="h-9 w-9" />
      </div>

      <div className="flex-1 overflow-y-auto thin-scrollbar px-4 pb-4">
        {isLoading && <p className="py-8 text-center text-sm text-muted-foreground">{t("loading")}</p>}

        {/* Active challenges */}
        {active.length > 0 && (
          <div className="mb-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("activeChallenges")} ({active.length})
            </h3>
            <div className="space-y-2">
              {active.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl bg-card p-4 shadow-ios"
                >
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-streak/15 text-2xl">
                      {c.def.emoji}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold">{locale === "fa" ? c.def.labelFa : c.def.labelEn}</div>
                      <div className="text-xs text-muted-foreground">{locale === "fa" ? c.def.descFa : c.def.descEn}</div>
                    </div>
                  </div>
                  {/* progress */}
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium">{t("challengeProgress")}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {c.daysCompleted}/{c.targetDays} {t("days")}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${c.progress}%` }}
                      transition={{ duration: 0.6 }}
                      className="h-full rounded-full bg-gradient-to-r from-streak to-amber-400"
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      🎁 {t("reward")}: {locale === "fa" ? c.def.rewardFa : c.def.rewardEn}
                    </span>
                    <button
                      onClick={() => leave.mutate({ type: c.type })}
                      className="text-[10px] font-medium text-destructive"
                    >
                      {t("leave")}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <div className="mb-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("completed")} ({completed.length})
            </h3>
            <div className="space-y-2">
              {completed.map((c) => (
                <div key={c.id} className="flex items-center gap-3 rounded-2xl bg-success/10 p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success text-white">
                    <Check className="h-5 w-5" strokeWidth={3} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{locale === "fa" ? c.def.labelFa : c.def.labelEn}</div>
                    <div className="text-xs text-success">{t("completed")} ✓</div>
                  </div>
                  <span className="text-xl">{c.def.emoji}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available to join */}
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {locale === "fa" ? "چالش‌های موجود" : "Available Challenges"}
          </h3>
          <div className="space-y-2">
            {available.map((c, i) => (
              <motion.div
                key={c.type}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn(
                  "rounded-2xl bg-card p-4 shadow-ios",
                  c.joined && "opacity-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-2xl">
                    {c.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold">{locale === "fa" ? c.labelFa : c.labelEn}</div>
                    <div className="text-xs text-muted-foreground">{locale === "fa" ? c.descFa : c.descEn}</div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground">
                      🎁 {locale === "fa" ? c.rewardFa : c.rewardEn}
                    </div>
                  </div>
                  {!c.joined ? (
                    <Button
                      size="sm"
                      className="rounded-full"
                      disabled={join.isPending}
                      onClick={() => {
                        join.mutate(c.type, { onSuccess: () => toast.success(locale === "fa" ? "به چالش پیوستید!" : "Challenge joined!") });
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {t("join")}
                    </Button>
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground">{t("completed")}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
