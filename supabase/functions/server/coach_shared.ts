import {
  BRAIN_REGIONS,
  MAX_BRAIN_REGION_SCORE,
  getSortedBrainRegionProgress,
} from "../../../src/app/data/brainRegions.ts";

export type CoachChildProfile = {
  age: number;
  name?: string;
  goals?: string[];
};

export type CoachChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type CoachPlanItem = {
  timeOfDay: "morning" | "afternoon" | "evening";
  title: string;
  description: string;
  duration: string;
  regionKey: string;
};

export type CoachResponse = {
  insights: string;
  summary: string;
  strengths: string[];
  improvements: string[];
  dailyPlan: CoachPlanItem[];
  weeklyFocus: string[];
  chatReply: string;
  disclaimer: string;
  isPremium: boolean;
};

export const COACH_DISCLAIMER = "This is guidance, not diagnosis. It does not replace a qualified medical, psychological, or educational professional.";

const REGION_ACTIVITY_LIBRARY: Record<string, string[]> = {
  "Creative": ["drawing prompts", "storytelling games", "pretend play"],
  "Logical-Mathematical": ["puzzles", "sorting games", "math play"],
  "Linguistic": ["reading aloud", "rhyming games", "retelling stories"],
  "Bodily-Kinesthetic": ["sports drills", "obstacle courses", "movement games"],
  "Emotional": ["journaling feelings", "emotion naming", "calm-down breathing"],
  "Interpersonal": ["group play", "turn-taking games", "collaborative projects"],
  "Intrapersonal": ["mindfulness", "reflection prompts", "quiet check-ins"],
  "Spatial-Visual": ["block builds", "map play", "drawing from observation"],
  "Musical-Rhythmic": ["clap-back rhythms", "music-and-movement", "singing games"],
  "Naturalist": ["nature walks", "sorting leaves", "outdoor observation"],
  "Digital-Technological": ["unplugged coding", "sequencing games", "debugging challenges"],
  "Pronunciation": ["sound-play", "mirror speech practice", "phonics games"],
  "Coordination": ["hand-eye toss games", "tracing", "threading tasks"],
  "Existential": ["big-question talks", "wonder prompts", "reflective stories"],
};

function getTopThree(scores: Record<string, number>) {
  return getSortedBrainRegionProgress(scores).slice(0, 3);
}

function getBottomThree(scores: Record<string, number>) {
  return [...getSortedBrainRegionProgress(scores)].reverse().slice(0, 3).reverse();
}

function getActivityIdeas(regionKey: string) {
  return REGION_ACTIVITY_LIBRARY[regionKey] ?? ["short, repeatable parent-guided practice"];
}

function describeProfileBalance(scores: Record<string, number>) {
  const ranked = getSortedBrainRegionProgress(scores);
  const top = ranked[0]?.score ?? 0;
  const bottom = ranked[ranked.length - 1]?.score ?? 0;
  if (ranked.filter((region) => region.score > 0).length <= 4) {
    return "The profile is still emerging, so advice should focus on consistency and building momentum without overload.";
  }
  if (top - bottom <= 4) {
    return "The profile is relatively balanced, so coaching should protect strengths while gently stretching weaker areas.";
  }
  return "The profile has clear peaks and gaps, so stronger areas should scaffold weaker ones.";
}

function buildDeterministicDailyPlan(profile: CoachChildProfile, scores: Record<string, number>): CoachPlanItem[] {
  const strengths = getTopThree(scores);
  const improvements = getBottomThree(scores);
  const primaryStrength = strengths[0] ?? BRAIN_REGIONS[0];
  const primaryImprovement = improvements[0] ?? BRAIN_REGIONS[1];
  const secondaryImprovement = improvements[1] ?? improvements[0] ?? BRAIN_REGIONS[2];
  const childLabel = profile.name?.trim() || "your child";

  return [
    {
      timeOfDay: "morning",
      title: `${primaryImprovement.name} warm-up`,
      description: `Start with ${getActivityIdeas(primaryImprovement.key)[0]} so ${childLabel} gets an early, low-pressure rep.`,
      duration: "10-15 min",
      regionKey: primaryImprovement.key,
    },
    {
      timeOfDay: "morning",
      title: `${primaryStrength.name} confidence boost`,
      description: `Use ${getActivityIdeas(primaryStrength.key)[0]} to create an early win and maintain motivation.`,
      duration: "10 min",
      regionKey: primaryStrength.key,
    },
    {
      timeOfDay: "afternoon",
      title: `${secondaryImprovement.name} practice block`,
      description: `Add ${getActivityIdeas(secondaryImprovement.key)[1] ?? getActivityIdeas(secondaryImprovement.key)[0]} after lunch for guided repetition.`,
      duration: "15-20 min",
      regionKey: secondaryImprovement.key,
    },
    {
      timeOfDay: "evening",
      title: "Calm reflection routine",
      description: `Close the day with a gentle check-in that notices progress without pressure or correction.`,
      duration: "5-10 min",
      regionKey: primaryImprovement.key,
    },
  ];
}

function inferQuestionRegion(question: string) {
  const lowered = question.toLowerCase();
  return BRAIN_REGIONS.find((region) => lowered.includes(region.key.toLowerCase()) || lowered.includes(region.name.toLowerCase()));
}

