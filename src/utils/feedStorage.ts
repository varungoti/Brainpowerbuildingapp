import type { FeedPost } from "@/app/data/feedTypes";
import { DEFAULT_COMMUNITY_ID } from "@/app/data/feedTypes";

const LS_KEY = "neurospark_feed_posts_v1";

interface StoredShape {
  version: 1;
  posts: FeedPost[];
}

export function loadFeedPosts(): FeedPost[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as StoredShape;
    if (data?.version !== 1 || !Array.isArray(data.posts)) return [];
    return data.posts.filter(isValidPost);
  } catch {
    return [];
  }
}

function isValidPost(p: unknown): p is FeedPost {
  if (!p || typeof p !== "object") return false;
  const x = p as FeedPost;
  return (
    typeof x.id === "string" &&
    typeof x.communityId === "string" &&
    typeof x.channel === "string" &&
    typeof x.title === "string" &&
    typeof x.body === "string" &&
    typeof x.authorUserId === "string" &&
    typeof x.authorEmail === "string" &&
    typeof x.authorDisplayName === "string" &&
    typeof x.createdAt === "string" &&
    typeof x.updatedAt === "string"
  );
}

export function saveFeedPosts(posts: FeedPost[]): void {
  try {
    const payload: StoredShape = { version: 1, posts };
    localStorage.setItem(LS_KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

/** Optional welcome posts when store is empty (local demo; remove in prod or replace with API). */
export function seedFeedPostsIfEmpty(): FeedPost[] {
  const existing = loadFeedPosts();
  if (existing.length > 0) return existing;
  const now = new Date().toISOString();
  const samples: FeedPost[] = [
    {
      id: "seed-welcome-1",
      communityId: DEFAULT_COMMUNITY_ID,
      channel: "announcements",
      title: "Welcome to community feeds",
      body: "Share tips, ask questions, and follow AI & education news in the tabs above. Only you, community admins, and superadmins can edit or delete posts you create.",
      authorUserId: "system",
      authorEmail: "community@neurospark.app",
      authorDisplayName: "NeuroSpark",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "seed-ai-1",
      communityId: DEFAULT_COMMUNITY_ID,
      channel: "ai_news",
      title: "How we use AI in NeuroSpark",
      body: "The AI Counselor gives research-style guidance — not medical advice. Activity picks use the on-device AGE algorithm. We never train public models on your child’s name from backups you keep local.",
      authorUserId: "system",
      authorEmail: "community@neurospark.app",
      authorDisplayName: "NeuroSpark",
      createdAt: now,
      updatedAt: now,
    },
  ];
  saveFeedPosts(samples);
  return samples;
}
