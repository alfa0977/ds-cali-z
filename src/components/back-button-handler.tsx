"use client";
// Registers a hardware back-button listener (Capacitor App plugin) so the Android
// hardware back button closes the active modal instead of exiting the app.
// On web, it does nothing (browser Back already navigates history).

import { useEffect } from "react";
import { registerBackButtonHandler } from "@/lib/native-bridge";
import { useApp } from "@/lib/store";

export function BackButtonHandler() {
  const { modal, setModal, setEditingLog, setTab } = useApp();

  useEffect(() => {
    const cleanup = registerBackButtonHandler(() => {
      // Snapshot the latest modal/tab via closure on this effect's render.
      // The registerBackButtonHandler is set up once per mount of this component,
      // so we read the current state from the store at event time.
      const st = useApp.getState();
      if (st.modal) {
        st.setModal(null);
        st.setEditingLog(null);
        return true;
      }
      if (st.tab !== "home") {
        st.setTab("home");
        return true;
      }
      // On the Home tab with no modal open, let the default (exit) happen.
      return false;
    });
    return cleanup;
    // We deliberately only re-register on mount. The handler reads fresh state
    // via useApp.getState() so we don't need modal/tab in the deps array.
  }, []);

  // Touch modal/tab so the effect closure is regenerated if the component re-renders
  // (kept for completeness; the handler reads live state via getState()).
  void modal;
  void setModal;
  void setEditingLog;
  void setTab;

  return null;
}