export function buildCoachFallback(
  profile: CoachChildProfile,
  scores: Record<string, number>,
  options?: { question?: string; isPremium?: boolean },
): CoachResponse {
  const strengths = getTopThree(scores);
  const improvements = getBottomThree(scores);
  const childLabel = profile.name?.trim() || "your child";
  const questionRegion = options?.question ? inferQuestionRegion(options.question) : null;
  const summary = `${childLabel} is strongest in ${strengths.map((region) => region.name).join(", ")} and needs the most support in ${improvements.map((region) => region.name).join(", ")}. The best coaching plan is to use stronger areas to make weaker-skill practice more engaging and repeatable.`;

  return {
    insights: `${summary} ${describeProfileBalance(scores)}`,
    summary,
    strengths: strengths.map((region) => `${region.key} (${region.score}/${MAX_BRAIN_REGION_SCORE}) - ${getActivityIdeas(region.key)[0]}`),
    improvements: improvements.map((region) => `${region.key} (${region.score}/${MAX_BRAIN_REGION_SCORE}) - ${getActivityIdeas(region.key)[0]}`),
    dailyPlan: options?.isPremium === false ? buildDeterministicDailyPlan(profile, scores).slice(0, 2) : buildDeterministicDailyPlan(profile, scores),
    weeklyFocus: [
      `Nurture ${strengths[0]?.name.toLowerCase() ?? "strong areas"} through ${getActivityIdeas(strengths[0]?.key ?? "")[0] ?? "play-based wins"}.`,
      `Prioritize ${improvements[0]?.name.toLowerCase() ?? "one lower area"} with ${getActivityIdeas(improvements[0]?.key ?? "")[0] ?? "short guided practice"}.`,
      "Keep coaching warm, consistent, and practical rather than perfectionistic.",
    ],
    chatReply: options?.question
      ? questionRegion
        ? `${questionRegion.name} responds best to short, repeatable practice. Start with ${getActivityIdeas(questionRegion.key)[0]}, then notice what feels easiest for ${childLabel}.`
        : `Pick one weaker area, give it 10 focused minutes, and pair it with one stronger-area activity so ${childLabel} stays engaged.`
      : "Ask about speech, focus, emotions, or routines and the coach will adapt the plan.",
    disclaimer: COACH_DISCLAIMER,
    isPremium: options?.isPremium !== false,
  };
}

export interface CoachLongMemory {
  observation: string;
  topic: string;
  weight: number;
  created_at: string;
}

export function generateCoachPrompt(
  profile: CoachChildProfile,
  scores: Record<string, number>,
  options?: {
    question?: string;
    isPremium?: boolean;
    messages?: CoachChatMessage[];
    /** Survivor 1: long memory observations from coach_memory table. */
    longMemory?: CoachLongMemory[];
  },
) {
  const strengths = getTopThree(scores);
  const weaknesses = getBottomThree(scores);
  const goals = profile.goals?.length ? profile.goals.join(", ") : "No explicit parent goals provided.";
  const history = options?.messages?.length
    ? options.messages.slice(-8).map((message) => `${message.role === "user" ? "Parent" : "Coach"}: ${message.content}`).join("\n")
    : "No prior conversation yet.";
  const premiumInstruction = options?.isPremium === false
    ? "Give concise free-tier coaching: keep the daily plan to 2 short items."
    : "Give premium-tier coaching: include 4-5 concrete daily-plan items and deeper weekly focus.";

  // Survivor 1 — long-memory injection. We pick the 12 highest-weight, most
  // recent observations and inject them as a quoted block. The system
  // prompt instructs the coach to *quote back* a specific past observation
  // when relevant, which is the key differentiator vs a stateless LLM.
  const longMemoryBlock = (options?.longMemory ?? [])
    .slice()
    .sort((a, b) => (b.weight - a.weight) || b.created_at.localeCompare(a.created_at))
    .slice(0, 12)
    .map((m) => `- (${m.topic}, ${new Date(m.created_at).toISOString().slice(0, 10)}) ${m.observation}`)
    .join("\n");
  const longMemorySection = longMemoryBlock
    ? `\n\nLong memory of this child (last 6 months — quote back specifics when relevant):\n${longMemoryBlock}`
    : "";

  return `You are an expert child development coach.

Child profile:
Age: ${profile.age}
Name: ${profile.name?.trim() || "Not provided"}
Goals: ${goals}

Strengths:
${strengths.map((region) => `- ${region.key} (${region.score}/${MAX_BRAIN_REGION_SCORE})`).join("\n")}

Weaknesses:
${weaknesses.map((region) => `- ${region.key} (${region.score}/${MAX_BRAIN_REGION_SCORE})`).join("\n")}

Balanced insights:
- ${describeProfileBalance(scores)}
- Use stronger regions to scaffold weaker ones.
- Avoid medical advice, diagnosis language, and fear-based framing.

Useful region-to-activity mappings:
${BRAIN_REGIONS.map((region) => `- ${region.key}: ${getActivityIdeas(region.key).join("; ")}`).join("\n")}

Conversation context:
${history}${longMemorySection}

Current parent request:
${options?.question?.trim() || "Give a personalized parenting coach report based on the child's development profile."}

Instructions:
- Give practical advice for parents.
- Keep it actionable and warm.
- Suggest real-world activities, not abstract theory.
- Avoid medical jargon.
- Be encouraging but honest.
- Mention that this is guidance, not diagnosis.
- ${premiumInstruction}

Return ONLY valid JSON with this exact structure:
{
  "insights": "1-2 paragraph high-level coach insight",
  "summary": "short summary paragraph",
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "improvements": ["Improvement 1", "Improvement 2", "Improvement 3"],
  "dailyPlan": [
    {
      "timeOfDay": "morning|afternoon|evening",
      "title": "activity title",
      "description": "practical parent instruction",
      "duration": "5-15 min",
      "regionKey": "brain region key"
    }
  ],
  "weeklyFocus": ["Focus 1", "Focus 2", "Focus 3"],
  "chatReply": "Direct answer to the parent's latest request in a coach tone",
  "disclaimer": "${COACH_DISCLAIMER}"
}`;
}
