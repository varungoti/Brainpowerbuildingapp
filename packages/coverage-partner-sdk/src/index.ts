/**
 * @neurospark/coverage-partner-sdk
 *
 * Tiny zero-dep SDK for granting NeuroSpark coverage credit from a
 * third-party experience. Targets Node 18+ / Bun / Deno / Cloudflare Workers.
 *
 * The cryptographic envelope mirrors the server's `postCoverageCredit`
 * handler in supabase/functions/server/index.tsx. Keep them in sync.
 */

import { createHmac } from "node:crypto";

export type CoverageModality = "voice" | "screen" | "tactile" | "audio-only" | "outdoor" | "mixed";

export interface CoverageCreditInput {
  anonToken: string;
  partnerEventId: string;
  durationSeconds: number;
  modality: CoverageModality;
  brainRegion?: string;
  competencyIds?: string[];
  occurredAt?: string;
}

export interface CoverageCreditResult {
  status: "credited" | "duplicate";
  creditId?: number;
  signedAt?: string;
}

export interface CoverageClientConfig {
  baseUrl: string;
  partnerSlug: string;
  /** Hex string from admin UI — 64 chars (32 bytes). */
  signingSecret: string;
  /** Optional fetch override. Defaults to platform `fetch`. */
  fetchImpl?: typeof fetch;
  /** Per-request timeout (ms). Default 15s. */
  timeoutMs?: number;
}

export class CoverageError extends Error {
  constructor(message: string, readonly status: number, readonly body?: string) {
    super(message);
    this.name = "CoverageError";
  }
}

export class CoverageClient {
  private readonly base: string;
  private readonly slug: string;
  private readonly secretBytes: Buffer;
  private readonly fetchImpl: typeof fetch;
  private readonly timeout: number;

  constructor(cfg: CoverageClientConfig) {
    if (!cfg.baseUrl || !cfg.partnerSlug || !cfg.signingSecret) {
      throw new Error("CoverageClient: baseUrl, partnerSlug, signingSecret required");
    }
    this.base = cfg.baseUrl.replace(/\/$/, "");
    this.slug = cfg.partnerSlug;
    this.secretBytes = /^[0-9a-fA-F]+$/.test(cfg.signingSecret)
      ? Buffer.from(cfg.signingSecret, "hex")
      : Buffer.from(cfg.signingSecret, "utf8");
    this.fetchImpl = cfg.fetchImpl ?? fetch;
    this.timeout = cfg.timeoutMs ?? 15_000;
  }

  async credit(input: CoverageCreditInput): Promise<CoverageCreditResult> {
    const body = JSON.stringify({
      partnerSlug: this.slug,
      anonToken: input.anonToken,
      partnerEventId: input.partnerEventId,
      durationSeconds: input.durationSeconds,
      modality: input.modality,
      brainRegion: input.brainRegion,
      competencyIds: input.competencyIds,
      occurredAt: input.occurredAt,
    });
    const ts = Date.now().toString();
    const sig = createHmac("sha256", this.secretBytes).update(`${ts}.${body}`).digest("hex");

    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), this.timeout);
    try {
      const r = await this.fetchImpl(`${this.base}/coverage/credit`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-neurospark-signature": sig,
          "x-neurospark-timestamp": ts,
        },
        body,
        signal: ctl.signal,
      });
      const text = await r.text();
      if (!r.ok) throw new CoverageError(`coverage credit failed: ${r.status}`, r.status, text);
      return JSON.parse(text) as CoverageCreditResult;
    } finally {
      clearTimeout(t);
    }
  }
}
