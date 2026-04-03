import type { SupabaseClient } from "@supabase/supabase-js";
import type { FeedChannel, FeedPost } from "@/app/data/feedTypes";
import { DEFAULT_COMMUNITY_ID } from "@/app/data/feedTypes";

const CHANNELS: FeedChannel[] = ["general", "ai_news", "parent_tips", "announcements"];

function isFeedChannel(x: string): x is FeedChannel {
  return (CHANNELS as string[]).includes(x);
}

export type FeedPostRow = {
  id: string;
  community_id: string;
  channel: string;
  title: string;
  body: string;
  author_user_id: string;
  author_email: string;
  author_display_name: string;
  created_at: string;
  updated_at: string;
};

export function feedPostRowToPost(row: FeedPostRow): FeedPost | null {
  if (!isFeedChannel(row.channel)) return null;
  return {
    id: row.id,
    communityId: row.community_id,
    channel: row.channel,
    title: row.title,
    body: row.body,
    authorUserId: row.author_user_id,
    authorEmail: row.author_email,
    authorDisplayName: row.author_display_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function postToInsertRow(post: FeedPost): Record<string, string> {
  return {
    id: post.id,
    community_id: post.communityId,
    channel: post.channel,
    title: post.title,
    body: post.body,
    author_user_id: post.authorUserId,
    author_email: post.authorEmail,
    author_display_name: post.authorDisplayName,
  };
}

function postToUpdateRow(input: { channel: FeedChannel; title: string; body: string }): Record<string, string> {
  return {
    channel: input.channel,
    title: input.title,
    body: input.body,
  };
}

export async function listFeedPosts(client: SupabaseClient): Promise<FeedPost[]> {
  const { data, error } = await client
    .from("feed_posts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as FeedPostRow[];
  return rows.map(feedPostRowToPost).filter((p): p is FeedPost => p !== null);
}

export async function insertFeedPost(client: SupabaseClient, post: FeedPost): Promise<void> {
  const { error } = await client.from("feed_posts").insert(postToInsertRow(post));
  if (error) throw error;
}

export async function updateFeedPostRemote(
  client: SupabaseClient,
  id: string,
  input: { channel: FeedChannel; title: string; body: string },
): Promise<void> {
  const { error } = await client.from("feed_posts").update(postToUpdateRow(input)).eq("id", id);
  if (error) throw error;
}

export async function deleteFeedPostRemote(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from("feed_posts").delete().eq("id", id);
  if (error) throw error;
}

/** Refetch after postgres_changes; debounced unsubscribe on cleanup. */
export function subscribeFeedPosts(client: SupabaseClient, onChange: () => void): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const schedule = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      onChange();
    }, 120);
  };
  const channel = client
    .channel("feed_posts_realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "feed_posts" },
      schedule,
    )
    .subscribe();
  return () => {
    if (timer) clearTimeout(timer);
    void client.removeChannel(channel);
  };
}

export function buildRemoteFeedPost(params: {
  id: string;
  channel: FeedChannel;
  title: string;
  body: string;
  authorUserId: string;
  authorEmail: string;
  authorDisplayName: string;
  nowIso?: string;
}): FeedPost {
  const now = params.nowIso ?? new Date().toISOString();
  return {
    id: params.id,
    communityId: DEFAULT_COMMUNITY_ID,
    channel: params.channel,
    title: params.title,
    body: params.body,
    authorUserId: params.authorUserId,
    authorEmail: params.authorEmail,
    authorDisplayName: params.authorDisplayName,
    createdAt: now,
    updatedAt: now,
  };
}
