/**
 * UTM / ns_source attribution capture.
 *
 * Captures first-touch UTM params from the URL on app boot and persists them
 * in localStorage so every analytics event can attribute the eventual signup,
 * purchase, or activity completion to the campaign that brought the user in.
 *
 * Supports BOTH `utm_*` (industry standard) and our internal `ns_*` aliases
 * so n8n workflows can override Buffer's automatic UTM stripping.
 *
 *   ?utm_source=instagram_reel&utm_medium=short&utm_campaign=daily_shorts
 *   ?ns_source=BrainStoryShort&ns_medium=video&ns_campaign=daily_shorts
 */
const KEY_FIRST = "neurospark.attribution.first";
const KEY_LAST = "neurospark.attribution.last";

export interface Attribution {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  /** ISO 8601 first time we saw this attribution */
  ts: string;
  /** Original entry URL (path + query, no fragment) */
  url?: string;
}

function readUrlAttribution(href: string | undefined): Attribution | null {
  if (!href) return null;
  try {
    const url = new URL(href);
    const get = (k: string) => url.searchParams.get(`utm_${k}`) || url.searchParams.get(`ns_${k}`);
    const source = get("source");
    const medium = get("medium");
    const campaign = get("campaign");
    const content = get("content");
    const term = get("term");
    if (!source && !medium && !campaign && !content && !term) return null;
    return {
      source: source ?? undefined,
      medium: medium ?? undefined,
      campaign: campaign ?? undefined,
      content: content ?? undefined,
      term: term ?? undefined,
      ts: new Date().toISOString(),
      url: url.pathname + url.search,
    };
  } catch {
    return null;
  }
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Read attribution from URL once on boot, store first-touch (only if not yet
 * recorded) AND always overwrite last-touch. Idempotent; safe to call many
 * times.
 */
export function captureAttributionFromUrl(href = typeof window !== "undefined" ? window.location.href : undefined): {
  first: Attribution | null;
  last: Attribution | null;
} {
  const fromUrl = readUrlAttribution(href);
  if (typeof window === "undefined") {
    return { first: null, last: fromUrl };
  }
  if (fromUrl) {
    const existingFirst = safeParse<Attribution>(window.localStorage.getItem(KEY_FIRST));
    if (!existingFirst) {
      try {
        window.localStorage.setItem(KEY_FIRST, JSON.stringify(fromUrl));
      } catch {
        /* private mode */
      }
    }
    try {
      window.localStorage.setItem(KEY_LAST, JSON.stringify(fromUrl));
    } catch {
      /* private mode */
    }
  }
  return {
    first: safeParse<Attribution>(window.localStorage.getItem(KEY_FIRST)),
    last: safeParse<Attribution>(window.localStorage.getItem(KEY_LAST)),
  };
}

/**
 * Returns first-touch attribution (the campaign that brought the user in).
 * Returns null if the user came in organically (no UTM params) and we never
 * saw any.
 */
export function getFirstTouchAttribution(): Attribution | null {
  if (typeof window === "undefined") return null;
  return safeParse<Attribution>(window.localStorage.getItem(KEY_FIRST));
}

export function getLastTouchAttribution(): Attribution | null {
  if (typeof window === "undefined") return null;
  return safeParse<Attribution>(window.localStorage.getItem(KEY_LAST));
}

/** Test helper. */
export function __resetAttributionForTests(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY_FIRST);
  window.localStorage.removeItem(KEY_LAST);
}
