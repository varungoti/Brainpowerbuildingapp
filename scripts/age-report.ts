import { ACTIVITIES, runAGE, type AGEPersonalization } from "../src/app/data/activities";
import type { OutcomePillar } from "../src/app/data/outcomeChecklist";

const ALL_MATERIALS = [
  "paper",
  "pencils",
  "cups",
  "bowls",
  "spoons",
  "pots",
  "rice",
  "beans",
  "buttons",
  "stones",
  "eggtray",
  "muffin",
  "blanket",
  "tape",
  "ruler",
  "water",
  "outdoor",
  "torch",
  "leaves",
  "bottlecap",
];

const moods = ["focus", "calm", "high", "low"] as const;

const profiles: AGEPersonalization[] = [
  { learningStyle: "visual", curiosity: 8, energy: 6, patience: 5, creativity: 8, social: 4, energyLevel: 6, adaptability: 7, mood: 6, sensitivity: 4 },
  { learningStyle: "auditory", curiosity: 5, energy: 4, patience: 7, creativity: 4, social: 8, energyLevel: 4, adaptability: 5, mood: 5, sensitivity: 6 },
  { learningStyle: "kinesthetic", curiosity: 7, energy: 9, patience: 3, creativity: 6, social: 6, energyLevel: 9, adaptability: 7, mood: 7, sensitivity: 3 },
];

const focusPillarSets: OutcomePillar[][] = [[], ["Executive"], ["Emotional"], ["Cognitive"], ["Motor-Social"], ["Language-Logic"]];

function mean(values: number[]): number {
  return values.length ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10 : 0;
}

for (const tier of [1, 2, 3, 4, 5]) {
  const intelligenceCoverage: number[] = [];
  const durations: number[] = [];
  const packSizes: number[] = [];
  let packsWithFocusHit = 0;
  let aiLiteracyPacks = 0;

  for (const mood of moods) {
    for (const profile of profiles) {
      for (const focusPillars of focusPillarSets) {
        const pack = runAGE(tier, ALL_MATERIALS, mood, 60, [], profile, null, {
          boostAILiteracy: tier >= 4,
          boostDualTask: true,
          focusPillars,
        });

        const coveredIntelligences = new Set(pack.flatMap((activity) => activity.intelligences));
        const totalDuration = pack.reduce((sum, activity) => sum + activity.duration, 0);
        intelligenceCoverage.push(coveredIntelligences.size);
        durations.push(totalDuration);
        packSizes.push(pack.length);
        if (focusPillars.length === 0 || pack.some((activity) => activity.goalPillars?.some((pillar) => focusPillars.includes(pillar)))) {
          packsWithFocusHit += 1;
        }
        if (pack.some((activity) => activity.skillTags?.includes("ai-literacy"))) {
          aiLiteracyPacks += 1;
        }
      }
    }
  }

  const tierActivities = ACTIVITIES.filter((activity) => activity.ageTiers.includes(tier));
  console.log(`Tier ${tier}`);
  console.log(`  catalog activities: ${tierActivities.length}`);
  console.log(`  avg pack size: ${mean(packSizes)}`);
  console.log(`  avg unique intelligences per pack: ${mean(intelligenceCoverage)}`);
  console.log(`  avg total duration: ${mean(durations)} min`);
  console.log(`  focus-pillar hit rate: ${packsWithFocusHit}/${moods.length * profiles.length * focusPillarSets.length}`);
  console.log(`  ai-literacy pack count: ${aiLiteracyPacks}`);
}
