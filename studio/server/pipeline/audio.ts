import { uploadAsset } from "../store.js";
import type { ScenePlan } from "../types.js";

const KOKORO_URL = process.env.KOKORO_URL;
const KOKORO_TOKEN = process.env.KOKORO_TOKEN ?? "";
const BUCKET = process.env.STUDIO_STORAGE_BUCKET ?? "studio";

interface KokoroTimestampResp {
  audio_b64: string;
  words: Array<{ word: string; start: number; end: number }>;
}

/**
 * Generate full voiceover from concatenated scene scripts, then split the
 * per-word timing back into each scene by accumulated character offset.
 */
export async function generateVoiceover(opts: {
  jobId: string;
  scenes: ScenePlan[];
  voice: string;
}): Promise<{ scenes: ScenePlan[]; voiceoverUrl: string }> {
  if (!KOKORO_URL) throw new Error("KOKORO_URL not set");

  const fullText = opts.scenes.map((s) => s.voiceoverText.trim()).join(" ... ");
  const res = await fetch(`${KOKORO_URL}/audio/speech/timestamps`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KOKORO_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "kokoro",
      voice: opts.voice,
      input: fullText,
      response_format: "wav",
      return_word_timestamps: true,
    }),
  });
  if (!res.ok) throw new Error(`Kokoro ${res.status}: ${await res.text()}`);
  const j = (await res.json()) as KokoroTimestampResp;

  const wav = Buffer.from(j.audio_b64, "base64");
  const path = `${opts.jobId}/voiceover.wav`;
  const url = await uploadAsset(BUCKET, path, wav, "audio/wav");

  const scenes = [...opts.scenes];
  let wordsRemaining = j.words.slice();
  for (const s of scenes) {
    const wordCount = s.voiceoverText.trim().split(/\s+/).filter(Boolean).length;
    const taken = wordsRemaining.slice(0, wordCount);
    wordsRemaining = wordsRemaining.slice(wordCount);
    s.words = taken.map((w) => ({
      word: w.word,
      startMs: Math.round(w.start * 1000),
      endMs: Math.round(w.end * 1000),
    }));
  }
  return { scenes, voiceoverUrl: url };
}
