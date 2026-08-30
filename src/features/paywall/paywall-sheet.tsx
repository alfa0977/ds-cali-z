"use client";
import { X, Check, Crown, Sparkles } from "lucide-react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";

const FEATURE_KEYS = [
  { icon: "📸", titleKey: "unlimitedAiScans", descKey: "scanEveryMealNoLimits" },
  { icon: "📊", titleKey: "advancedAnalytics", descKey: "deepInsightsTrends" },
  { icon: "🎯", titleKey: "smartGoals", descKey: "aiPersonalizedMacroTargets" },
  { icon: "🚫", titleKey: "adFreeExperience", descKey: "noInterruptionsEver" },
] as const;

const PLANS = [
  { id: "yearly", labelKey: "yearly" as const, price: "$59.99", perKey: "perYear" as const, saveKey: "save50" as const, popular: true },
  { id: "monthly", labelKey: "monthly" as const, price: "$9.99", perKey: "perMonth" as const, saveKey: null, popular: false },
];

export function PaywallSheet() {
  const { setModal } = useApp();
  const [selected, setSelected] = useState("yearly");
  const { t } = useI18n();
  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between px-4 pt-4">
        <button onClick={() => setModal(null)} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-4">
        <div className="mt-4 flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 to-streak shadow-fab">
            <Crown className="h-10 w-10 text-white" />
          </div>
          <h2 className="mt-4 text-2xl font-bold">{t("calaiPremium")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("unlockYourFullPotential")}</p>
        </div>

        <div className="mt-6 space-y-3">
          {FEATURE_KEYS.map((f) => (
            <div key={f.titleKey} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-ios">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-xl">{f.icon}</div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{t(f.titleKey)}</div>
                <div className="text-xs text-muted-foreground">{t(f.descKey)}</div>
              </div>
              <Check className="h-5 w-5 text-success" />
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-2">
          {PLANS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={`flex w-full items-center gap-3 rounded-2xl border-2 p-4 transition-colors ${
                selected === p.id ? "border-foreground bg-card" : "border-border bg-card"
              }`}
            >
              <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${selected === p.id ? "border-foreground bg-foreground" : "border-muted-foreground"}`}>
                {selected === p.id && <Check className="h-3 w-3 text-background" />}
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{t(p.labelKey)}</span>
                  {p.popular && (
                    <span className="rounded-full bg-streak/15 px-2 py-0.5 text-[10px] font-bold text-streak">
                      <Sparkles className="mr-0.5 inline h-2.5 w-2.5" />{t("popular")}
                    </span>
                  )}
                </div>
                {p.saveKey && <div className="text-xs text-success">{t(p.saveKey)}</div>}
              </div>
              <div className="text-right">
                <span className="text-lg font-bold">{p.price}</span>
                <span className="text-xs text-muted-foreground">{t(p.perKey)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border bg-card px-6 py-4 pb-safe">
        <Button className="w-full rounded-full py-3 text-base" size="lg">
          {t("start7DayFreeTrial")}
        </Button>
        <button className="mt-2 w-full text-center text-xs text-muted-foreground">
          {t("restorePurchases")}
        </button>
      </div>
    </div>
  );
}
