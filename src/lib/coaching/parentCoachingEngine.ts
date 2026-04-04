import type { Activity } from "../../app/data/activities";

export interface CoachingGuidance {
  keyInteractions: string[];
  deepeningTips: string[];
  observeFor: string[];
  timerSuggestionMinutes: number;
}

const REGION_COACHING: Record<string, { interactions: string[]; deepening: string[] }> = {
  Frontal: {
    interactions: [
      "Ask open-ended 'what if' questions during the activity",
      "Let the child plan the order of steps",
      "Pause and ask 'What do you think will happen next?'",
    ],
    deepening: [
      "Introduce a constraint to encourage problem-solving",
      "Ask the child to explain their thinking process",
    ],
  },
  Temporal: {
    interactions: [
      "Name objects and actions as they happen",
      "Ask the child to narrate what they're doing",
      "Introduce new vocabulary words related to the activity",
    ],
    deepening: [
      "Tell a short story incorporating the activity theme",
      "Ask the child to retell the activity steps in order",
    ],
  },
  Parietal: {
    interactions: [
      "Describe textures, weights, and temperatures",
      "Ask the child to compare sizes and shapes",
      "Encourage spatial language: above, below, beside",
    ],
    deepening: [
      "Add a measurement or counting element",
      "Challenge the child to arrange materials by property",
    ],
  },
  Occipital: {
    interactions: [
      "Point out colors, patterns, and visual details",
      "Ask 'What do you see that's different?'",
      "Encourage the child to draw what they observe",
    ],
    deepening: [
      "Play a visual memory game with the materials",
      "Ask the child to find a hidden pattern",
    ],
  },
  Limbic: {
    interactions: [
      "Validate emotions: 'I see you're excited about this!'",
      "Share your own feelings about the activity",
      "Use a calm, encouraging tone throughout",
    ],
    deepening: [
      "Discuss how the activity makes the child feel",
      "Connect the activity to caring for others",
    ],
  },
};

const DEFAULT_COACHING = {
  interactions: [
    "Follow the child's lead and interest",
    "Describe what you see the child doing",
    "Ask one thoughtful question per step",
  ],
  deepening: [
    "Extend the activity with a creative twist",
    "Connect the activity to daily life",
  ],
};

export function generateCoaching(activity: Activity): CoachingGuidance {
  if (activity.parentCoaching) {
    return {
      keyInteractions: activity.parentCoaching.keyInteractions,
      deepeningTips: activity.parentCoaching.deepeningTips,
      observeFor: activity.parentCoaching.observeFor,
      timerSuggestionMinutes: activity.duration,
    };
  }

  const regionData = REGION_COACHING[activity.region] ?? DEFAULT_COACHING;

  const observeFor = [
    `Engagement level during ${activity.name}`,
    `Which intelligences (${activity.intelligences.slice(0, 2).join(", ")}) show strongest response`,
    "Moments of frustration or joy — note what triggered them",
  ];

  return {
    keyInteractions: regionData.interactions,
    deepeningTips: regionData.deepening,
    observeFor,
    timerSuggestionMinutes: activity.duration,
  };
}
