import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import type { CompositionProps } from "../../src/compositions/schema.js";
import type { TemplateId } from "../types.js";
import { uploadAsset } from "../store.js";

const BUCKET = process.env.STUDIO_STORAGE_BUCKET ?? "studio";

let bundleCache: string | null = null;
async function getBundle(): Promise<string> {
  if (bundleCache) return bundleCache;
  const entry = path.resolve(process.cwd(), "src/index.ts");
  bundleCache = await bundle({ entryPoint: entry });
  return bundleCache;
}

export async function renderJobVideo(opts: {
  jobId: string;
  template: TemplateId;
  inputProps: CompositionProps;
}): Promise<{ mp4Url: string; thumbnailUrl: string }> {
  const serveUrl = await getBundle();
  const composition = await selectComposition({
    serveUrl,
    id: opts.template,
    inputProps: opts.inputProps,
  });
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "ns-studio-"));
  const outMp4 = path.join(tmp, `${opts.jobId}.mp4`);
  const outThumb = path.join(tmp, `${opts.jobId}.jpg`);

  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: outMp4,
    inputProps: opts.inputProps,
    audioBitrate: "192k",
    crf: 20,
    chromiumOptions: { gl: "angle" },
  });
  await renderStill({
    composition,
    serveUrl,
    output: outThumb,
    inputProps: opts.inputProps,
    frame: Math.floor(composition.durationInFrames / 2),
  });

  const mp4Buf = await fs.readFile(outMp4);
  const thumbBuf = await fs.readFile(outThumb);
  const mp4Url = await uploadAsset(BUCKET, `${opts.jobId}/video.mp4`, mp4Buf, "video/mp4");
  const thumbUrl = await uploadAsset(BUCKET, `${opts.jobId}/thumb.jpg`, thumbBuf, "image/jpeg");
  await fs.rm(tmp, { recursive: true, force: true });
  return { mp4Url, thumbnailUrl: thumbUrl };
}
