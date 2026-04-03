import {
  buildCoachFallback,
  generateCoachPrompt,
  type CoachChatMessage,
  type CoachChildProfile,
  type CoachResponse,
} from "../../../src/lib/coach/generateCoachPrompt";

type CoachRequestBody = {
  profile?: CoachChildProfile;
  scores?: Record<string, number>;
  question?: string;
  messages?: CoachChatMessage[];
  isPremium?: boolean;
};

function isFiniteRecord(input: unknown): input is Record<string, number> {
  if (!input || typeof input !== "object") return false;
  return Object.values(input).every((value) => typeof value === "number" && Number.isFinite(value));
}

function sanitizeCoachMessages(messages: unknown): CoachChatMessage[] {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter(
      (message): message is CoachChatMessage =>
        !!message &&
        typeof message === "object" &&
        ((message as CoachChatMessage).role === "user" || (message as CoachChatMessage).role === "assistant") &&
        typeof (message as CoachChatMessage).content === "string",
    )
    .slice(-8);
}

function normalizeCoachResponse(parsed: Partial<CoachResponse>, fallback: CoachResponse, isPremium: boolean): CoachResponse {
  return {
    insights: typeof parsed.insights === "string" ? parsed.insights : fallback.insights,
    summary: typeof parsed.summary === "string" ? parsed.summary : fallback.summary,
    strengths: Array.isArray(parsed.strengths)
      ? parsed.strengths.filter((item): item is string => typeof item === "string")
      : fallback.strengths,
    improvements: Array.isArray(parsed.improvements)
      ? parsed.improvements.filter((item): item is string => typeof item === "string")
      : fallback.improvements,
    dailyPlan: Array.isArray(parsed.dailyPlan)
      ? parsed.dailyPlan.filter(
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
    weeklyFocus: Array.isArray(parsed.weeklyFocus)
      ? parsed.weeklyFocus.filter((item): item is string => typeof item === "string")
      : fallback.weeklyFocus,
    chatReply: typeof parsed.chatReply === "string" ? parsed.chatReply : fallback.chatReply,
    disclaimer: typeof parsed.disclaimer === "string" ? parsed.disclaimer : fallback.disclaimer,
    isPremium,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CoachRequestBody;
    if (!body.profile || typeof body.profile.age !== "number" || !isFiniteRecord(body.scores)) {
      return Response.json({ success: false, error: "invalid_payload" }, { status: 400 });
    }

    const profile: CoachChildProfile = {
      age: body.profile.age,
      name: typeof body.profile.name === "string" ? body.profile.name : undefined,
      goals: Array.isArray(body.profile.goals)
        ? body.profile.goals.filter((goal): goal is string => typeof goal === "string")
        : undefined,
    };
    const scores = body.scores;
    const isPremium = body.isPremium !== false;
    const question = typeof body.question === "string" ? body.question : undefined;
    const messages = sanitizeCoachMessages(body.messages);
    const fallback = buildCoachFallback(profile, scores, { question, isPremium });
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return Response.json({ success: true, data: fallback, isDemo: true });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.7,
        max_tokens: 2200,
        messages: [
          {
            role: "system",
            content: generateCoachPrompt(profile, scores, { question, messages, isPremium }),
          },
          {
            role: "user",
            content: question?.trim()
              ? `Parent follow-up: ${question}`
              : "Create the initial AI parenting coach response now.",
          },
        ],
      }),
    });

    if (!response.ok) {
      return Response.json({ success: true, data: fallback, isDemo: true });
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content ?? "";
    const clean = String(content).replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(clean) as Partial<CoachResponse>;

    return Response.json({
      success: true,
      data: normalizeCoachResponse(parsed, fallback, isPremium),
      isDemo: false,
    });
  } catch {
    return Response.json({ success: false, error: "coach_failed" }, { status: 500 });
  }
}
