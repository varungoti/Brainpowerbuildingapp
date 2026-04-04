import type { SensoryProfile } from "../../app/context/AppContext";
import type { Activity } from "../../app/data/activities";

export interface SensoryAdaptation {
  adaptedInstructions: string[];
  adaptedMaterials: string[];
  warnings: string[];
  badges: string[];
}

const CONDITION_MATERIAL_SWAPS: Record<string, Record<string, string>> = {
  "visual-impairment": {
    "paper": "textured paper",
    "pencils": "thick markers or wax crayons",
    "cups": "large tactile cups",
  },
  "fine-motor-delay": {
    "pencils": "chunky crayons or finger paint",
    "scissors": "pre-cut shapes",
    "beads": "large beads (2cm+)",
  },
  "sensory-processing": {
    "slime": "dry sand or kinetic sand",
    "glitter": "soft fabric swatches",
  },
};

const CONDITION_INSTRUCTION_PREFIXES: Record<string, string> = {
  adhd: "Break into 2-minute micro-tasks. Use a visual timer.",
  asd: "Preview each step verbally before starting. Keep environment predictable.",
  "visual-impairment": "Use tactile and auditory cues for each step.",
  "hearing-impairment": "Use visual demonstrations and gestures for each step.",
  "sensory-processing": "Start with low-stimulation version. Gradually increase.",
  "fine-motor-delay": "Use hand-over-hand guidance where needed. Allow extra time.",
  anxiety: "Offer choices at each step. Reassure that there's no wrong way.",
};

export function adaptActivity(activity: Activity, profile: SensoryProfile): SensoryAdaptation {
  if (profile.type === "neurotypical" && profile.conditions.length === 0) {
    return {
      adaptedInstructions: activity.instructions,
      adaptedMaterials: activity.materials,
      warnings: [],
      badges: [],
    };
  }

  if (activity.sensoryModifications) {
    for (const cond of profile.conditions) {
      const mod = activity.sensoryModifications[cond];
      if (mod) {
        return {
          adaptedInstructions: mod.instructions,
          adaptedMaterials: mod.materials,
          warnings: [],
          badges: [`Adapted for ${cond}`],
        };
      }
    }
  }

  let adaptedMaterials = [...activity.materials];
  const warnings: string[] = [];
  const badges: string[] = [];
  const instructionPrefixes: string[] = [];

  for (const cond of profile.conditions) {
    const swaps = CONDITION_MATERIAL_SWAPS[cond];
    if (swaps) {
      adaptedMaterials = adaptedMaterials.map(m => {
        const lower = m.toLowerCase();
        for (const [from, to] of Object.entries(swaps)) {
          if (lower.includes(from)) return to;
        }
        return m;
      });
    }

    const prefix = CONDITION_INSTRUCTION_PREFIXES[cond];
    if (prefix) instructionPrefixes.push(prefix);
    badges.push(`${cond}-adapted`);
  }

  if (activity.contraindications) {
    for (const ci of activity.contraindications) {
      if (profile.conditions.some(c => ci.toLowerCase().includes(c))) {
        warnings.push(`Caution: ${ci}`);
      }
    }
  }

  if (profile.type === "sensory-avoiding" && (activity.difficulty ?? 0) >= 4) {
    warnings.push("High difficulty may be overwhelming for sensory-avoiding profiles");
  }

  const adaptedInstructions = [
    ...instructionPrefixes,
    ...activity.instructions,
  ];

  return { adaptedInstructions, adaptedMaterials, warnings, badges };
}
