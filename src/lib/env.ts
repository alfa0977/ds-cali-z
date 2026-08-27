// Detects if the app is running inside a Capacitor APK (static export)
// vs a Next.js server. In static mode, we use client-db (IndexedDB) instead of API routes.

// Cached result so we don't repeatedly check globals.
let cachedStatic: boolean | null = null;

export function isStaticMode(): boolean {
  if (typeof window === "undefined") return false;
  if (cachedStatic !== null) return cachedStatic;

  // 1) Capacitor injects a global `Capacitor` object when running inside its WebView.
  //    This is the most reliable signal — works regardless of androidScheme (https/file/capacitor).
  const w = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean; platform?: string } };
  if (w.Capacitor && typeof w.Capacitor.isNativePlatform === "function") {
    cachedStatic = w.Capacitor.isNativePlatform();
    return cachedStatic;
  }
  if (w.Capacitor) {
    cachedStatic = true;
    return cachedStatic;
  }

  // 2) Fallback: protocol-based detection (file: or capacitor:).
  if (window.location.protocol === "capacitor:" || window.location.protocol === "file:") {
    cachedStatic = true;
    return cachedStatic;
  }

  // 3) Heuristic: when running on https://localhost with no real hostname AND no /api route
  //    was ever reachable, treat as static. This catches the `androidScheme: "https"` case
  //    where the WebView origin is `https://localhost`.
  //    We avoid doing a fetch here (would be async); instead we rely on the Capacitor global above.
  cachedStatic = false;
  return cachedStatic;
}

/** Reset the cached static-mode result (useful for tests / hot reloads). */
export function resetStaticModeCache(): void {
  cachedStatic = null;
}
