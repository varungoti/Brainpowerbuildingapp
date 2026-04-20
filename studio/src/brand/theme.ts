/**
 * NeuroSpark brand tokens. Mirrors the consumer app's Tailwind theme so
 * marketing video output matches in-app visual identity.
 */
export const brand = {
  colors: {
    primary: "#7C3AED",
    primaryDark: "#5B21B6",
    accent: "#06B6D4",
    accentWarm: "#F59E0B",
    bg: "#FAFAFB",
    bgDark: "#0B0B14",
    ink: "#0F172A",
    inkSoft: "#475569",
    success: "#10B981",
    warn: "#F97316",
    danger: "#EF4444",
  },
  fonts: {
    display: "Plus Jakarta Sans",
    body: "Inter",
    mono: "JetBrains Mono",
  },
  logoUrl: "/brand/neurospark-logo.svg",
  appStoreBadgeUrl: "/brand/app-store.svg",
  playStoreBadgeUrl: "/brand/play-store.svg",
  qrUrl: "/brand/qr-app-download.svg",
  cta: "Download NeuroSpark — free for the first child",
} as const;

export type Brand = typeof brand;
