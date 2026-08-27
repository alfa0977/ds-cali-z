import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.dscali",
  appName: "DS-Cali",
  webDir: "out",
  server: {
    // For static APK mode: the web files are bundled locally.
    androidScheme: "https",
  },
  android: {
    allowMixedContent: true,
    // Required so the WebView keeps localStorage/IndexedDB across launches
    // and requests camera/mic permissions for getUserMedia().
    webContentsDebuggingEnabled: true,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon",
      iconColor: "#FF9500",
      sound: "default",
    },
    Camera: {
      // Use the native camera permission dialog
      permissions: ["camera"],
    },
  },
};

export default config;
