import type { Activity } from "../../app/data/activities";

export interface PrintableGuideIllustration {
  prompt: string;
  alt: string;
  fallbackIcon: string;
  url?: string;
  provider?: string;
  model?: string;
}

export interface PrintableGuideActivity {
  activityId: string;
  title: string;
  duration: number;
  region: string;
  intelligences: string[];
  materials: string[];
  whyThisMatters: string;
  steps: string[];
  sayThis: string[];
  watchFor: string[];
  adaptIfTooEasy: string;
  adaptIfTooHard: string;
  safetyNote: string;
  reflectionPrompt: string;
  illustration: PrintableGuideIllustration;
}

export interface PrintableGuideRoutine {
  warmUp: string;
  mainPlay: string;
  calmClose: string;
  parentReflection: string;
}

export interface PrintableGuide {
  id: string;
  title: string;
  subtitle: string;
  childName: string;
  childAge?: number;
  ageTier: number;
  totalMinutes: number;
  materials: string[];
  prepChecklist: string[];
  activities: PrintableGuideActivity[];
  routine: PrintableGuideRoutine;
  footer: string;
  generatedAt: string;
  provider?: string;
  model?: string;
  packHash: string;
}

export interface PrintableGuideRequest {
  childName: string;
  childAge?: number;
  ageTier: number;
  mood?: string;
  activities: Activity[];
  includeImages?: boolean;
  forceRefresh?: boolean;
}
