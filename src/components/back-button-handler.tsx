"use client";
// Registers a hardware back-button listener (Capacitor App plugin) so the Android
// hardware back button navigates up the app's hierarchy instead of immediately exiting.
// Pattern:
//   1. If a modal is open → close the modal (no exit).
//   2. Else if not on the Home tab → switch to the Home tab (no exit).
//   3. Else (on Home tab, no modal):
//      - First press → show a toast "Press back again to exit" and start a 2.5s timer.
//      - Second press within the timer → exit the app.
//      - After the timer expires, the next press is treated as a "first press" again.

import { useEffect, useRef } from "react";
import { registerBackButtonHandler } from "@/lib/native-bridge";
import { useApp } from "@/lib/store";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

const EXIT_PRESS_WINDOW_MS = 2500;

export function BackButtonHandler() {
  const { modal, setModal, setEditingLog, setTab } = useApp();
  const { t } = useI18n();
  const lastPressRef = useRef<number>(0);

  useEffect(() => {
    const cleanup = registerBackButtonHandler(() => {
      const st = useApp.getState();
      // 1. Close open modal
      if (st.modal) {
        st.setModal(null);
        st.setEditingLog(null);
        return true;
      }
      // 2. Navigate from non-home tab back to home
      if (st.tab !== "home") {
        st.setTab("home");
        return true;
      }
      // 3. On the home tab — double-press-to-exit pattern
      const now = Date.now();
      if (now - lastPressRef.current < EXIT_PRESS_WINDOW_MS) {
        // Second press within the window → exit
        lastPressRef.current = 0;
        return false; // let Capacitor's default exitApp() run
      }
      // First press → show toast, start the window
      lastPressRef.current = now;
      toast(t("pressBackAgainToExit"), { duration: EXIT_PRESS_WINDOW_MS });
      return true; // we handled it — do NOT exit
    });
    return cleanup;
  }, [t]);

  // Touch state so the effect closure is regenerated if the component re-renders.
  void modal;
  void setModal;
  void setEditingLog;
  void setTab;

  return null;
}
