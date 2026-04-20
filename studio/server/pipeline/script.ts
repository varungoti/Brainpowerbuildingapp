import type { ScenePlan, TemplateId } from "../types.js";

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const PRIMARY = process.env.LLM_PRIMARY_MODEL ?? "gpt-5";

interface DraftedScript {
  title: string;
  subtitle?: string;
  scenes: ScenePlan[];
}

const TEMPLATE_PROMPT: Record<TemplateId, string> = {
  HeroAnnouncement:
    "Hero feature/launch announcement, 6-8 emotionally engaging scenes, ~45s. Strong opening hook.",
  FeatureSpotlight: "Single feature spotlight, 3 scenes, ~20s. Show one capability deeply.",
  TestimonialCard:
    "Parent testimonial, 1 scene with quote + 2 supporting visuals, ~15s. Emotional, real.",
  BrainStoryShort:
    "9:16 vertical short, ~30s. Show a kid doing the activity, callout the brain region developing.",
  ResearchExplainer:
    "16:9 explainer, ~60s. Cite a scientific finding; explain the practical implication for parents.",
  AppDemo: "App demo, 4 scenes inside a phone mockup, ~25s. Show real product flow.",
};

export async function draftScript(opts: {
  template: TemplateId;
  brief: string;
  durationSec: number;
}): Promise<DraftedScript> {
  if (!OPENAI_KEY) throw new Error("OPENAI_API_KEY not set");

  const sys = `You are NeuroSpark's senior brand storyteller. Output strict JSON for a marketing video.

Template guidance: ${TEMPLATE_PROMPT[opts.template]}
Total duration: ~${opts.durationSec}s. Voice: warm, confident, parent-respecting. No exclamation overload.

Scene rules:
- voiceoverText: 1-2 short sentences max per scene (8-18 words). Spoken aloud cleanly.
- imagePrompt: rich, specific visual. Mention subject, setting, lighting, color palette, style.
  Use textInImage:true ONLY when the scene needs legible on-image text (titles, posters).
  Use brandConsistency:"high" when the scene MUST feature the recurring kid character.
- motion: pick one Ken Burns style ("in","out","pan-l","pan-r","pan-up","pan-down").
- useVideoClip:true only for scenes that genuinely need camera motion (e.g. demo flow). Default false.
- durationSec: 2.5-6s typical. Sum to roughly the requested total.

Output JSON exactly:
{ "title": str, "subtitle": str?, "scenes": [{ idx, durationSec, voiceoverText, imagePrompt, brandConsistency?, textInImage?, motion?, useVideoClip? }] }`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: PRIMARY,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: sys },
        { role: "user", content: opts.brief },
      ],
    }),
  });
  if (!res.ok) throw new Error(`LLM ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  const raw = data.choices[0].message.content;
  let parsed: DraftedScript;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`LLM returned non-JSON: ${raw.slice(0, 200)}`);
  }
  parsed.scenes = parsed.scenes.map((s, i) => ({ ...s, idx: i }));
  return parsed;
}
