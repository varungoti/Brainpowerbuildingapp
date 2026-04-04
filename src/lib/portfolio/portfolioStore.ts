import type { PortfolioEntry } from "../../app/context/AppContext";

export function inferDevelopmentalStage(ageTier: number): PortfolioEntry["stage"] {
  if (ageTier <= 1) return "sensorimotor";
  if (ageTier <= 3) return "preoperational";
  if (ageTier <= 5) return "concrete-operational";
  return "formal-operational";
}

export function autoTagCreation(
  intelligences: string[],
  activityRegion?: string,
): string[] {
  const tags: string[] = [...intelligences];
  if (activityRegion) tags.push(activityRegion);
  return [...new Set(tags)];
}

export async function compressImageDataUrl(
  dataUrl: string,
  maxWidth = 800,
  quality = 0.7,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("No 2d context")); return; }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/webp", quality));
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataUrl;
  });
}

export function filterByChild(entries: PortfolioEntry[], childId: string): PortfolioEntry[] {
  return entries.filter(e => e.childId === childId);
}

export function filterByTag(entries: PortfolioEntry[], tag: string): PortfolioEntry[] {
  return entries.filter(e => e.tags.includes(tag) || e.intelligences.includes(tag));
}
