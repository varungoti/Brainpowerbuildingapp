import type { ImageResult, ImageSpec, Provider } from "../types.js";

const PEXELS = process.env.PEXELS_API_KEY;
const UNSPLASH = process.env.UNSPLASH_ACCESS_KEY;
const PIXABAY = process.env.PIXABAY_API_KEY;

export const pexels: Provider = {
  id: "pexels",
  enabled: () => Boolean(PEXELS),
  estCost: () => 0,
  async generate(spec: ImageSpec): Promise<ImageResult> {
    if (!PEXELS) throw new Error("PEXELS_API_KEY not set");
    const t0 = Date.now();
    const orient =
      spec.aspect === "9:16" ? "portrait" : spec.aspect === "16:9" ? "landscape" : "square";
    const res = await fetch(
      `https://api.pexels.com/v1/search?per_page=1&orientation=${orient}&query=${encodeURIComponent(spec.prompt)}`,
      { headers: { Authorization: PEXELS } },
    );
    if (!res.ok) throw new Error(`Pexels ${res.status}`);
    const j = (await res.json()) as {
      photos: Array<{ src: { large2x: string }; width: number; height: number }>;
    };
    const p = j.photos[0];
    if (!p) throw new Error("Pexels: no results");
    return {
      url: p.src.large2x,
      provider: "pexels",
      costUSD: 0,
      latencyMs: Date.now() - t0,
      width: p.width,
      height: p.height,
    };
  },
};

export const unsplash: Provider = {
  id: "unsplash",
  enabled: () => Boolean(UNSPLASH),
  estCost: () => 0,
  async generate(spec: ImageSpec): Promise<ImageResult> {
    if (!UNSPLASH) throw new Error("UNSPLASH_ACCESS_KEY not set");
    const t0 = Date.now();
    const orient =
      spec.aspect === "9:16" ? "portrait" : spec.aspect === "16:9" ? "landscape" : "squarish";
    const res = await fetch(
      `https://api.unsplash.com/search/photos?per_page=1&orientation=${orient}&query=${encodeURIComponent(spec.prompt)}`,
      { headers: { Authorization: `Client-ID ${UNSPLASH}` } },
    );
    if (!res.ok) throw new Error(`Unsplash ${res.status}`);
    const j = (await res.json()) as {
      results: Array<{ urls: { regular: string }; width: number; height: number }>;
    };
    const p = j.results[0];
    if (!p) throw new Error("Unsplash: no results");
    return {
      url: p.urls.regular,
      provider: "unsplash",
      costUSD: 0,
      latencyMs: Date.now() - t0,
      width: p.width,
      height: p.height,
    };
  },
};

export const pixabay: Provider = {
  id: "pixabay",
  enabled: () => Boolean(PIXABAY),
  estCost: () => 0,
  async generate(spec: ImageSpec): Promise<ImageResult> {
    if (!PIXABAY) throw new Error("PIXABAY_API_KEY not set");
    const t0 = Date.now();
    const orient =
      spec.aspect === "9:16" ? "vertical" : spec.aspect === "16:9" ? "horizontal" : "all";
    const res = await fetch(
      `https://pixabay.com/api/?key=${PIXABAY}&per_page=3&orientation=${orient}&q=${encodeURIComponent(spec.prompt)}`,
    );
    if (!res.ok) throw new Error(`Pixabay ${res.status}`);
    const j = (await res.json()) as {
      hits: Array<{ largeImageURL: string; imageWidth: number; imageHeight: number }>;
    };
    const p = j.hits[0];
    if (!p) throw new Error("Pixabay: no results");
    return {
      url: p.largeImageURL,
      provider: "pixabay",
      costUSD: 0,
      latencyMs: Date.now() - t0,
      width: p.imageWidth,
      height: p.imageHeight,
    };
  },
};
