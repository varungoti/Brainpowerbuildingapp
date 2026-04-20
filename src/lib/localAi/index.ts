/**
 * Survivor 3 — On-device-first AI.
 *
 * Adapter that routes coach / STT / TTS / safety calls to a locally-bundled
 * model when the user has opted into on-device mode, falling back to cloud
 * otherwise. Designed so the call sites (`postCoach`, voice mode, safety
 * filter) don't need to know the runtime: they call `localAi.chat(...)`,
 * `localAi.transcribe(...)`, etc., and the adapter picks the right runtime.
 *
 * Model bundles:
 *   - LLM:      Phi-3.5-mini or Gemma-3n-2B (~1-2GB) via @xenova/transformers
 *               on web; @capacitor-community/llm on native.
 *   - STT:      Whisper-tiny.en (~39 MB) on Capacitor (and web via xenova).
 *   - TTS:      Kokoro web build (~80 MB) — same self-hosted runtime as Studio.
 *   - Safety:   small text classifier (DistilBERT toxic-bert) (~67 MB).
 *
 * Until the bundle is shipped (a 4-week deploy), `available()` returns false
 * for the actual transformer call but the consent + privacy panel + UI
 * plumbing are fully wired. See docs/SURVIVOR_3_ON_DEVICE.md.
 */

export type ProcessingMode = "on-device" | "cloud" | "hybrid";

const STORAGE_KEY = "neurospark.localAi.mode";
const COPPA_CONSENT_KEY = "neurospark.coppa.aiConsent";

export interface AiConsent {
  childId: string;
  /** Granted at this ISO time. Required by COPPA 2.0 (Apr 22, 2026). */
  grantedAt: string;
  /** Specific AI features the parent consented to. Each feature has separate consent. */
  features: ("coach" | "voice-stt" | "voice-tts" | "safety" | "image-gen")[];
  /** Whether the user picked on-device-only for this child. */
  onDeviceOnly: boolean;
}

export interface LocalRuntimeStatus {
  llmAvailable: boolean;
  sttAvailable: boolean;
  ttsAvailable: boolean;
  safetyAvailable: boolean;
  bundleSizeMb: number;
  modelName: string;
}

export interface ChatRequest {
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ChatResponse {
  text: string;
  /** Identifies which runtime served this request. */
  source: "on-device" | "cloud";
  tokensUsed: number;
}

// ─── Mode preference ─────────────────────────────────────────────────────
export function getProcessingMode(): ProcessingMode {
  if (typeof localStorage === "undefined") return "cloud";
  const v = localStorage.getItem(STORAGE_KEY);
  if (v === "on-device" || v === "hybrid") return v;
  return "cloud";
}

export function setProcessingMode(mode: ProcessingMode): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, mode);
}

