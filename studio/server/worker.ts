import { QUEUE_DRAFT, QUEUE_RENDER, getBoss } from "./queue.js";
import { loadJob, saveJob } from "./store.js";
import { draftScript } from "./pipeline/script.js";
import { generateSceneImages } from "./pipeline/image.js";
import { generateSceneClips } from "./pipeline/video.js";
import { generateVoiceover } from "./pipeline/audio.js";
import { renderJobVideo } from "./pipeline/render.js";
import { checkImageSafety } from "./pipeline/safety.js";

async function runDraft({ id }: { id: string }) {
  const job = await loadJob(id);
  if (!job) return;
  job.status = "scripting";
  await saveJob(job);
  try {
    const drafted = await draftScript({
      template: job.template,
      brief: job.brief,
      durationSec: job.durationSec,
    });
    job.title = drafted.title;
    job.subtitle = drafted.subtitle;
    job.scenes = drafted.scenes;
    job.status = "awaiting_approval";
    await saveJob(job);
  } catch (err) {
    job.status = "failed";
    job.error = (err as Error).message;
    await saveJob(job);
  }
}

async function runRender({ id }: { id: string }) {
  const job = await loadJob(id);
  if (!job) return;
  try {
    job.status = "generating_assets";
    await saveJob(job);

    const imgRes = await generateSceneImages({
      jobId: job.id,
      template: job.template,
      scenes: job.scenes,
    });
    job.scenes = imgRes.scenes;
    job.costUSD += imgRes.totalCostUSD;

    const safety = await checkImageSafety(
      job.scenes.map((s) => s.imageUrl).filter((u): u is string => Boolean(u)),
    );
    if (!safety.ok) throw new Error(`brand-safety failed: ${safety.flagged.join(",")}`);

    if (job.scenes.some((s) => s.useVideoClip)) {
      const vid = await generateSceneClips({ jobId: job.id, scenes: job.scenes });
      job.scenes = vid.scenes;
      job.costUSD += vid.totalCostUSD;
    }

    const audio = await generateVoiceover({
      jobId: job.id,
      scenes: job.scenes,
      voice: job.voice,
    });
    job.scenes = audio.scenes;
    job.voiceoverUrl = audio.voiceoverUrl;

    job.status = "rendering";
    await saveJob(job);

    const render = await renderJobVideo({
      jobId: job.id,
      template: job.template,
      inputProps: {
        title: job.title ?? "",
        subtitle: job.subtitle,
        scenes: job.scenes.map((s) => ({
          duration: s.durationSec,
          imageUrl: s.imageUrl,
          videoUrl: s.videoUrl,
          words: s.words,
          motion: s.motion,
        })),
        voiceoverUrl: job.voiceoverUrl,
        endCta: undefined,
        variant: job.variant,
      },
    });
    job.mp4Url = render.mp4Url;
    job.thumbnailUrl = render.thumbnailUrl;
    job.status = "completed";
    await saveJob(job);
  } catch (err) {
    job.status = "failed";
    job.error = (err as Error).message;
    await saveJob(job);
  }
}

export async function startWorker() {
  const boss = await getBoss();
  await boss.work(QUEUE_DRAFT, async (jobs) => {
    for (const j of Array.isArray(jobs) ? jobs : [jobs]) await runDraft(j.data as { id: string });
  });
  await boss.work(QUEUE_RENDER, async (jobs) => {
    for (const j of Array.isArray(jobs) ? jobs : [jobs]) await runRender(j.data as { id: string });
  });
  console.log("[studio worker] subscribed to queues");
}
