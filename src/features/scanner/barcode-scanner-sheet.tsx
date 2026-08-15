"use client";
import { useEffect, useRef, useState } from "react";
import { X, Barcode, Loader2, Camera, Search, Plus, Minus } from "lucide-react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { useApp } from "@/lib/store";
import { useLookupBarcode, useLogFood } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { formatNumber } from "@/lib/date-utils";
import { translateFoodName } from "@/lib/food-translations";

export function BarcodeScannerSheet() {
  const { setModal } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [scanning, setScanning] = useState(true);
  const lookup = useLookupBarcode();
  const { t } = useI18n();

  useEffect(() => {
    if (!scanning || !videoRef.current) return;
    const reader = new BrowserMultiFormatReader();
    reader
      .decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
        if (result) {
          const code = result.getText();
          setScanning(false);
          controlsRef.current?.stop();
          lookup.mutate(code);
        }
      })
      .then((controls) => {
        controlsRef.current = controls;
      })
      .catch((e) => {
        console.error("Barcode scanner error:", e);
        toast.error(t("cameraUnavailable"));
        setScanning(false);
      });
    return () => {
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [scanning, t]);

  function submitManual() {
    if (!manualCode.trim()) return;
    setScanning(false);
    controlsRef.current?.stop();
    lookup.mutate(manualCode.trim());
  }

  const foundFood = lookup.data?.food;

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={() => setModal(null)} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-base font-semibold">{t("barcodeScanner")}</h2>
        <div className="h-9 w-9" />
      </div>

      {/* camera view */}
      <div className="relative mx-4 aspect-[3/4] overflow-hidden rounded-3xl bg-black sm:aspect-video">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
        {/* framing overlay */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-1/3 w-4/5 -translate-x-1/2 -translate-y-1/2">
            <div className="absolute left-0 top-0 h-8 w-8 rounded-tl-2xl border-l-4 border-t-4 border-white/80" />
            <div className="absolute right-0 top-0 h-8 w-8 rounded-tr-2xl border-r-4 border-t-4 border-white/80" />
            <div className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-2xl border-b-4 border-l-4 border-white/80" />
            <div className="absolute bottom-0 right-0 h-8 w-8 rounded-br-2xl border-b-4 border-r-4 border-white/80" />
            {/* scan line */}
            {scanning && (
              <div className="absolute left-2 right-2 h-0.5 bg-water shadow-[0_0_8px_var(--water)] animate-scan-line" />
            )}
          </div>
        </div>
        {lookup.isPending && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 backdrop-blur-sm">
            <Loader2 className="h-10 w-10 animate-spin text-white" />
            <p className="text-sm font-medium text-white">{t("lookingUpProduct")}</p>
          </div>
        )}
        {!scanning && !lookup.isPending && !foundFood && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
            <Camera className="h-10 w-10 text-white/70" />
            <button
              onClick={() => setScanning(true)}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black"
            >
              {t("resumeScanning")}
            </button>
          </div>
        )}
      </div>

      {/* manual entry */}
      <div className="px-4 py-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">{t("orEnterBarcodeManually")}</p>
        <div className="flex gap-2">
          <Input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="e.g. 5901234123457"
            inputMode="numeric"
            className="rounded-xl bg-secondary border-0"
            onKeyDown={(e) => e.key === "Enter" && submitManual()}
          />
          <Button onClick={submitManual} size="icon" className="rounded-xl">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* result */}
      {foundFood && <BarcodeResult food={foundFood} />}
    </div>
  );
}

function BarcodeResult({
  food,
}: {
  food: {
    id: string;
    name: string;
    servingSize: string;
    servingWeightGrams: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    emoji: string | null;
  };
}) {
  const { setModal } = useApp();
  const logFood = useLogFood();
  const { locale, t } = useI18n();
  const [servings, setServings] = useState(1);
  const macros = {
    calories: Math.round(food.calories * servings),
    protein: Math.round(food.protein * servings * 10) / 10,
    carbs: Math.round(food.carbs * servings * 10) / 10,
    fat: Math.round(food.fat * servings * 10) / 10,
  };

  return (
    <div className="flex-1 overflow-y-auto border-t border-border px-4 py-4">
      <div className="mb-3 flex items-center gap-1.5 text-xs font-medium text-success">
        <Barcode className="h-4 w-4" />
        {t("productFound")}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-3xl">
          {food.emoji ?? "📦"}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold leading-tight">{translateFoodName(food.name, locale)}</h3>
          <p className="text-xs text-muted-foreground">{food.servingSize}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">{t("servings")}</span>
        <div className="flex items-center gap-3 rounded-full border border-border px-1 py-1">
          <button onClick={() => setServings((s) => Math.max(0.5, Math.round((s - 0.5) * 10) / 10))} className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary font-bold">−</button>
          <span className="min-w-6 text-center text-sm font-semibold tabular-nums">{formatNumber(servings, locale)}</span>
          <button onClick={() => setServings((s) => Math.round((s + 0.5) * 10) / 10)} className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background font-bold">+</button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <NutBox label={t("calories")} value={macros.calories} icon="🔥" color="text-streak" />
        <NutBox label={t("carbs")} value={macros.carbs} unit="g" icon="🌾" color="text-carbs" />
        <NutBox label={t("protein")} value={macros.protein} unit="g" icon="🍗" color="text-protein" />
        <NutBox label={t("fats")} value={macros.fat} unit="g" icon="💧" color="text-fats" />
      </div>

      <Button
        className="mt-4 w-full rounded-full py-3"
        size="lg"
        disabled={logFood.isPending}
        onClick={() =>
          logFood.mutate(
            { foodId: food.id, servings },
            { onSuccess: () => setModal(null) }
          )
        }
      >
        {logFood.isPending ? t("saving") : t("logThisFood")}
      </Button>
    </div>
  );
}

function NutBox({ label, value, unit, icon, color }: { label: string; value: number; unit?: string; icon: string; color: string }) {
  const { locale } = useI18n();
  return (
    <div className="rounded-2xl bg-secondary p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>{icon}</span>
        {label}
      </div>
      <div className={`mt-0.5 text-xl font-bold tabular-nums ${color}`}>
        {formatNumber(value, locale)}
        {unit && <span className="text-xs font-medium text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}
