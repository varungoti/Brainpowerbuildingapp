import type { Provider, ProviderId } from "../types.js";
import { ideogram } from "./ideogram.js";
import { fluxPro, fluxSchnellSelf } from "./flux.js";
import { recraft } from "./recraft.js";
import { openaiGptImage } from "./openai.js";
import { googleImagen4 } from "./google.js";
import { stabilitySD35 } from "./stability.js";
import { leonardo } from "./leonardo.js";
import { midjourney } from "./midjourney.js";
import { replicate } from "./replicate.js";
import { fal } from "./fal.js";
import { together } from "./together.js";
import { sdxlSelf, comfySelf } from "./selfHosted.js";
import { pexels, unsplash, pixabay } from "./stock.js";

export const ALL_PROVIDERS: Provider[] = [
  ideogram,
  fluxPro,
  fluxSchnellSelf,
  recraft,
  openaiGptImage,
  googleImagen4,
  stabilitySD35,
  leonardo,
  midjourney,
  replicate,
  fal,
  together,
  sdxlSelf,
  comfySelf,
  pexels,
  unsplash,
  pixabay,
];

const map = new Map<ProviderId, Provider>(ALL_PROVIDERS.map((p) => [p.id, p]));

export function getProvider(id: ProviderId): Provider | undefined {
  return map.get(id);
}

export function enabledProviders(): Provider[] {
  return ALL_PROVIDERS.filter((p) => p.enabled());
}

/** Smart router: pick the best provider given the spec hints. */
export function routeProvider(spec: {
  textInImage?: boolean;
  brandConsistency?: "high" | "low";
  preferStock?: boolean;
}): Provider {
  const enabled = enabledProviders();
  if (enabled.length === 0) throw new Error("No image providers configured");

  const pick = (id: ProviderId): Provider | undefined =>
    enabled.find((p) => p.id === id);

  if (spec.preferStock) {
    return pick("pexels") ?? pick("unsplash") ?? pick("pixabay") ?? enabled[0];
  }
  if (spec.brandConsistency === "high") {
    return pick("sdxl_self") ?? pick("comfy_self") ?? pick("flux_pro") ?? enabled[0];
  }
  if (spec.textInImage) {
    return pick("ideogram") ?? pick("recraft") ?? pick("google_imagen4") ?? enabled[0];
  }
  return (
    pick(process.env.DEFAULT_PROVIDER as ProviderId) ??
    pick("flux_pro") ??
    pick("ideogram") ??
    enabled[0]
  );
}
