// ============================================================================
// voiceTurnClient — calls /voice/turn (SSE stream) and returns the full reply.
// ----------------------------------------------------------------------------
// The Edge Function streams `event: token` for each delta and a final
// `event: done`. For the ConversationButton's onTurn contract we only need
// the final assembled text, but we expose the streaming variant too so a
// future TTS pipeline can start speaking before generation finishes.
//
// Auth: Supabase JWT when available, anon key otherwise.
// ============================================================================

import { functionsBaseUrl, publicAnonKey } from "../../utils/supabase/info";
import { getSupabaseBrowserClient } from "../../utils/supabase/client";

export type VoiceTurnAgent = "coach" | "counselor" | "narrator";

async function getJwt(): Promise<string | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;
  try {
    const { data } = await client.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

export interface VoiceTurnOptions {
  agent: VoiceTurnAgent;
  utterance: string;
  locale?: string;
  /** Called for every token as it arrives. Optional. */
  onToken?: (token: string) => void;
  /** Abort signal so the caller can cancel mid-stream. */
  signal?: AbortSignal;
}

export async function speakViaVoiceTurnEdge(opts: VoiceTurnOptions): Promise<string> {
  if (!functionsBaseUrl) {
    throw new Error("voice_unavailable_no_functions_base");
  }
  const jwt = await getJwt();
  const url = `${functionsBaseUrl.replace("/make-server-76b0ba9a", "")}/voice/turn`;
  const resp = await fetch(url, {
    method: "POST",
    signal: opts.signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt ?? publicAnonKey}`,
      apikey: publicAnonKey,
    },
    body: JSON.stringify({
      agent: opts.agent,
      utterance: opts.utterance,
      locale: opts.locale ?? "en",
    }),
  });

  if (!resp.ok || !resp.body) {
    throw new Error(`voice_turn_http_${resp.status}`);
  }

  const reader = resp.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let assembled = "";

  // Parse the SSE stream: each event is `event: <name>\ndata: <json>\n\n`.
  // We only act on `token` and `done`; everything else is logged.
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const parts = buf.split("\n\n");
    buf = parts.pop() ?? "";
    for (const block of parts) {
      const lines = block.split("\n");
      let event = "message";
      let dataRaw = "";
      for (const line of lines) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) dataRaw += line.slice(5).trim();
      }
      if (!dataRaw) continue;
      try {
        const data = JSON.parse(dataRaw) as { t?: string; text?: string; message?: string };
        if (event === "token" && typeof data.t === "string") {
          assembled += data.t;
          opts.onToken?.(data.t);
        } else if (event === "done" && typeof data.text === "string") {
          assembled = data.text;
        } else if (event === "error") {
          throw new Error(`voice_turn_${data.message ?? "stream_error"}`);
        }
      } catch (e) {
        if (e instanceof Error && e.message.startsWith("voice_turn_")) throw e;
        /* skip malformed event */
      }
    }
  }

  return assembled.trim();
}
