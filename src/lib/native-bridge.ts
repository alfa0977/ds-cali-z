"use client";
// Capacitor native bridge helpers — safe to import on web (graceful no-ops when not in Capacitor).
// The Capacitor plugin packages (@capacitor/camera, @capacitor/app, @capacitor/local-notifications)
// are only installed during the APK build (see build-apk.sh). In the browser sandbox they are absent,
// so we use a runtime dynamic import via a computed module path so the bundler does NOT try to
// resolve them at build time.

import { isStaticMode } from "@/lib/env";

/**
 * Returns true if we're running inside a Capacitor native app (Android/iOS).
 * This is a synchronous check that looks for the `window.Capacitor` global,
 * which Capacitor injects before the WebView's JavaScript runs.
 */
export function isNativePlatform(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean; platform?: string } };
  if (w.Capacitor && typeof w.Capacitor.isNativePlatform === "function") {
    return w.Capacitor.isNativePlatform();
  }
  // Fallback: isStaticMode() checks protocol + window.Capacitor
  return isStaticMode();
}

export type NativeCameraResult = {
  dataUrl: string | null;
  cancelled: boolean;
};

/**
 * Runtime dynamic import that the bundler cannot statically resolve.
 * Returns null if the module is unavailable (web sandbox) or fails to load.
 */
async function tryImport(moduleName: string): Promise<Record<string, unknown> | null> {
  try {
    // Wrap in a Function so webpack/turbopack doesn't try to resolve at build time.
    const dynamicImport = new Function("m", "return import(m)") as (m: string) => Promise<Record<string, unknown>>;
    return await dynamicImport(moduleName);
  } catch (e) {
    console.debug(`[native-bridge] module '${moduleName}' not available:`, e);
    return null;
  }
}

/**
 * Take a photo using the native Capacitor Camera plugin (if available).
 * Falls back to a hidden <input type="file" capture> on the web.
 * Returns a data URL (base64) of the captured image, or null if cancelled.
 */
export async function takeNativePhoto(): Promise<NativeCameraResult> {
  if (isStaticMode()) {
    const mod = await tryImport("@capacitor/camera");
    if (mod) {
      try {
        const Camera = mod.Camera as {
          getPhoto: (opts: Record<string, unknown>) => Promise<{ dataUrl?: string }>;
        };
        const { CameraResultType, CameraSource } = mod as {
          CameraResultType: { DataUrl: string };
          CameraSource: { Camera: string; Photos: string };
        };
        const photo = await Camera.getPhoto({
          quality: 80,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
          saveToGallery: false,
          correctOrientation: true,
        });
        return { dataUrl: photo.dataUrl ?? null, cancelled: false };
      } catch (e) {
        console.warn("Native camera failed, falling back to input:", e);
        return { dataUrl: null, cancelled: true };
      }
    }
  }
  // Web fallback (also used when Capacitor module is unavailable)
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.style.position = "fixed";
    input.style.opacity = "0";
    input.style.pointerEvents = "none";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        document.body.removeChild(input);
        resolve({ dataUrl: null, cancelled: true });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        document.body.removeChild(input);
        resolve({ dataUrl: reader.result as string, cancelled: false });
      };
      reader.onerror = () => {
        document.body.removeChild(input);
        resolve({ dataUrl: null, cancelled: true });
      };
      reader.readAsDataURL(file);
    };
    document.body.appendChild(input);
    input.click();
  });
}

/**
 * Pick an image from the gallery using the native Capacitor Camera plugin (if available).
 */
export async function pickNativeImage(): Promise<NativeCameraResult> {
  if (isStaticMode()) {
    const mod = await tryImport("@capacitor/camera");
    if (mod) {
      try {
        const Camera = mod.Camera as {
          getPhoto: (opts: Record<string, unknown>) => Promise<{ dataUrl?: string }>;
        };
        const { CameraResultType, CameraSource } = mod as {
          CameraResultType: { DataUrl: string };
          CameraSource: { Camera: string; Photos: string };
        };
        const photo = await Camera.getPhoto({
          quality: 80,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Photos,
          correctOrientation: true,
        });
        return { dataUrl: photo.dataUrl ?? null, cancelled: false };
      } catch (e) {
        console.warn("Native image picker failed, falling back to input:", e);
        return { dataUrl: null, cancelled: true };
      }
    }
  }
  // Web fallback
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.style.position = "fixed";
    input.style.opacity = "0";
    input.style.pointerEvents = "none";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        document.body.removeChild(input);
        resolve({ dataUrl: null, cancelled: true });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        document.body.removeChild(input);
        resolve({ dataUrl: reader.result as string, cancelled: false });
      };
      reader.onerror = () => {
        document.body.removeChild(input);
        resolve({ dataUrl: null, cancelled: true });
      };
      reader.readAsDataURL(file);
    };
    document.body.appendChild(input);
    input.click();
  });
}

