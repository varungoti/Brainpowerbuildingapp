import { functionsBaseUrl, isSupabaseConfigured, publicAnonKey } from "@/utils/supabase/info";
import {
  buildCoachFallback,
  type CoachChatMessage,
  type CoachChildProfile,
  type CoachResponse,
} from "./generateCoachPrompt";

type CoachRequest = {
  profile: CoachChildProfile;
  scores: Record<string, number>;
  question?: string;
  messages?: CoachChatMessage[];
  isPremium?: boolean;
  /** Survivor 1: identifies which child's long-memory bucket to inject. */
  childId?: string;
};

type CoachApiEnvelope = {
  success: boolean;
  data?: CoachResponse;
  isDemo?: boolean;
  error?: string;
};

function normalizeCoachResponse(
  data: Partial<CoachResponse> | undefined,
  fallback: CoachResponse,
): CoachResponse {
  if (!data) return fallback;
  return {
    insights: typeof data.insights === "string" ? data.insights : fallback.insights,
    summary: typeof data.summary === "string" ? data.summary : fallback.summary,
    strengths: Array.isArray(data.strengths) ? data.strengths.filter((item): item is string => typeof item === "string") : fallback.strengths,
    improvements: Array.isArray(data.improvements) ? data.improvements.filter((item): item is string => typeof item === "string") : fallback.improvements,
    dailyPlan: Array.isArray(data.dailyPlan)
      ? data.dailyPlan.filter(
          (item): item is CoachResponse["dailyPlan"][number] =>
            !!item &&
            typeof item === "object" &&
            typeof item.timeOfDay === "string" &&
            typeof item.title === "string" &&
            typeof item.description === "string" &&
            typeof item.duration === "string" &&
            typeof item.regionKey === "string",
        )
      : fallback.dailyPlan,
    weeklyFocus: Array.isArray(data.weeklyFocus) ? data.weeklyFocus.filter((item): item is string => typeof item === "string") : fallback.weeklyFocus,
    chatReply: typeof data.chatReply === "string" ? data.chatReply : fallback.chatReply,
    disclaimer: typeof data.disclaimer === "string" ? data.disclaimer : fallback.disclaimer,
    isPremium: typeof data.isPremium === "boolean" ? data.isPremium : fallback.isPremium,
  };
}

export async function generateCoachResponse(
  profile: CoachChildProfile,
  scores: Record<string, number>,
  options?: {
    question?: string;
    messages?: CoachChatMessage[];
    isPremium?: boolean;
    /** Survivor 1: passes through to the server so it can inject coach_memory. */
    childId?: string;
  },
): Promise<CoachResponse> {
  const fallback = buildCoachFallback(profile, scores, {
    question: options?.question,
    isPremium: options?.isPremium,
  });

  if (!isSupabaseConfigured() || !functionsBaseUrl) {
    return fallback;
  }

  const payload: CoachRequest = {
    profile,
    scores,
    question: options?.question,
    messages: options?.messages,
    isPremium: options?.isPremium,
    childId: options?.childId,
  };

  try {
    const res = await fetch(`${functionsBaseUrl}/coach`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return fallback;
    }

    const data = (await res.json()) as CoachApiEnvelope;
    if (!data.success) {
      return fallback;
    }

    return normalizeCoachResponse(data.data, fallback);
  } catch {
    return fallback;
  }
}

export type { CoachChatMessage, CoachChildProfile, CoachResponse };
