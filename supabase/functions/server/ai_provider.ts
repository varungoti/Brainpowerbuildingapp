import {
  estimateFireworksImageCostUSD,
  estimateTextCostUSD,
  isAiSpendOverCap,
  recordAiCost,
  type AiCostRoute,
} from "./ai_costs.ts";

type ChatRole = "system" | "user" | "assistant";

export interface AiChatMessage {
  role: ChatRole;
  content: string;
}

export interface AiTextRequest {
  route: AiCostRoute;
  quality?: "budget" | "quality";
  messages: AiChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface AiJsonRequest<T> extends AiTextRequest {
  schemaName: string;
  schema: unknown;
  repair?: (value: unknown) => T;
}

export interface AiTextResult {
  text: string;
  provider: string;
  model: string;
  estimatedCostUSD: number;
  isFallback: boolean;
}

export interface AiJsonResult<T> extends AiTextResult {
  data: T;
}

export interface AiImageRequest {
  route: AiCostRoute;
  prompt: string;
  aspectRatio?: "1:1" | "4:3" | "3:4" | "16:9" | "9:16";
  seed?: number;
  steps?: number;
}

export interface AiImageResult {
  url: string;
  provider: string;
  model: string;
  estimatedCostUSD: number;
  latencyMs: number;
  seed?: number;
}

type ProviderSpec = {
  provider: "fireworks" | "openai";
  baseUrl: string;
  apiKey: string;
  model: string;
};

function envBool(name: string): boolean {
  return (Deno.env.get(name) ?? "").toLowerCase() === "true";
}

export function isAiForceDeterministic(): boolean {
  return envBool("AI_FORCE_DETERMINISTIC");
}

function budgetModel(): string {
  return Deno.env.get("FIREWORKS_BUDGET_MODEL") ?? "accounts/fireworks/models/gpt-oss-20b";
}

function qualityModel(): string {
  return Deno.env.get("FIREWORKS_QUALITY_MODEL") ?? "accounts/fireworks/models/gpt-oss-120b";
}

function openAiBudgetModel(): string {
  return Deno.env.get("OPENAI_BUDGET_MODEL") ?? "gpt-4o-mini";
}

function openAiQualityModel(): string {
  return Deno.env.get("OPENAI_QUALITY_MODEL") ?? "gpt-4o";
}

function providerCandidates(quality: "budget" | "quality"): ProviderSpec[] {
  const out: ProviderSpec[] = [];
  const fireworksKey = Deno.env.get("FIREWORKS_API_KEY");
  if (fireworksKey && !envBool("AI_FIREWORKS_PAUSED")) {
    out.push({
      provider: "fireworks",
      baseUrl: Deno.env.get("FIREWORKS_BASE_URL") ?? "https://api.fireworks.ai/inference/v1",
      apiKey: fireworksKey,
      model: quality === "quality" ? qualityModel() : budgetModel(),
    });
  }
  const openAiKey = Deno.env.get("OPENAI_API_KEY");
  if (openAiKey && !envBool("AI_OPENAI_PAUSED")) {
    out.push({
      provider: "openai",
      baseUrl: Deno.env.get("OPENAI_BASE_URL") ?? "https://api.openai.com/v1",
      apiKey: openAiKey,
      model: quality === "quality" ? openAiQualityModel() : openAiBudgetModel(),
    });
  }
  return out;
}

function roughTokens(messages: AiChatMessage[], maxTokens: number): { input: number; output: number } {
  const chars = messages.reduce((sum, message) => sum + message.content.length + message.role.length + 6, 0);
  return {
    input: Math.ceil(chars / 4),
    output: maxTokens,
  };
}

async function fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

function extractContent(payload: unknown): string {
  const j = payload as {
    choices?: Array<{ message?: { content?: string }; delta?: { content?: string } }>;
  };
  return j.choices?.[0]?.message?.content ?? j.choices?.[0]?.delta?.content ?? "";
}

export function cleanJsonText(raw: string): string {
  return raw.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim();
}

export async function chatText(req: AiTextRequest): Promise<AiTextResult | null> {
  if (isAiForceDeterministic()) return null;
  const quality = req.quality ?? "budget";
  const maxTokens = req.maxTokens ?? (quality === "quality" ? 1800 : 500);
  const candidates = providerCandidates(quality);
  if (candidates.length === 0) return null;

  for (const spec of candidates) {
    const tokenGuess = roughTokens(req.messages, maxTokens);
    const estimatedCostUSD = estimateTextCostUSD(spec.model, tokenGuess.input, tokenGuess.output);
    if (await isAiSpendOverCap(estimatedCostUSD)) continue;
    const t0 = Date.now();
    try {
      const response = await fetchWithTimeout(`${spec.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${spec.apiKey}`,
        },
        body: JSON.stringify({
          model: spec.model,
          temperature: req.temperature ?? 0.6,
          max_tokens: maxTokens,
          messages: req.messages,
        }),
      }, quality === "quality" ? 25_000 : 15_000);
      if (!response.ok) {
        console.warn("AI text provider non-OK", spec.provider, response.status, await response.text().catch(() => ""));
        continue;
      }
      const payload = await response.json();
      const text = extractContent(payload).trim();
      if (!text) continue;
      const latencyMs = Date.now() - t0;
      await recordAiCost({
        route: req.route,
        provider: spec.provider,
        model: spec.model,
        estimatedCostUSD,
        latencyMs,
      });
      return {
        text,
        provider: spec.provider,
        model: spec.model,
        estimatedCostUSD,
        isFallback: spec.provider !== "fireworks",
      };
    } catch (err) {
      console.warn("AI text provider failed", spec.provider, err);
    }
  }
  return null;
}

