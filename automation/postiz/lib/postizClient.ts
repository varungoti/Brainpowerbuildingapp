/**
 * Thin TypeScript client for the Postiz REST API.
 *
 * Used by:
 *   - studio orchestrator (one-click "publish" from a finished job)
 *   - admin server proxy (audit-logged passthrough lives in supabase/functions/server/admin.tsx)
 *   - any future Node service that needs to fan a post out to social channels
 *
 * It deliberately depends on nothing but the platform `fetch` (Node 18+ / Deno / Bun).
 * Drop this file into any Node service or copy-paste into a Deno edge function.
 *
 * Env vars consumed:
 *   POSTIZ_BASE_URL    e.g. http://postiz-api:3000
 *   POSTIZ_API_KEY     issued from Postiz UI > Settings > API
 *
 * Channel UUIDs are NOT read from env here — pass them in. The n8n workflows
 * read them from POSTIZ_CHANNEL_<PROVIDER> env vars (see automation/n8n/.env.example).
 */

export type PostizProvider =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "x"
  | "linkedin"
  | "bluesky"
  | "threads"
  | "mastodon"
  | "reddit"
  | "pinterest"
  | "medium"
  | "devto"
  | "hashnode"
  | "telegram"
  | "discord";

export interface PostizMedia {
  /** any stable id; Postiz only needs uniqueness within the request */
  id: string;
  /** publicly-fetchable URL — Postiz pulls media from this URL */
  path: string;
}

export interface PostizSinglePost {
  /** Postiz "integration" UUID for the channel (find in Postiz UI URL after connecting) */
  channelId: string;
  /** Provider name; controls default settings */
  provider: PostizProvider;
  /** Caption / body text */
  content: string;
  /** Media URL list (Postiz fetches them server-side) */
  mediaUrls?: string[];
  /** Provider-specific overrides merged on top of sensible defaults */
  settingsOverride?: Record<string, unknown>;
}

export interface PostizCreateOptions {
  /** When omitted, posts immediately. Otherwise an ISO 8601 timestamp. */
  scheduleAt?: string;
  tags?: string[];
  /** When true, Postiz wraps URLs in its short-link service (requires plan) */
  shortLink?: boolean;
}

export interface PostizCreateResponse {
  /** Postiz returns one entry per channel */
  posts: Array<{ id: string; channelId: string; status: string }>;
}

export interface PostizIntegration {
  id: string;
  name?: string;
  providerIdentifier?: string;
  picture?: string;
  type?: string;
  disabled?: boolean;
}

export interface PostizClientConfig {
  baseUrl?: string;
  apiKey?: string;
  /** Optional override (e.g. Node 18 "undici" instead of global fetch) */
  fetchImpl?: typeof fetch;
  /** Default per-request timeout in ms (default: 30_000) */
  timeoutMs?: number;
}

/** Default provider settings — same set as automation/n8n/workflows/lib/postiz_publish.json. */
const PROVIDER_DEFAULTS: Record<PostizProvider, Record<string, unknown>> = {
  instagram: { __type: "instagram", post_type: "reel" },
  tiktok: {
    __type: "tiktok",
    privacy_level: "PUBLIC_TO_EVERYONE",
    autoAddMusic: true,
    content_posting_method: "DIRECT_POST",
  },
  youtube: { __type: "youtube", type: "short", selfDeclaredMadeForKids: false },
  x: { __type: "x", who_can_reply_post: "everyone" },
  linkedin: { __type: "linkedin" },
  bluesky: { __type: "bluesky" },
  threads: { __type: "threads" },
  mastodon: { __type: "mastodon" },
  reddit: { __type: "reddit", subreddit: [] },
  pinterest: { __type: "pinterest" },
  medium: { __type: "medium" },
  devto: { __type: "devto" },
  hashnode: { __type: "hashnode" },
  telegram: { __type: "telegram" },
  discord: { __type: "discord" },
};

export class PostizError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: string,
  ) {
    super(message);
    this.name = "PostizError";
  }
}

export class PostizClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(config: PostizClientConfig = {}) {
    const baseUrl = config.baseUrl ?? process.env.POSTIZ_BASE_URL;
    const apiKey = config.apiKey ?? process.env.POSTIZ_API_KEY;
    if (!baseUrl) throw new Error("PostizClient: POSTIZ_BASE_URL is required");
    if (!apiKey) throw new Error("PostizClient: POSTIZ_API_KEY is required");
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.apiKey = apiKey;
    this.fetchImpl = config.fetchImpl ?? fetch;
    this.timeoutMs = config.timeoutMs ?? 30_000;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), this.timeoutMs);
    try {
      const res = await this.fetchImpl(`${this.baseUrl}/public/v1${path}`, {
        method,
        headers: {
          Authorization: this.apiKey,
          "content-type": "application/json",
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: ctl.signal,
      });
      const text = await res.text();
      if (!res.ok) {
        throw new PostizError(
          `Postiz ${method} ${path} failed: ${res.status} ${res.statusText}`,
          res.status,
          text,
        );
      }
      return text ? (JSON.parse(text) as T) : (undefined as T);
    } finally {
      clearTimeout(t);
    }
  }

  /** Liveness — also useful as a "is the API key valid" check. */
  async checkConnection(): Promise<boolean> {
    try {
      await this.request("GET", "/integrations/check-connection");
      return true;
    } catch {
      return false;
    }
  }

  /** All connected channels for the current org. */
  async listIntegrations(): Promise<PostizIntegration[]> {
    return (await this.request<PostizIntegration[]>("GET", "/integrations")) ?? [];
  }

  /**
   * Fan a single piece of content out to N channels in one call.
   * Postiz handles per-platform queuing + rate limits internally.
   */
  async createPosts(
    posts: PostizSinglePost[],
    options: PostizCreateOptions = {},
  ): Promise<PostizCreateResponse> {
    if (!posts.length) throw new Error("PostizClient.createPosts: posts[] is required");
    const payload = {
      type: options.scheduleAt ? "schedule" : "now",
      date: options.scheduleAt ?? new Date().toISOString(),
      shortLink: !!options.shortLink,
      tags: options.tags ?? [],
      posts: posts.map((p) => ({
        integration: { id: p.channelId },
        value: [
          {
            content: p.content,
            image: (p.mediaUrls ?? []).map((url, idx) => ({
              id: `media-${idx}`,
              path: url,
            })),
          },
        ],
        settings: { ...PROVIDER_DEFAULTS[p.provider], ...(p.settingsOverride ?? {}) },
      })),
    };
    return this.request<PostizCreateResponse>("POST", "/posts", payload);
  }

  /** Convenience: schedule the same caption across many channels at once. */
  async fanout(
    channels: Array<{ channelId: string; provider: PostizProvider; settingsOverride?: Record<string, unknown> }>,
    content: string,
    mediaUrls: string[] = [],
    options: PostizCreateOptions = {},
  ): Promise<PostizCreateResponse> {
    return this.createPosts(
      channels.map((c) => ({ ...c, content, mediaUrls })),
      options,
    );
  }

  /** Per-post analytics (Postiz aggregates platform metrics). */
  async getPostAnalytics(postId: string): Promise<unknown> {
    return this.request("GET", `/analytics/post/${encodeURIComponent(postId)}`);
  }

  async deletePost(postId: string): Promise<void> {
    await this.request("DELETE", `/posts/${encodeURIComponent(postId)}`);
  }
}

/** Lazy singleton — call once at module load if you only need one instance. */
let _default: PostizClient | null = null;
export function defaultPostizClient(): PostizClient {
  if (!_default) _default = new PostizClient();
  return _default;
}