export type NativePermission = "granted" | "denied" | "prompt";

/**
 * Request camera permission using Capacitor (if available).
 * On web, returns "granted" (the browser will prompt at capture time).
 */
export async function requestNativeCameraPermission(): Promise<NativePermission> {
  if (!isStaticMode()) return "granted";
  const mod = await tryImport("@capacitor/camera");
  if (!mod) return "granted"; // fall through to web getUserMedia
  try {
    const Camera = mod.Camera as {
      requestPermissions: (opts: { permissions: string[] }) => Promise<{ camera: string }>;
    };
    const status = await Camera.requestPermissions({ permissions: ["camera"] });
    if (status.camera === "granted") return "granted";
    if (status.camera === "denied") return "denied";
    return "prompt";
  } catch (e) {
    console.warn("Camera permission request failed:", e);
    return "denied";
  }
}

export async function requestNativeNotificationPermission(): Promise<NativePermission> {
  if (isStaticMode()) {
    const mod = await tryImport("@capacitor/local-notifications");
    if (mod) {
      try {
        const LocalNotifications = mod.LocalNotifications as {
          requestPermissions: () => Promise<{ display: string }>;
          checkPermissions: () => Promise<{ display: string }>;
          schedule: (opts: { notifications: Array<Record<string, unknown>> }) => Promise<unknown>;
        };
        const res = await LocalNotifications.requestPermissions();
        if (res.display === "granted") return "granted";
        if (res.display === "denied") return "denied";
        return "prompt";
      } catch (e) {
        console.warn("Local-notifications permission failed:", e);
        return "denied";
      }
    }
  }
  // Web: use the standard Notification API
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  const result = await Notification.requestPermission();
  return result === "granted" ? "granted" : result === "denied" ? "denied" : "prompt";
}

export async function getNativeNotificationPermission(): Promise<NativePermission> {
  if (isStaticMode()) {
    const mod = await tryImport("@capacitor/local-notifications");
    if (mod) {
      try {
        const LocalNotifications = mod.LocalNotifications as {
          checkPermissions: () => Promise<{ display: string }>;
        };
        const res = await LocalNotifications.checkPermissions();
        if (res.display === "granted") return "granted";
        if (res.display === "denied") return "denied";
        return "prompt";
      } catch (e) {
        console.warn("Local-notifications check failed:", e);
        return "denied";
      }
    }
  }
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  return (Notification.permission as NativePermission) ?? "prompt";
}

export async function showNativeNotification(title: string, body?: string): Promise<void> {
  if (isStaticMode()) {
    const mod = await tryImport("@capacitor/local-notifications");
    if (mod) {
      try {
        const LocalNotifications = mod.LocalNotifications as {
          schedule: (opts: { notifications: Array<Record<string, unknown>> }) => Promise<unknown>;
        };
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Math.floor(Math.random() * 1_000_000),
              title,
              body: body ?? "",
              smallIcon: "ic_stat_icon",
              iconColor: "#FF9500",
            },
          ],
        });
        return;
      } catch (e) {
        console.warn("Local-notifications schedule failed, falling back to web Notification:", e);
        // fall through to web implementation
      }
    }
  }
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body,
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%A5%97%3C/text%3E%3C/svg%3E",
    });
  } catch (e) {
    console.error("Notification error:", e);
  }
}

/**
 * Register a hardware back-button listener (Capacitor App plugin).
 * Returns a cleanup function. The callback receives true if it handled the event
 * (preventing the default app-exit behavior).
 *
 * IMPORTANT: We do NOT gate on isStaticMode() here — we always try to import
 * @capacitor/app. If the import fails (web browser), we do nothing. If it
 * succeeds (APK), we register the listener. This is more robust than checking
 * isStaticMode() because window.Capacitor might not be available yet when the
 * React effect first runs (timing depends on WebView injection).
 */
export function registerBackButtonHandler(cb: () => boolean | void): () => void {
  let disposed = false;
  let removeListener: (() => void) | null = null;
  void (async () => {
    const mod = await tryImport("@capacitor/app");
    if (!mod || disposed) return;
    try {
      const App = mod.App as {
        addListener: (event: string, cb: () => void) => Promise<{ remove: () => void }>;
        exitApp: () => void;
      };
      const handle = await App.addListener("backButton", () => {
        const handled = cb();
        if (!handled) {
          App.exitApp();
        }
      });
      removeListener = () => {
        try { handle.remove(); } catch {}
      };
      if (disposed && removeListener) removeListener();
    } catch (e) {
      console.warn("Capacitor App backButton listener failed:", e);
    }
  })();
  return () => {
    disposed = true;
    if (removeListener) removeListener();
  };
}
