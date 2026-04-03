/** Community feed channels (all include optional AI-curated / news style content). */
export type FeedChannel = "general" | "ai_news" | "parent_tips" | "announcements";

export const FEED_CHANNELS: { id: FeedChannel; label: string; emoji: string; hint: string }[] = [
  { id: "general", label: "General", emoji: "💬", hint: "Community discussion" },
  { id: "ai_news", label: "AI news", emoji: "🤖", hint: "AI & learning technology updates" },
  { id: "parent_tips", label: "Parent tips", emoji: "🌟", hint: "Short tips and wins" },
  { id: "announcements", label: "Announcements", emoji: "📣", hint: "Official notices" },
];

export interface FeedPost {
  id: string;
  communityId: string;
  channel: FeedChannel;
  title: string;
  body: string;
  authorUserId: string;
  authorEmail: string;
  authorDisplayName: string;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_COMMUNITY_ID = "default";
