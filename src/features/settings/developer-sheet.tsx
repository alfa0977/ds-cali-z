"use client";
import { useState, useEffect } from "react";
import { X, Cpu, Key, Globe, Crown, Check, AlertTriangle, Database, Trash2, Download } from "lucide-react";
import { useApp } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  AI_ENGINES,
  type AiEngineKey,
  type AiSettings,
  getAiSettings,
  saveAiSettings,
} from "@/lib/ai-engines";
import {
  getSubscriptionConfig,
  saveSubscriptionTier,
  startPremiumTrial,
  cancelPremium,
} from "@/lib/subscription";

export function DeveloperSheet() {
  const { setModal } = useApp();
  const { locale, t } = useI18n();
  const [aiSettings, setAiSettings] = useState<AiSettings>(() => getAiSettings());
  const [subConfig, setSubConfig] = useState(() => getSubscriptionConfig());

  function saveAi() {
    saveAiSettings(aiSettings);
    toast.success(locale === "fa" ? "تنظیمات AI ذخیره شد" : "AI settings saved");
  }

  function setTier(tier: "free" | "premium") {
    if (tier === "premium") {
      startPremiumTrial(30); // 30-day trial for testing
    } else {
      cancelPremium();
    }
    setSubConfig(getSubscriptionConfig());
    toast.success(locale === "fa" ? `طرح ${tier === "premium" ? "پریمیوم" : "رایگان"} فعال شد` : `Switched to ${tier} tier`);
  }

  async function clearAllData() {
    if (typeof window !== "undefined") {
      if (window.confirm(locale === "fa" ? "همه داده‌ها پاک شود؟" : "Clear ALL data?")) {
        localStorage.clear();
        try {
          const { openDB } = await import("idb");
          const db = await openDB("ds-cali-db", 1);
          await db.clear("users");
          await db.clear("foods");
          await db.clear("meals");
          await db.clear("logs");
          await db.clear("favorites");
          await db.clear("healthDaily");
        } catch {}
        toast.success(locale === "fa" ? "همه داده‌ها پاک شد" : "All data cleared");
        setTimeout(() => window.location.reload(), 800);
      }
    }
  }

  function exportDebugInfo() {
    const info = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      localStorage: { ...localStorage },
      subscription: getSubscriptionConfig(),
      aiSettings: getAiSettings(),
    };
    const blob = new Blob([JSON.stringify(info, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ds-cali-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(locale === "fa" ? "اطلاعات دیباگ خروجی گرفته شد" : "Debug info exported");
  }

  const currentEngine = AI_ENGINES.find((e) => e.key === aiSettings.engine);

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={() => setModal(null)} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
          <X className="h-5 w-5" />
        </button>
        <h2 className="flex items-center gap-1.5 text-base font-semibold">
          <Cpu className="h-4 w-4" />
          {locale === "fa" ? "تنظیمات توسعه‌دهنده" : "Developer Settings"}
        </h2>
        <div className="h-9 w-9" />
      </div>

      <div className="flex-1 overflow-y-auto thin-scrollbar px-4 pb-4 space-y-4">
        {/* AI Engine Section */}
        <div className="rounded-2xl bg-card p-4 shadow-ios">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
            <Cpu className="h-4 w-4 text-streak" />
            {locale === "fa" ? "موتور هوش مصنوعی" : "AI Engine"}
          </h3>
          <p className="mb-3 text-xs text-muted-foreground">
            {locale === "fa"
              ? "موتور تحلیل غذا را انتخاب کنید. اگر یکی کار نکرد، به‌صورت خودکار به اکتشافی برمی‌گردد."
              : "Choose the meal analysis engine. If one fails, it automatically falls back to heuristic."}
          </p>

          <div className="space-y-2">
            {AI_ENGINES.map((engine) => (
              <button
                key={engine.key}
                onClick={() => setAiSettings({ ...aiSettings, engine: engine.key as AiEngineKey })}
                className={`flex w-full items-start gap-3 rounded-xl border-2 p-3 text-left transition-colors ${
                  aiSettings.engine === engine.key ? "border-foreground bg-card" : "border-border bg-card"
                }`}
              >
                <span className="text-2xl">{engine.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold">
                      {locale === "fa" ? engine.labelFa : engine.label}
                    </span>
                    {aiSettings.engine === engine.key && <Check className="h-4 w-4 text-success" />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {locale === "fa" ? engine.descriptionFa : engine.description}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* API Key inputs */}
          {currentEngine?.requiresApiKey && (
            <div className="mt-3 space-y-2">
              {aiSettings.engine === "openai" && (
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs">
                    <Key className="h-3 w-3" />
                    OpenAI API Key
                  </Label>
                  <Input
                    type="password"
                    value={aiSettings.openaiApiKey}
                    onChange={(e) => setAiSettings({ ...aiSettings, openaiApiKey: e.target.value })}
                    placeholder="sk-..."
                    className="rounded-xl bg-secondary border-0 font-mono text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    {locale === "fa" ? "از platform.openai.com دریافت کنید" : "Get from platform.openai.com"}
                  </p>
                </div>
              )}
              {aiSettings.engine === "gemini" && (
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs">
                    <Key className="h-3 w-3" />
                    Google Gemini API Key
                  </Label>
                  <Input
                    type="password"
                    value={aiSettings.geminiApiKey}
                    onChange={(e) => setAiSettings({ ...aiSettings, geminiApiKey: e.target.value })}
                    placeholder="AIza..."
                    className="rounded-xl bg-secondary border-0 font-mono text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    {locale === "fa" ? "از aistudio.google.com دریافت کنید" : "Get from aistudio.google.com"}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Remote URL input */}
          {currentEngine?.requiresUrl && (
            <div className="mt-3 space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs">
                <Globe className="h-3 w-3" />
                {locale === "fa" ? "آدرس سرویس ریموت" : "Remote Service URL"}
              </Label>
              <Input
                type="url"
                value={aiSettings.remoteUrl}
                onChange={(e) => setAiSettings({ ...aiSettings, remoteUrl: e.target.value })}
                placeholder="/api/analyze?XTransformPort=3031"
                className="rounded-xl bg-secondary border-0 font-mono text-xs"
              />
              <p className="text-[10px] text-muted-foreground">
                {locale === "fa"
                  ? "سرویس mini-services/ai-vlm-service را اجرا کنید و این آدرس را وارد کنید"
                  : "Run the mini-services/ai-vlm-service and enter its URL here"}
              </p>
            </div>
          )}

          <Button onClick={saveAi} className="mt-3 w-full rounded-full" size="sm">
            {locale === "fa" ? "ذخیره تنظیمات AI" : "Save AI Settings"}
          </Button>
        </div>

        {/* Subscription / Feature Flags Section */}
        <div className="rounded-2xl bg-card p-4 shadow-ios">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
            <Crown className="h-4 w-4 text-streak" />
            {locale === "fa" ? "طرح اشتراک" : "Subscription Tier"}
          </h3>
          <p className="mb-3 text-xs text-muted-foreground">
            {locale === "fa"
              ? "برای تست، طرح را تغییر دهید. کاربران واقعی با ورود ۷ روز پریمیوم رایگان دریافت می‌کنند."
              : "Switch tier for testing. Real users get 7-day premium trial on login."}
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setTier("free")}
              className={`rounded-xl border-2 p-3 text-center transition-colors ${
                subConfig.tier === "free" ? "border-foreground bg-card" : "border-border bg-card"
              }`}
            >
              <div className="text-2xl">🆓</div>
              <div className="text-sm font-semibold">Free</div>
              <div className="text-[10px] text-muted-foreground">5 scans/day</div>
            </button>
            <button
              onClick={() => setTier("premium")}
              className={`rounded-xl border-2 p-3 text-center transition-colors ${
                subConfig.tier === "premium" ? "border-foreground bg-card" : "border-border bg-card"
              }`}
            >
              <div className="text-2xl">👑</div>
              <div className="text-sm font-semibold">Premium</div>
              <div className="text-[10px] text-muted-foreground">Unlimited</div>
            </button>
          </div>

          {/* Feature flags display */}
          <div className="mt-3 space-y-2 rounded-xl bg-secondary p-3">
            <div className="text-xs font-semibold text-muted-foreground">
              {locale === "fa" ? "امکانات فعلی:" : "Current features:"}
            </div>
            <FeatureRow label={locale === "fa" ? "اسکن نامحدود" : "Unlimited AI scans"} enabled={subConfig.maxAiScansPerDay === -1} />
            <FeatureRow label={locale === "fa" ? "تحلیل پیشرفته" : "Advanced analytics"} enabled={subConfig.advancedAnalytics} />
            <FeatureRow label={locale === "fa" ? "تم‌های سفارشی" : "Custom themes"} enabled={subConfig.customThemes} />
            <FeatureRow label={locale === "fa" ? "برنامه‌ریزی وعده" : "Meal planning"} enabled={subConfig.mealPlanning} />
          </div>
        </div>

        {/* Data Management Section */}
        <div className="rounded-2xl bg-card p-4 shadow-ios">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
            <Database className="h-4 w-4 text-protein" />
            {locale === "fa" ? "مدیریت داده" : "Data Management"}
          </h3>
          <div className="space-y-2">
            <Button onClick={exportDebugInfo} variant="outline" className="w-full rounded-full justify-start">
              <Download className="mr-2 h-4 w-4" />
              {locale === "fa" ? "خروجی اطلاعات دیباگ" : "Export debug info"}
            </Button>
            <Button onClick={clearAllData} variant="destructive" className="w-full rounded-full justify-start">
              <Trash2 className="mr-2 h-4 w-4" />
              {locale === "fa" ? "پاک کردن همه داده‌ها" : "Clear ALL data"}
            </Button>
          </div>
        </div>

        {/* Warning */}
        <div className="rounded-2xl bg-amber-500/10 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              {locale === "fa"
                ? "این تنظیمات برای توسعه‌دهندگان است. تغییر موتور AI یا طرح اشتراک روی تجربه کاربر تاثیر می‌گذارد."
                : "These settings are for developers. Changing the AI engine or subscription tier affects the user experience."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      {enabled ? (
        <Check className="h-3.5 w-3.5 text-success" />
      ) : (
        <X className="h-3.5 w-3.5 text-muted-foreground/40" />
      )}
    </div>
  );
}
