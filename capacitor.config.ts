import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor native config.
 *
 * For store releases:
 *  - Bump `versionName` (user-visible, e.g. "1.0.3") in step with package.json.
 *  - Increment `versionCode` (integer) by 1 for every Play Store upload.
 *  - iOS: versionName → CFBundleShortVersionString, versionCode → CFBundleVersion.
 */
const config: CapacitorConfig = {
  appId: "com.neurospark.app",
  appName: "NeuroSpark",
  webDir: "dist",

  // ── Android release versioning ──────────────────────────────────────────────
  android: {
    // versionName is shown in Play Store listings and device Settings > Apps.
    // versionCode must increase with every upload (Play Store rejects identical codes).
    // Keep these in sync with package.json "version" and your release checklist.
    versionName: "1.0.0",
    versionCode: 1,
  },

  server: {
    androidScheme: "https",
    // allowNavigation: [] — add domains only if you open external URLs inside the WebView.
  },

  plugins: {
    // SplashScreen plugin (add @capacitor/splash-screen to use):
    // SplashScreen: { launchShowDuration: 2000, backgroundColor: "#0f0c29" },
  },
};

export default config;
