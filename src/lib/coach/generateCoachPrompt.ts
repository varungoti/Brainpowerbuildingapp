import {
  BRAIN_REGIONS,
  MAX_BRAIN_REGION_SCORE,
  getSortedBrainRegionProgress,
} from "../brainRegions";

export type CoachChildProfile = {
  age: number;
  name?: string;
  goals?: string[];
};

export type CoachTimeOfDay = "morning" | "afternoon" | "evening";

export type CoachPlanItem = {
  timeOfDay: CoachTimeOfDay;
  title: string;
  description: string;
  duration: string;
  regionKey: string;
};

export type CoachChatMessage = {
  role: "user" | "assistant";
  content: string;
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

const DEFAULT_STRENGTH_TEXT = "This area is a clear asset right now and can be used to support harder skills through playful repetition.";
const DEFAULT_IMPROVEMENT_TEXT = "This area would benefit from short, frequent, low-pressure practice woven into normal family routines.";

export const COACH_DISCLAIMER = "This is guidance, not diagnosis. It does not replace a qualified medical, psychological, or educational professional.";

export const REGION_ACTIVITY_LIBRARY: Record<string, string[]> = {
  "Creative": [
    "Drawing prompts with unusual materials",
    "Storytelling games where the child invents the ending",
    "Pretend-play scenes using household objects",
  ],
  "Logical-Mathematical": [
    "Puzzle races and pattern-copy games",
    "Counting and sorting during daily chores",
    "Simple math games with cups, blocks, or buttons",
  ],
  "Linguistic": [
    "Read-aloud time with prediction questions",
    "Rhyming and sound-matching games",
    "Narrate routines and ask the child to retell them",
  ],
  "Bodily-Kinesthetic": [
    "Obstacle courses and relay challenges",
    "Dance, yoga, or sports-based play",
    "Hands-on building and movement-rich tasks",
  ],
  "Emotional": [
    "Emotion-labeling during real moments",
    "Journaling or drawing feelings after the day",
    "Calm-down breathing and reflection rituals",
  ],
  "Interpersonal": [
    "Small-group cooperative games",
    "Role-play around turn-taking and sharing",
    "Shared projects that need teamwork",
  ],
  "Intrapersonal": [
    "Short mindfulness check-ins",
    "Choice reflection: what felt easy or hard today",
    "Solo creative time followed by discussion",
  ],
  "Spatial-Visual": [
    "Block builds and map games",
    "Sketching objects from observation",
    "Tangrams and visual planning challenges",
  ],
  "Musical-Rhythmic": [
    "Clap-back rhythm games",
    "Movement to music with tempo changes",
    "Song-based memory activities",
  ],
  "Naturalist": [
    "Outdoor scavenger hunts",
    "Sorting leaves, stones, or natural objects",
    "Gardening or observation journaling",
  ],
  "Digital-Technological": [
    "Unplugged coding games",
    "Step-by-step sequencing challenges",
    "Simple system-building and debugging play",
  ],
  "Pronunciation": [
    "Sound-play and articulation games",
    "Mirror speaking practice with fun phrases",
    "Rhymes and phonological awareness drills",
  ],
  "Coordination": [
    "Hand-eye coordination toss games",
    "Tracing, cutting, and threading practice",
    "Balance and bilateral movement routines",
  ],
  "Existential": [
    "Big-question story discussions",
    "Wonder prompts during walks or bedtime",
    "Reflective conversations about meaning and values",
  ],
};

function uniq<T>(values: T[]) {
  return [...new Set(values)];
}

function getRankedRegions(scores: Record<string, number>) {
  return getSortedBrainRegionProgress(scores);
}

function getTopThree(scores: Record<string, number>) {
  return getRankedRegions(scores).slice(0, 3);
}

function getBottomThree(scores: Record<string, number>) {
  return [...getRankedRegions(scores)].reverse().slice(0, 3).reverse();
}

function formatRegionLine(region: { key: string; score: number }) {
  return `${region.key} (${region.score}/${MAX_BRAIN_REGION_SCORE})`;
}

function describeProfileBalance(scores: Record<string, number>) {
  const ranked = getRankedRegions(scores);
  const top = ranked[0]?.score ?? 0;
  const bottom = ranked[ranked.length - 1]?.score ?? 0;
  const activeRegions = ranked.filter((region) => region.score > 0).length;
  const spread = top - bottom;

  if (activeRegions <= 4) {
    return "The profile is still emerging, so advice should focus on consistency, exposure, and building momentum without overload.";
  }
  if (spread <= 4) {
    return "The profile is relatively balanced, so the coach should protect strengths while gently stretching weaker areas.";
  }
  return "The profile is spiky, with clear standout strengths and a few lagging areas, so the coach should use stronger regions to scaffold weaker ones.";
}

function buildPlanItem(timeOfDay: CoachTimeOfDay, title: string, description: string, regionKey: string, duration: string): CoachPlanItem {
  return { timeOfDay, title, description, regionKey, duration };
}

function getActivityIdeas(regionKey: string) {
  return REGION_ACTIVITY_LIBRARY[regionKey] ?? [DEFAULT_STRENGTH_TEXT];
}

export function buildDeterministicDailyPlan(profile: CoachChildProfile, scores: Record<string, number>): CoachPlanItem[] {
  const strengths = getTopThree(scores);
  const improvements = getBottomThree(scores);
  const primaryStrength = strengths[0] ?? BRAIN_REGIONS[0];
  const primaryImprovement = improvements[0] ?? BRAIN_REGIONS[1];
  const secondaryImprovement = improvements[1] ?? improvements[0] ?? BRAIN_REGIONS[2];
  const childLabel = profile.name?.trim() || "your child";

  return [
    buildPlanItem(
      "morning",
      `${primaryImprovement.name} warm-up`,
      `Start the day with ${getActivityIdeas(primaryImprovement.key)[0].toLowerCase()} so ${childLabel} gets an early rep in a lower-pressure window.`,
      primaryImprovement.key,
      "10-15 min",
    ),
    buildPlanItem(
      "morning",
      `${primaryStrength.name} confidence boost`,
      `Use ${getActivityIdeas(primaryStrength.key)[0].toLowerCase()} to create an early win and keep motivation high.`,
      primaryStrength.key,
      "10 min",
    ),
    buildPlanItem(
      "afternoon",
      `${secondaryImprovement.name} practice block`,
      `Add ${getActivityIdeas(secondaryImprovement.key)[1]?.toLowerCase() ?? getActivityIdeas(secondaryImprovement.key)[0].toLowerCase()} after lunch when attention can be guided more intentionally.`,
      secondaryImprovement.key,
      "15-20 min",
    ),
    buildPlanItem(
      "evening",
      "Calm reflection routine",
      `End with a brief check-in that links the day back to ${primaryImprovement.name.toLowerCase()} and ${primaryStrength.name.toLowerCase()} progress without pressure or judgment.`,
      primaryImprovement.key,
      "5-10 min",
    ),
  ];
}

function inferQuestionRegion(question: string) {
  const lowered = question.toLowerCase();
  return BRAIN_REGIONS.find((region) => {
    const key = region.key.toLowerCase();
    const name = region.name.toLowerCase();
    return lowered.includes(key) || lowered.includes(name);
  });
}

export function buildCoachFallback(
  profile: CoachChildProfile,
  scores: Record<string, number>,
  options?: { question?: string; isPremium?: boolean },
): CoachResponse {
  const strengths = getTopThree(scores);
  const improvements = getBottomThree(scores);
  const childLabel = profile.name?.trim() || "your child";
  const summary = `${childLabel} is showing the most momentum in ${strengths.map((region) => region.name).join(", ")}, while ${improvements.map((region) => region.name).join(", ")} would benefit from extra repetition. The best coaching strategy is to use stronger areas to keep practice engaging while building weaker circuits in short, consistent bursts.`;
  const balanced = describeProfileBalance(scores);
  const dailyPlan = buildDeterministicDailyPlan(profile, scores);
  const focusStrength = strengths[0];
  const focusImprovement = improvements[0];
  const questionRegion = options?.question ? inferQuestionRegion(options.question) : null;
  const improvementText = focusImprovement
    ? `Prioritize ${focusImprovement.name.toLowerCase()} with ${getActivityIdeas(focusImprovement.key)[0].toLowerCase()}.`
    : DEFAULT_IMPROVEMENT_TEXT;
  const strengthText = focusStrength
    ? `Keep nurturing ${focusStrength.name.toLowerCase()} through ${getActivityIdeas(focusStrength.key)[0].toLowerCase()}.`
    : DEFAULT_STRENGTH_TEXT;
  const chatReply = options?.question
    ? questionRegion
      ? `${questionRegion.name} responds best to short, repeatable practice. Start with ${getActivityIdeas(questionRegion.key)[0].toLowerCase()}, then reflect on what felt easiest for ${childLabel}.`
      : `Keep the next step concrete: pick one weak area, give it 10 focused minutes, and pair it with one strong-area activity so ${childLabel} stays engaged.`
    : "Ask a follow-up about speech, focus, emotions, or any specific development area and the coach will adapt the plan.";

  return {
    insights: `${summary} ${balanced}`,
    summary,
    strengths: uniq(strengths.map((region) => `${formatRegionLine(region)} - ${getActivityIdeas(region.key)[0] || DEFAULT_STRENGTH_TEXT}`)),
    improvements: uniq(improvements.map((region) => `${formatRegionLine(region)} - ${getActivityIdeas(region.key)[0] || DEFAULT_IMPROVEMENT_TEXT}`)),
    dailyPlan: options?.isPremium === false ? dailyPlan.slice(0, 2) : dailyPlan,
    weeklyFocus: uniq([
      strengthText,
      improvementText,
      "Keep sessions brief, consistent, and emotionally safe rather than trying to fix everything at once.",
    ]),
    chatReply,
    disclaimer: COACH_DISCLAIMER,
    isPremium: options?.isPremium !== false,
  };
}

export function generateCoachPrompt(
  childProfile: CoachChildProfile,
  scores: Record<string, number>,
  options?: { question?: string; isPremium?: boolean; messages?: CoachChatMessage[] },
) {
  const strengths = getTopThree(scores);
  const weaknesses = getBottomThree(scores);
  const balancedInsights = describeProfileBalance(scores);
  const goals = childProfile.goals?.length ? childProfile.goals.join(", ") : "No explicit parent goals provided.";
  const history = options?.messages?.length
    ? options.messages
        .slice(-8)
        .map((message) => `${message.role === "user" ? "Parent" : "Coach"}: ${message.content}`)
        .join("\n")
    : "No prior conversation yet.";
  const premiumInstruction = options?.isPremium === false
    ? "Give concise free-tier coaching: keep the daily plan to 2 short items and do not overproduce detail."
    : "Give premium-tier coaching: include 4-5 concrete daily-plan items and deeper weekly focus.";

  return `You are an expert child development coach.

Child profile:
Age: ${childProfile.age}
Name: ${childProfile.name?.trim() || "Not provided"}
Goals: ${goals}

Strengths:
${strengths.map((region) => `- ${formatRegionLine(region)}`).join("\n")}

Weaknesses:
${weaknesses.map((region) => `- ${formatRegionLine(region)}`).join("\n")}

Balanced insights:
- ${balancedInsights}
- Strong areas should scaffold weaker ones using real-world parenting activities.
- Avoid medical advice, diagnosis language, and fear-based framing.

Useful region-to-activity mappings:
${BRAIN_REGIONS.map((region) => `- ${region.key}: ${getActivityIdeas(region.key).join("; ")}`).join("\n")}

Conversation context:
${history}

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

Output format:
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
