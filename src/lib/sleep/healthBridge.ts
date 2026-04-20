/**
 * Capacitor-aware Health Bridge for Survivor 4.
 *
 * Tries native HealthKit (iOS) / Health Connect (Android) when available.
 * Falls back to a manual parent-logged window when not. Yields a single
 * `SleepBucket` per night (raw minutes never leave the device).
 *
 * Implementation notes:
 *   - The native plugin (`@capacitor-community/health`) is OPTIONAL and not
 *     installed by default. We dynamically import to avoid crashing the web
 *     build, and gracefully fall back when it's missing.
 *   - When the user opts in, we request HKCategoryTypeIdentifier.sleepAnalysis
 *     (iOS) and `Sleep` (Android Health Connect).
 */

import { bucketFromMinutes, type SleepBucket, type SleepSource } from "./sleepSignal";

export interface NightWindow {
  /** Local date at which the sleep window ENDED (YYYY-MM-DD). */
  date: string;
  /** Total time asleep in minutes, excluding wake bouts. */
  minutesAsleep: number;
  awakenings: number;
  source: SleepSource;
}

export interface HealthBridgeResult {
  available: boolean;
  source: SleepSource;
  nights: NightWindow[];
}

interface HealthPluginShape {
  isAvailable?(): Promise<{ available: boolean }>;
  requestAuthorization?(opts: { read: string[] }): Promise<{ granted: boolean }>;
  querySleep?(opts: { startISO: string; endISO: string }): Promise<{
    nights: Array<{ date: string; minutesAsleep: number; awakenings?: number }>;
  }>;
}

async function loadPlugin(): Promise<HealthPluginShape | null> {
  try {
    const mod = (await import(
      /* @vite-ignore */ "@capacitor-community/health" as string
    ).catch(() => null)) as { Health?: HealthPluginShape } | null;
    return mod?.Health ?? null;
  } catch {
    return null;
  }
}

/**
 * Attempt to read the last `days` of sleep nights from the platform.
 * Always returns; `available=false` means the caller should use manual entry.
 */
export async function readRecentSleep(days = 7): Promise<HealthBridgeResult> {
  const plugin = await loadPlugin();
  if (!plugin?.isAvailable || !plugin?.querySleep) {
    return { available: false, source: "manual", nights: [] };
  }
  try {
    const probe = await plugin.isAvailable();
    if (!probe.available) return { available: false, source: "manual", nights: [] };
    const grant = (await plugin.requestAuthorization?.({ read: ["sleep"] })) ?? { granted: true };
    if (!grant.granted) return { available: false, source: "manual", nights: [] };
    const end = new Date();
    const start = new Date(end.getTime() - days * 86_400_000);
    const out = await plugin.querySleep({ startISO: start.toISOString(), endISO: end.toISOString() });
    const isIos = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
    const source: SleepSource = isIos ? "healthkit" : "health-connect";
    return {
      available: true,
      source,
      nights: out.nights.map((n) => ({
        date: n.date,
        minutesAsleep: Math.max(0, Math.round(n.minutesAsleep)),
        awakenings: Math.max(0, n.awakenings ?? 0),
        source,
      })),
    };
  } catch {
    return { available: false, source: "manual", nights: [] };
  }
}

/**
 * Convert a raw NightWindow → bucket. The bucket is what we upload to the
 * cloud; the raw minutes never leave the device.
 */
export function bucketize(night: NightWindow, ageMonths: number): SleepBucket {
  return bucketFromMinutes(night.minutesAsleep, ageMonths, { awakenings: night.awakenings });
}
