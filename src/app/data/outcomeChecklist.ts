export type OutcomePillar = "Executive" | "Emotional" | "Cognitive" | "Motor-Social" | "Language-Logic";

// Parent-reported developmental proxies (not clinical). Higher = parent sees more of this lately.

export interface OutcomeQuestion {
  id: string;
  label: string;
  hint: string;
  pillar: OutcomePillar;
}

export const OUTCOME_QUESTIONS: OutcomeQuestion[] = [
  {
    id: "attention_focus",
    label: "Focus & follow-through",
    hint: "They stick with a playful task until it’s done (with normal breaks for their age).",
    pillar: "Executive",
  },
  {
    id: "persistence",
    label: "Trying again when it’s hard",
    hint: "They attempt a challenge again instead of quitting right away.",
    pillar: "Executive",
  },
  {
    id: "emotional_regulation",
    label: "Bouncing back from upsets",
    hint: "They calm down within a reasonable time after frustration or disappointment.",
    pillar: "Emotional",
  },
  {
    id: "curiosity",
    label: "Curiosity & exploration",
    hint: "They ask questions, try new things, or explore without always being prompted.",
    pillar: "Cognitive",
  },
  {
    id: "coordination",
    label: "Movement & coordination",
    hint: "Balance, climbing, drawing, or fine-motor tasks seem on track for their age.",
    pillar: "Motor-Social",
  },
  {
    id: "social_coop",
    label: "Turn-taking & cooperation",
    hint: "They can share, wait a turn, or play simple cooperative games.",
    pillar: "Motor-Social",
  },
  {
    id: "language_expression",
    label: "Expressing ideas",
    hint: "They get their point across in words (or gestures) day to day.",
    pillar: "Language-Logic",
  },
  {
    id: "patterns_logic",
    label: "Patterns & early logic",
    hint: "They notice patterns, enjoy counting/sorting, or simple “why” thinking.",
    pillar: "Language-Logic",
  },
];

export interface OutcomeChecklistMonth {
  monthKey: string; // YYYY-MM
  answers: Record<string, number>; // question id -> 1–5
  submittedAt: string;
  /** Mean of all question scores (1–5) */
  compositeScore: number;
}

export function currentMonthKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function computeComposite(answers: Record<string, number>): number {
  let sum = 0;
  let n = 0;
  for (const q of OUTCOME_QUESTIONS) {
    const v = answers[q.id];
    if (typeof v === "number" && v >= 1 && v <= 5) {
      sum += v;
      n += 1;
    }
  }
  if (n === 0) return 0;
  return Math.round((sum / n) * 10) / 10;
}

export function defaultAnswers(): Record<string, number> {
  const a: Record<string, number> = {};
  for (const q of OUTCOME_QUESTIONS) a[q.id] = 3;
  return a;
}

export function getOutcomePillarAverages(months: OutcomeChecklistMonth[]): Partial<Record<OutcomePillar, number>> {
  const latest = months.length > 0 ? months[months.length - 1] : undefined;
  if (!latest) return {};

  const sums = new Map<OutcomePillar, { total: number; count: number }>();
  for (const q of OUTCOME_QUESTIONS) {
    const value = latest.answers[q.id];
    if (typeof value !== "number") continue;
    const prev = sums.get(q.pillar) ?? { total: 0, count: 0 };
    sums.set(q.pillar, { total: prev.total + value, count: prev.count + 1 });
  }

  const result: Partial<Record<OutcomePillar, number>> = {};
  for (const [pillar, { total, count }] of sums.entries()) {
    result[pillar] = count > 0 ? Math.round((total / count) * 10) / 10 : 0;
  }
  return result;
}

export function getOutcomeFocusPillars(
  months: OutcomeChecklistMonth[],
  threshold = 3.3,
): OutcomePillar[] {
  const averages = getOutcomePillarAverages(months);
  return (Object.entries(averages) as Array<[OutcomePillar, number]>)
    .filter(([, value]) => value > 0 && value <= threshold)
    .sort((a, b) => a[1] - b[1])
    .map(([pillar]) => pillar);
}
