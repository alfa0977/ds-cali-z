// Detects if the app is running inside a Capacitor APK (static export)
// vs a Next.js server. In static mode, we use client-db (IndexedDB) instead of API routes.
export function isStaticMode(): boolean {
  if (typeof window === "undefined") return false;
  // Check if we're in a Capacitor WebView
  if (window.location.protocol === "capacitor:" || window.location.protocol === "file:") return true;
  // Check if API routes are available (try a quick sync check)
  // In static export, there's no /api/ route
  return false;
}
