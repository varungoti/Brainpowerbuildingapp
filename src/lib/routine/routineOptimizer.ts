export interface RoutineConfig {
  wakeTime: string;
  napStart?: string;
  napEnd?: string;
  bedTime: string;
  energyPattern: "morning-peak" | "afternoon-peak" | "even" | "unknown";
}

export interface ActivityWindow {
  label: string;
  start: string;
  end: string;
  bestRegions: string[];
  reason: string;
}

const REGION_TIME_MAP: Record<string, string[]> = {
  "morning-peak": ["Logical-Mathematical", "Linguistic", "Executive Function"],
  "mid-morning": ["Creative", "Spatial-Visual", "Digital-Technological"],
  "post-nap": ["Bodily-Kinesthetic", "Coordination", "Musical-Rhythmic"],
  "late-afternoon": ["Interpersonal", "Emotional", "Intrapersonal"],
  "pre-bedtime": ["Naturalist", "Existential", "Pronunciation"],
};

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + mins;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function computeActivityWindows(config: RoutineConfig): ActivityWindow[] {
  const windows: ActivityWindow[] = [];
  const wake = config.wakeTime;
  const bed = config.bedTime;

  const morningStart = addMinutes(wake, 30);
  const morningEnd = addMinutes(wake, 120);
  windows.push({
    label: "Morning Focus",
    start: morningStart,
    end: morningEnd,
    bestRegions: REGION_TIME_MAP["morning-peak"],
    reason: "Cortisol peaks 30-60 min after waking — ideal for logical and language tasks.",
  });

  const midMorningStart = addMinutes(wake, 150);
  const midMorningEnd = addMinutes(wake, 240);
  windows.push({
    label: "Creative Window",
    start: midMorningStart,
    end: midMorningEnd,
    bestRegions: REGION_TIME_MAP["mid-morning"],
    reason: "Mid-morning energy supports creative exploration and spatial reasoning.",
  });

  if (config.napStart && config.napEnd) {
    const postNapStart = addMinutes(config.napEnd, 15);
    const postNapEnd = addMinutes(config.napEnd, 90);
    windows.push({
      label: "Post-Nap Energy",
      start: postNapStart,
      end: postNapEnd,
      bestRegions: REGION_TIME_MAP["post-nap"],
      reason: "Post-nap alertness is perfect for physical and musical activities.",
    });
  }

  const lateAfternoonEnd = timeToMinutes(bed) - 120;
  const lateAfternoonStart = lateAfternoonEnd - 90;
  if (lateAfternoonStart > 0) {
    windows.push({
      label: "Social & Emotional",
      start: addMinutes("00:00", lateAfternoonStart),
      end: addMinutes("00:00", lateAfternoonEnd),
      bestRegions: REGION_TIME_MAP["late-afternoon"],
      reason: "Late afternoon favors social connection and emotional processing.",
    });
  }

  const preBedStart = addMinutes(bed, -60);
  windows.push({
    label: "Wind-Down",
    start: preBedStart,
    end: addMinutes(bed, -15),
    bestRegions: REGION_TIME_MAP["pre-bedtime"],
    reason: "Calming activities support melatonin onset and restful sleep.",
  });

  return windows;
}

export function getBestRegionsForNow(config: RoutineConfig): string[] {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const windows = computeActivityWindows(config);

  for (const w of windows) {
    const start = timeToMinutes(w.start);
    const end = timeToMinutes(w.end);
    if (currentMinutes >= start && currentMinutes <= end) {
      return w.bestRegions;
    }
  }

  return [];
}

export const DEFAULT_ROUTINE: RoutineConfig = {
  wakeTime: "07:00",
  napStart: "13:00",
  napEnd: "14:30",
  bedTime: "20:00",
  energyPattern: "unknown",
};
