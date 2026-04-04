import type { SensoryCondition, SensoryProfile } from "../../app/context/AppContext";

export const SENSORY_CONDITIONS: { id: SensoryCondition; label: string; emoji: string }[] = [
  { id: "adhd", label: "ADHD", emoji: "⚡" },
  { id: "asd", label: "Autism Spectrum", emoji: "🧩" },
  { id: "visual-impairment", label: "Visual Impairment", emoji: "👁️" },
  { id: "hearing-impairment", label: "Hearing Impairment", emoji: "👂" },
  { id: "sensory-processing", label: "Sensory Processing", emoji: "🌊" },
  { id: "fine-motor-delay", label: "Fine Motor Delay", emoji: "✋" },
  { id: "anxiety", label: "Anxiety", emoji: "💙" },
];

export const PROFILE_TYPES: { id: SensoryProfile["type"]; label: string; description: string }[] = [
  { id: "neurotypical", label: "Neurotypical", description: "No specific sensory accommodations needed" },
  { id: "sensory-seeking", label: "Sensory Seeking", description: "Craves extra sensory input" },
  { id: "sensory-avoiding", label: "Sensory Avoiding", description: "Overwhelmed by sensory input" },
  { id: "mixed", label: "Mixed", description: "Both seeking and avoiding in different areas" },
];

export function createDefaultProfile(): SensoryProfile {
  return { type: "neurotypical", conditions: [], modifications: [] };
}
