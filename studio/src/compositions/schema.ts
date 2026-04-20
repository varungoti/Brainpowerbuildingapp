import { z } from "zod";

export const wordTimingSchema = z.object({
  word: z.string(),
  startMs: z.number(),
  endMs: z.number(),
});

export const sceneSchema = z.object({
  duration: z.number().min(0.5).max(20),
  imageUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  words: z.array(wordTimingSchema).optional(),
  motion: z.enum(["in", "out", "pan-l", "pan-r", "pan-up", "pan-down"]).optional(),
});

export const compositionPropsSchema = z.object({
  title: z.string().default(""),
  subtitle: z.string().optional(),
  scenes: z.array(sceneSchema).default([]),
  voiceoverUrl: z.string().url().optional(),
  endCta: z.string().optional(),
  variant: z.enum(["light", "dark"]).default("light"),
});

export type CompositionProps = z.infer<typeof compositionPropsSchema>;
export type ScenePlanProps = z.infer<typeof sceneSchema>;