export async function chatJson<T>(req: AiJsonRequest<T>): Promise<AiJsonResult<T> | null> {
  if (isAiForceDeterministic()) return null;
  const quality = req.quality ?? "quality";
  const maxTokens = req.maxTokens ?? 2200;
  const candidates = providerCandidates(quality);
  if (candidates.length === 0) return null;

  for (const spec of candidates) {
    const tokenGuess = roughTokens(req.messages, maxTokens);
    const estimatedCostUSD = estimateTextCostUSD(spec.model, tokenGuess.input, tokenGuess.output);
    if (await isAiSpendOverCap(estimatedCostUSD)) continue;
    const t0 = Date.now();
    try {
      const response = await fetchWithTimeout(`${spec.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${spec.apiKey}`,
        },
        body: JSON.stringify({
          model: spec.model,
          temperature: req.temperature ?? 0.4,
          max_tokens: maxTokens,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: req.schemaName,
              schema: req.schema,
            },
          },
          messages: [
            ...req.messages,
            {
              role: "user" as const,
              content: `Return only valid JSON matching the ${req.schemaName} schema. Do not wrap it in markdown.`,
            },
          ],
        }),
      }, quality === "quality" ? 30_000 : 20_000);
      if (!response.ok) {
        console.warn("AI JSON provider non-OK", spec.provider, response.status, await response.text().catch(() => ""));
        continue;
      }
      const payload = await response.json();
      const text = cleanJsonText(extractContent(payload));
      if (!text) continue;
      const parsed = JSON.parse(text) as unknown;
      const data = req.repair ? req.repair(parsed) : parsed as T;
      const latencyMs = Date.now() - t0;
      await recordAiCost({
        route: req.route,
        provider: spec.provider,
        model: spec.model,
        estimatedCostUSD,
        latencyMs,
      });
      return {
        data,
        text,
        provider: spec.provider,
        model: spec.model,
        estimatedCostUSD,
        isFallback: spec.provider !== "fireworks",
      };
    } catch (err) {
      console.warn("AI JSON provider failed", spec.provider, err);
    }
  }
  return null;
}

export async function streamChat(req: AiTextRequest): Promise<Response | null> {
  if (isAiForceDeterministic()) return null;
  const quality = req.quality ?? "budget";
  const maxTokens = req.maxTokens ?? 500;
  const candidates = providerCandidates(quality);
  if (candidates.length === 0) return null;

  for (const spec of candidates) {
    const tokenGuess = roughTokens(req.messages, maxTokens);
    const estimatedCostUSD = estimateTextCostUSD(spec.model, tokenGuess.input, tokenGuess.output);
    if (await isAiSpendOverCap(estimatedCostUSD)) continue;
    const t0 = Date.now();
    try {
      const response = await fetchWithTimeout(`${spec.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${spec.apiKey}`,
        },
        body: JSON.stringify({
          model: spec.model,
          temperature: req.temperature ?? 0.5,
          max_tokens: maxTokens,
          stream: true,
          messages: req.messages,
        }),
      }, 20_000);
      if (!response.ok || !response.body) {
        console.warn("AI stream provider non-OK", spec.provider, response.status, await response.text().catch(() => ""));
        continue;
      }
      await recordAiCost({
        route: req.route,
        provider: spec.provider,
        model: spec.model,
        estimatedCostUSD,
        latencyMs: Date.now() - t0,
      });
      return response;
    } catch (err) {
      console.warn("AI stream provider failed", spec.provider, err);
    }
  }
  return null;
}

export async function generateImage(req: AiImageRequest): Promise<AiImageResult | null> {
  if (isAiForceDeterministic() || envBool("AI_IMAGES_PAUSED")) return null;
  const key = Deno.env.get("FIREWORKS_API_KEY");
  if (!key || envBool("AI_FIREWORKS_PAUSED")) return null;
  const steps = req.steps ?? 4;
  const estimatedCostUSD = estimateFireworksImageCostUSD(steps);
  if (await isAiSpendOverCap(estimatedCostUSD)) return null;
  const t0 = Date.now();
  const model = Deno.env.get("FIREWORKS_IMAGE_MODEL") ?? "flux-1-schnell-fp8";
  try {
    const res = await fetchWithTimeout(
      `https://api.fireworks.ai/inference/v1/workflows/accounts/fireworks/models/${model}/text_to_image`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          prompt: req.prompt,
          aspect_ratio: req.aspectRatio ?? "4:3",
          num_inference_steps: steps,
          seed: req.seed ?? 0,
          safety_check: true,
        }),
      },
      30_000,
    );
    if (!res.ok) {
      console.warn("Fireworks image non-OK", res.status, await res.text().catch(() => ""));
      return null;
    }
    const json = await res.json() as { base64?: string[]; seed?: number; finishReason?: string };
    const url = json.base64?.[0];
    if (!url || json.finishReason === "CONTENT_FILTERED") return null;
    const latencyMs = Date.now() - t0;
    await recordAiCost({
      route: req.route,
      provider: "fireworks",
      model,
      estimatedCostUSD,
      latencyMs,
    });
    return {
      url,
      provider: "fireworks",
      model,
      estimatedCostUSD,
      latencyMs,
      seed: json.seed ?? req.seed,
    };
  } catch (err) {
    console.warn("Fireworks image failed", err);
    return null;
  }
}

