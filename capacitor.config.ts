import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.dscali",
  appName: "DS-Cali",
  webDir: "out",
  server: {
    // For static APK mode: the web files are bundled locally
    // No external server URL needed
    androidScheme: "https",
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
