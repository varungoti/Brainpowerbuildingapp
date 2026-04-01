import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

export const TEXT_SCALE_STORAGE_KEY = "neurospark_text_scale";
const NATIVE_PREF_KEY = "text_scale";

export const TEXT_SCALE_PRESETS = [
  { id: "default", label: "Default", value: 1 },
  { id: "large", label: "Larger", value: 1.12 },
  { id: "largest", label: "Largest", value: 1.25 },
] as const;

const MIN = 0.95;
const MAX = 1.35;

function clamp(scale: number): number {
  return Math.min(MAX, Math.max(MIN, scale));
}

/** Apply CSS variable; root font-size in theme.css uses --ns-text-scale. */
export function applyTextScale(scale: number): void {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty("--ns-text-scale", String(clamp(scale)));
}

export function readTextScaleFromLocalStorage(): number {
  if (typeof window === "undefined") return 1;
  const raw = localStorage.getItem(TEXT_SCALE_STORAGE_KEY);
  if (!raw) return 1;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? clamp(n) : 1;
}

/** Call on startup before paint (web + same value after native hydrates). */
export function hydrateTextScaleSync(): void {
  applyTextScale(readTextScaleFromLocalStorage());
}

/** On Capacitor, Preferences may be the source of truth; merge into localStorage. */
export async function hydrateTextScaleFromNativePreferences(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { value } = await Preferences.get({ key: NATIVE_PREF_KEY });
    if (value == null || value === "") return;
    const n = parseFloat(value);
    if (!Number.isFinite(n)) return;
    const clamped = clamp(n);
    localStorage.setItem(TEXT_SCALE_STORAGE_KEY, String(clamped));
    applyTextScale(clamped);
  } catch {
    /* ignore */
  }
}

export async function persistTextScale(scale: number): Promise<void> {
  const clamped = clamp(scale);
  applyTextScale(clamped);
  localStorage.setItem(TEXT_SCALE_STORAGE_KEY, String(clamped));
  if (Capacitor.isNativePlatform()) {
    try {
      await Preferences.set({ key: NATIVE_PREF_KEY, value: String(clamped) });
    } catch {
      /* ignore */
    }
  }
}
