export const coachResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "insights",
    "summary",
    "strengths",
    "improvements",
    "dailyPlan",
    "weeklyFocus",
    "chatReply",
    "disclaimer",
  ],
  properties: {
    insights: { type: "string" },
    summary: { type: "string" },
    strengths: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 5 },
    improvements: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 5 },
    dailyPlan: {
      type: "array",
      minItems: 1,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["timeOfDay", "title", "description", "duration", "regionKey"],
        properties: {
          timeOfDay: { type: "string", enum: ["morning", "afternoon", "evening"] },
          title: { type: "string" },
          description: { type: "string" },
          duration: { type: "string" },
          regionKey: { type: "string" },
        },
      },
    },
    weeklyFocus: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 5 },
    chatReply: { type: "string" },
    disclaimer: { type: "string" },
  },
} as const;

export const activityCoachingSchema = {
  type: "object",
  additionalProperties: false,
  required: ["keyInteractions", "deepeningTips", "observeFor", "chatReply", "disclaimer"],
  properties: {
    keyInteractions: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 6 },
    deepeningTips: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 6 },
    observeFor: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 6 },
    chatReply: { type: "string" },
    disclaimer: { type: "string" },
  },
} as const;

export const aiCounselorSchema = {
  type: "object",
  additionalProperties: false,
  required: ["category", "summary", "solutions", "redFlags", "activityRecommendations", "references"],
  properties: {
    category: { type: "string" },
    summary: { type: "string" },
    solutions: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "approach", "science", "steps", "duration", "successSigns", "difficulty"],
        properties: {
          title: { type: "string" },
          approach: { type: "string" },
          science: { type: "string" },
          steps: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 8 },
          duration: { type: "string" },
          successSigns: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 6 },
          difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
        },
      },
    },
    redFlags: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 8 },
    nutritionNote: { type: "string" },
    activityRecommendations: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 6 },
    references: { type: "array", items: { type: "string" }, minItems: 5, maxItems: 25 },
  },
} as const;

export const printableGuideSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "subtitle", "materials", "prepChecklist", "activities", "routine", "footer"],
  properties: {
    title: { type: "string" },
    subtitle: { type: "string" },
    materials: { type: "array", items: { type: "string" }, maxItems: 30 },
    prepChecklist: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 8 },
    activities: {
      type: "array",
      minItems: 1,
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "activityId",
          "title",
          "whyThisMatters",
          "steps",
          "sayThis",
          "watchFor",
          "adaptIfTooEasy",
          "adaptIfTooHard",
          "safetyNote",
          "reflectionPrompt",
          "illustration",
        ],
        properties: {
          activityId: { type: "string" },
          title: { type: "string" },
          whyThisMatters: { type: "string" },
          steps: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 8 },
          sayThis: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 4 },
          watchFor: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 4 },
          adaptIfTooEasy: { type: "string" },
          adaptIfTooHard: { type: "string" },
          safetyNote: { type: "string" },
          reflectionPrompt: { type: "string" },
          illustration: {
            type: "object",
            additionalProperties: false,
            required: ["prompt", "alt", "fallbackIcon"],
            properties: {
              prompt: { type: "string" },
              alt: { type: "string" },
              fallbackIcon: { type: "string" },
            },
          },
        },
      },
    },
    routine: {
      type: "object",
      additionalProperties: false,
      required: ["warmUp", "mainPlay", "calmClose", "parentReflection"],
      properties: {
        warmUp: { type: "string" },
        mainPlay: { type: "string" },
        calmClose: { type: "string" },
        parentReflection: { type: "string" },
      },
    },
    footer: { type: "string" },
  },
} as const;