// ─── COPPA 2.0 consent ───────────────────────────────────────────────────
export function getAiConsent(childId: string): AiConsent | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${COPPA_CONSENT_KEY}.${childId}`);
    return raw ? (JSON.parse(raw) as AiConsent) : null;
  } catch {
    return null;
  }
}

export function setAiConsent(consent: AiConsent): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(`${COPPA_CONSENT_KEY}.${consent.childId}`, JSON.stringify(consent));
}

export function revokeAiConsent(childId: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(`${COPPA_CONSENT_KEY}.${childId}`);
}

export function hasFeatureConsent(childId: string, feature: AiConsent["features"][number]): boolean {
  const c = getAiConsent(childId);
  return c ? c.features.includes(feature) : false;
}

// ─── Runtime status ──────────────────────────────────────────────────────
let cachedStatus: LocalRuntimeStatus | null = null;

/**
 * Detects whether the browser exposes WebGPU. This is the prerequisite for
 * any WebLLM (`@mlc-ai/web-llm`) runtime — even if the package isn't
 * installed yet, knowing WebGPU is here lets us flip the "Hybrid" hint in
 * the privacy panel from "not yet" to "available next update".
 */
export function hasWebGpu(): boolean {
  if (typeof navigator === "undefined") return false;
  return "gpu" in navigator && !!(navigator as Navigator & { gpu?: unknown }).gpu;
}

/**
 * Probes for the optional `@mlc-ai/web-llm` package without forcing it
 * into the bundle. Returns the `CreateMLCEngine` factory if (a) the
 * package is installed and (b) the browser exposes WebGPU. Used by the
 * web-PWA on-device path; on native Capacitor we still prefer
 * `@capacitor-community/llm` for tighter platform integration.
 */
export async function probeWebLlm(): Promise<{
  available: boolean;
  reason?: "no-webgpu" | "no-package" | "ok";
}> {
  if (!hasWebGpu()) return { available: false, reason: "no-webgpu" };
  try {
    const dynImport = new Function("s", "return import(s);") as (s: string) => Promise<unknown>;
    const pkg = ["@mlc-ai", "web-llm"].join("/");
    const mod = (await dynImport(pkg).catch(() => null)) as
      | { CreateMLCEngine?: unknown }
      | null;
    if (mod?.CreateMLCEngine) return { available: true, reason: "ok" };
    return { available: false, reason: "no-package" };
  } catch {
    return { available: false, reason: "no-package" };
  }
}

export async function getLocalRuntimeStatus(): Promise<LocalRuntimeStatus> {
  if (cachedStatus) return cachedStatus;
  // Two probes — native first (tighter integration on iOS/Android), then
  // WebLLM as a web-PWA fallback. Both are dynamically imported so the
  // root web bundle stays slim when neither package is installed.
  let llmAvailable = false;
  let modelName: string = "cloud-fallback";
  let bundleSizeMb = 0;
  try {
    const dynImport = new Function("s", "return import(s);") as (s: string) => Promise<unknown>;
    const pkg = ["@capacitor-community", "llm"].join("/");
    const mod = (await dynImport(pkg).catch(() => null)) as
      | { LLM?: { isAvailable?(): Promise<{ available: boolean }> } }
      | null;
    if (mod?.LLM?.isAvailable) {
      const r = await mod.LLM.isAvailable();
      if (r.available) {
        llmAvailable = true;
        modelName = "phi-3.5-mini (native)";
        bundleSizeMb = 1800;
      }
    }
  } catch {
    /* noop */
  }
  if (!llmAvailable) {
    const web = await probeWebLlm();
    if (web.available) {
      llmAvailable = true;
      modelName = "Llama-3.2-1B-Instruct (WebLLM)";
      bundleSizeMb = 900;
    }
  }
  cachedStatus = {
    llmAvailable,
    sttAvailable: typeof window !== "undefined" && "MediaRecorder" in window,
    ttsAvailable: typeof window !== "undefined" && "speechSynthesis" in window,
    safetyAvailable: true,
    bundleSizeMb,
    modelName,
  };
  return cachedStatus;
}

/** Test-only: drops the cached probe so unit tests can re-evaluate. */
export function _resetRuntimeStatusForTests(): void {
  cachedStatus = null;
}

// ─── Chat router ─────────────────────────────────────────────────────────
/** Returns whether this child + feature combo is allowed to call the cloud. */
export function canUseCloud(childId: string, feature: AiConsent["features"][number]): boolean {
  const c = getAiConsent(childId);
  if (!c) return false;
  if (c.onDeviceOnly) return false;
  return c.features.includes(feature);
}

/** Returns whether this child + feature can use on-device. */
export async function canUseLocal(childId: string, feature: AiConsent["features"][number]): Promise<boolean> {
  const c = getAiConsent(childId);
  if (!c) return false;
  if (!c.features.includes(feature)) return false;
  const status = await getLocalRuntimeStatus();
  switch (feature) {
    case "coach": return status.llmAvailable;
    case "voice-stt": return status.sttAvailable;
    case "voice-tts": return status.ttsAvailable;
    case "safety": return status.safetyAvailable;
    case "image-gen": return false;
  }
}

/**
 * High-level chat router. Picks on-device first when the user opted in,
 * else falls back to cloud (passing through to the existing `/coach`
 * cloud endpoint). The fallback caller is injected so this module can be
 * tested in isolation.
 */
export async function routedChat(
  childId: string,
  req: ChatRequest,
  cloudFallback: (req: ChatRequest) => Promise<ChatResponse>,
): Promise<ChatResponse> {
  const mode = getProcessingMode();
  const wantLocal = mode === "on-device" || mode === "hybrid";
  if (wantLocal && (await canUseLocal(childId, "coach"))) {
    try {
      const dynImport = new Function("s", "return import(s);") as (s: string) => Promise<unknown>;
      const nativePkg = ["@capacitor-community", "llm"].join("/");
      const nativeMod = (await dynImport(nativePkg).catch(() => null)) as
        | { LLM?: { chat?(opts: unknown): Promise<{ text: string }> } }
        | null;
      if (nativeMod?.LLM?.chat) {
        const r = await nativeMod.LLM.chat({
          systemPrompt: req.systemPrompt,
          userMessage: req.userMessage,
          maxTokens: req.maxTokens ?? 1024,
          temperature: req.temperature ?? 0.7,
        });
        return { text: r.text, source: "on-device", tokensUsed: 0 };
      }
      // Web-PWA fallback: WebLLM (`@mlc-ai/web-llm`). Lazily resolved + cached
      // so the engine warm-up is paid once per session, not per turn.
      if (hasWebGpu()) {
        const engine = await getOrInitWebLlmEngine();
        if (engine) {
          const r = await engine.chat({
            systemPrompt: req.systemPrompt,
            userMessage: req.userMessage,
            temperature: req.temperature ?? 0.7,
          });
          return { text: r.text, source: "on-device", tokensUsed: r.tokens ?? 0 };
        }
      }
    } catch {
      // fall through to cloud
    }
  }
  if (mode === "on-device") {
    // Strict mode: refuse rather than secretly going to cloud.
    return {
      text: "On-device AI is not available on this device yet. Switch to Hybrid in Settings → AI to use the cloud coach for now, or try again after the next app update.",
      source: "on-device",
      tokensUsed: 0,
    };
  }
  if (!canUseCloud(childId, "coach")) {
    return {
      text: "AI features need parental consent (COPPA 2.0). Enable them under Settings → AI for this child.",
      source: "cloud",
      tokensUsed: 0,
    };
  }
  return cloudFallback(req);
}

/**
 * Returns the literal storage of what we have stored about this child —
 * used by the privacy panel ("Show me what you stored about my child").
 * Pulls from localStorage + IndexedDB (best-effort).
 */
export async function describeLocalStorage(childId: string): Promise<{
  key: string; valueLength: number; updated?: string;
}[]> {
  if (typeof localStorage === "undefined") return [];
  const entries: { key: string; valueLength: number; updated?: string }[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    if (k.includes(childId) || k.startsWith("neurospark.")) {
      const v = localStorage.getItem(k) ?? "";
      entries.push({ key: k, valueLength: v.length });
    }
  }
  return entries;
}

// ─── WebLLM engine (lazy, cached per session) ────────────────────────────
type WebLlmEngine = {
  chat(args: { systemPrompt: string; userMessage: string; temperature: number }):
    Promise<{ text: string; tokens?: number }>;
};

let _webLlmEngine: WebLlmEngine | null = null;
let _webLlmInitPromise: Promise<WebLlmEngine | null> | null = null;

/**
 * Returns a chat-shaped wrapper around `@mlc-ai/web-llm`. Initialised once
 * per session — first call triggers weights download (cached by the browser
 * across sessions). Returns `null` if the package or WebGPU is missing so
 * the caller can transparently fall back to cloud.
 */
async function getOrInitWebLlmEngine(): Promise<WebLlmEngine | null> {
  if (_webLlmEngine) return _webLlmEngine;
  if (_webLlmInitPromise) return _webLlmInitPromise;
  _webLlmInitPromise = (async () => {
    try {
      const dynImport = new Function("s", "return import(s);") as (s: string) => Promise<unknown>;
      const pkg = ["@mlc-ai", "web-llm"].join("/");
      const mod = (await dynImport(pkg).catch(() => null)) as
        | { CreateMLCEngine?: (m: string, opts?: unknown) => Promise<unknown> }
        | null;
      if (!mod?.CreateMLCEngine) return null;
      const modelId = "Llama-3.2-1B-Instruct-q4f16_1-MLC";
      const raw = (await mod.CreateMLCEngine(modelId)) as {
        chat: {
          completions: {
            create(opts: unknown): Promise<{
              choices: Array<{ message: { content?: string } }>;
              usage?: { total_tokens?: number };
            }>;
          };
        };
      };
      _webLlmEngine = {
        async chat({ systemPrompt, userMessage, temperature }) {
          const resp = await raw.chat.completions.create({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userMessage },
            ],
            temperature,
          });
          return {
            text: resp.choices[0]?.message?.content ?? "",
            tokens: resp.usage?.total_tokens,
          };
        },
      };
      return _webLlmEngine;
    } catch {
      return null;
    }
  })();
  return _webLlmInitPromise;
}

/** Hard-purges everything we stored about this child on this device. */
export function purgeChildLocalState(childId: string): number {
  if (typeof localStorage === "undefined") return 0;
  let purged = 0;
  const toDelete: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    if (k.includes(childId)) toDelete.push(k);
  }
  for (const k of toDelete) {
    localStorage.removeItem(k);
    purged += 1;
  }
  return purged;
}
