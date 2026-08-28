"use client";
import { useEffect, useRef, useState } from "react";
import { X, Barcode, Loader2, Camera, Search, Plus, Minus, AlertTriangle } from "lucide-react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { useApp } from "@/lib/store";
import { useLookupBarcode, useLogFood } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { formatNumber } from "@/lib/date-utils";
import { translateFoodName } from "@/lib/food-translations";
import { takeNativePhoto, requestNativeCameraPermission, type NativePermission } from "@/lib/native-bridge";

export function BarcodeScannerSheet() {
  const { setModal } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [scanning, setScanning] = useState(true);
  const [cameraStatus, setCameraStatus] = useState<"loading" | "ok" | "denied" | "error">("loading");
  const lookup = useLookupBarcode();
  const { t } = useI18n();

  // Try zxing first; on failure fall back to native camera (Capacitor) or manual entry.
  useEffect(() => {
    let disposed = false;
    async function startScan() {
      if (!videoRef.current) return;

      // In Capacitor, request native camera permission before trying getUserMedia.
      const perm = await requestNativeCameraPermission();
      if (disposed) return;
      if (perm === "denied") {
        setCameraStatus("denied");
        setScanning(false);
        return;
      }

      const reader = new BrowserMultiFormatReader();
      try {
        const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
          if (result) {
            const code = result.getText();
            setScanning(false);
            controlsRef.current?.stop();
            lookup.mutate(code);
          }
        });
        if (disposed) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
        setCameraStatus("ok");
      } catch (e) {
        console.error("Barcode scanner error:", e);
        setCameraStatus("error");
        setScanning(false);
      }
    }
    void startScan();
    return () => {
      disposed = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, []);

  // Try to decode from a captured photo (used when live camera is unavailable).
  async function captureAndDecode() {
    const reader = new BrowserMultiFormatReader();
    const result = await takeNativePhoto();
    if (result.cancelled || !result.dataUrl) return;
    try {
      // Decode from the image data URL
      const img = new Image();
      img.src = result.dataUrl;
      await new Promise((res) => { img.onload = res; img.onerror = res; });
      const decoded = await reader.decodeFromImageElement(img);
      const code = decoded.getText();
      setScanning(false);
      lookup.mutate(code);
    } catch (e) {
      console.warn("Could not decode barcode from photo:", e);
      toast.error(t("productNotFound"));
    }
  }

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
            {scanning && cameraStatus === "ok" && (
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

        {/* Loading camera */}
        {cameraStatus === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
            <Loader2 className="h-8 w-8 animate-spin text-white/80" />
            <p className="text-xs text-white/70">{t("cameraStarting")}</p>
          </div>
        )}

        {/* Permission denied / camera error fallback */}
        {(cameraStatus === "denied" || cameraStatus === "error") && !lookup.isPending && !foundFood && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 p-6 text-center">
            <AlertTriangle className="h-10 w-10 text-amber-400" />
            <p className="text-sm font-medium text-white">{cameraStatus === "denied" ? t("cameraPermissionDenied") : t("cameraUnavailable")}</p>
            <Button onClick={captureAndDecode} variant="outline" className="rounded-full bg-white text-black">
              <Camera className="mr-2 h-4 w-4" />
              {t("captureBarcode")}
            </Button>
          </div>
        )}

        {!scanning && !lookup.isPending && !foundFood && cameraStatus === "ok" && (
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
  const [selectedSlot, setSelectedSlot] = useState<string>(() => {
    const h = new Date().getHours();
    if (h < 11) return "breakfast";
    if (h < 16) return "lunch";
    if (h < 22) return "dinner";
    return "snack";
  });
  const [mealTime, setMealTime] = useState<string>(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  });
  const macros = {
    calories: Math.round(food.calories * servings),
    protein: Math.round(food.protein * servings * 10) / 10,
    carbs: Math.round(food.carbs * servings * 10) / 10,
    fat: Math.round(food.fat * servings * 10) / 10,
  };

  function confirm() {
    const today = new Date();
    const [hours, minutes] = mealTime.split(":").map(Number);
    today.setHours(hours, minutes, 0, 0);
    logFood.mutate(
      { foodId: food.id, servings, mealSlot: selectedSlot, timestamp: today.toISOString() },
      { onSuccess: () => setModal(null) }
    );
  }

  const slotOptions = [
    { key: "breakfast", emoji: "🌅", label: t("breakfast") },
    { key: "lunch", emoji: "☀️", label: t("lunch") },
    { key: "dinner", emoji: "🌙", label: t("dinner") },
    { key: "snack", emoji: "🍿", label: t("snacks") },
  ];

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

      {/* Meal slot selector */}
      <div className="mt-3">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">{t("mealSlot")}</p>
        <div className="flex gap-1.5">
          {slotOptions.map((slot) => (
            <button
              key={slot.key}
              onClick={() => setSelectedSlot(slot.key)}
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${selectedSlot === slot.key ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"}`}
            >
              <span>{slot.emoji}</span>
              {slot.label}
            </button>
          ))}
        </div>
      </div>

      {/* Time picker */}
      <div className="mt-3">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">{t("time")}</p>
        <input
          type="time"
          value={mealTime}
          onChange={(e) => setMealTime(e.target.value)}
          className="w-full rounded-xl bg-secondary px-3 py-2 text-sm font-medium text-foreground outline-none"
        />
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
        onClick={confirm}
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
