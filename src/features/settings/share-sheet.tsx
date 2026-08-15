"use client";
import { X, Share2, Download, MessageCircle, Twitter, Facebook, Link2, Check } from "lucide-react";
import { useApp } from "@/lib/store";
import { useDashboard } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/progress-ring";
import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { formatNumber } from "@/lib/date-utils";

export function ShareSheet() {
  const { setModal } = useApp();
  const { data } = useDashboard();
  const [copied, setCopied] = useState(false);
  const { locale, t } = useI18n();

  if (!data) return null;

  const consumed = data.consumed;
  const goals = data.user.goals;
  const streak = data.user.streak;
  const calPct = Math.round((consumed.calories / goals.calories) * 100);

  const shareText = t("shareTextTemplate")
    .replace("{0}", formatNumber(consumed.calories, locale))
    .replace("{1}", formatNumber(goals.calories, locale))
    .replace("{2}", formatNumber(calPct, locale))
    .replace("{3}", formatNumber(Math.round(consumed.protein), locale))
    .replace("{4}", formatNumber(goals.protein, locale))
    .replace("{5}", formatNumber(streak, locale));

  function copyLink() {
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      toast.success(t("copiedToClipboard"));
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function shareNative() {
    if (navigator.share) {
      navigator.share({ title: t("myProgressTitle"), text: shareText }).catch(() => {});
    } else {
      copyLink();
    }
  }

  const sharePlatforms = [
    { label: "WhatsApp", icon: MessageCircle, color: "#25D366", url: `https://wa.me/?text=${encodeURIComponent(shareText)}` },
    { label: "Twitter", icon: Twitter, color: "#1DA1F2", url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}` },
    { label: "Facebook", icon: Facebook, color: "#1877F2", url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://calai.app")}&quote=${encodeURIComponent(shareText)}` },
  ];

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={() => setModal(null)} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
          <X className="h-5 w-5" />
        </button>
        <h2 className="flex items-center gap-1.5 text-base font-semibold">
          <Share2 className="h-4 w-4" />
          {t("shareProgress")}
        </h2>
        <div className="h-9 w-9" />
      </div>

      <div className="flex-1 overflow-y-auto thin-scrollbar px-4 pb-4">
        {/* share card preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-premium relative overflow-hidden rounded-2xl p-5"
        >
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-streak/10" />
          <div className="relative">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🍎</span>
                <span className="font-bold">{t("appName")}</span>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-streak/15 px-2 py-1 text-xs font-bold text-streak">
                🔥 {formatNumber(streak, locale)} {t("days")}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ProgressRing value={calPct} size={80} strokeWidth={8} color="var(--streak)">
                <div className="text-center">
                  <div className="text-base font-bold tabular-nums">{formatNumber(calPct, locale)}%</div>
                  <div className="text-[8px] text-muted-foreground">{t("ofGoal")}</div>
                </div>
              </ProgressRing>
              <div className="flex-1 space-y-1.5">
                <ShareStat label={t("calories")} value={`${formatNumber(consumed.calories, locale)}`} unit={`/${formatNumber(goals.calories, locale)}`} color="var(--streak)" />
                <ShareStat label={t("protein")} value={`${formatNumber(Math.round(consumed.protein), locale)}g`} unit={`/${formatNumber(goals.protein, locale)}g`} color="var(--protein)" />
                <ShareStat label={t("carbs")} value={`${formatNumber(Math.round(consumed.carbs), locale)}g`} unit={`/${formatNumber(goals.carbs, locale)}g`} color="var(--carbs)" />
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{t("trackingMyNutrition")}</p>
          </div>
        </motion.div>

        {/* share text preview */}
        <div className="mt-4 rounded-xl bg-secondary p-3">
          <p className="whitespace-pre-line text-xs text-muted-foreground">{shareText}</p>
        </div>

        {/* share options */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          {sharePlatforms.map((p, i) => (
            <motion.button
              key={p.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.open(p.url, "_blank")}
              className="flex flex-col items-center gap-2"
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
                style={{ backgroundColor: p.color }}
              >
                <p.icon className="h-6 w-6" />
              </div>
              <span className="text-xs font-medium">{p.label}</span>
            </motion.button>
          ))}
        </div>

        {/* copy + native share */}
        <div className="mt-4 space-y-2">
          <Button variant="outline" className="w-full rounded-full" onClick={shareNative}>
            <Share2 className="mr-2 h-4 w-4" />
            {t("shareVia")}
          </Button>
          <Button variant="outline" className="w-full rounded-full" onClick={copyLink}>
            {copied ? <Check className="mr-2 h-4 w-4 text-success" /> : <Link2 className="mr-2 h-4 w-4" />}
            {copied ? t("copied") : t("copyText")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ShareStat({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">
        <span className="font-bold" style={{ color }}>{value}</span>
        <span className="text-muted-foreground">{unit}</span>
      </span>
    </div>
  );
}
