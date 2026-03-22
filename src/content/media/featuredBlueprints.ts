import { ACTIVITIES } from "../../app/data/activities";
import { buildMediaPromptPacket } from "./orchestration";

const FEATURED_ACTIVITY_IDS = ["a26", "a27", "a28", "a29"];

export const FEATURED_MEDIA_BLUEPRINTS = FEATURED_ACTIVITY_IDS.flatMap((id) => {
  const activity = ACTIVITIES.find((item) => item.id === id);
  if (!activity) return [];
  return [
    buildMediaPromptPacket(activity, "image"),
    buildMediaPromptPacket(activity, "audio"),
    buildMediaPromptPacket(activity, "video"),
  ];
});
