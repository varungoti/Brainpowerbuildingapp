import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { FeedChannel, FeedPost } from "@/app/data/feedTypes";
import { DEFAULT_COMMUNITY_ID } from "@/app/data/feedTypes";
import { saveFeedPosts, seedFeedPostsIfEmpty } from "@/utils/feedStorage";
import { canModifyFeedPost, type FeedUserRef } from "@/utils/feedPermissions";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";
import {
  buildRemoteFeedPost,
  deleteFeedPostRemote,
  insertFeedPost,
  listFeedPosts,
  subscribeFeedPosts,
  updateFeedPostRemote,
} from "@/utils/supabase/feedPosts";
import { useApp } from "./AppContext";

type Ctx = {
  posts: FeedPost[];
  /** True while loading remote posts (first fetch). */
  remoteLoading: boolean;
  canModify: (post: FeedPost) => boolean;
  addPost: (input: { channel: FeedChannel; title: string; body: string }) => FeedPost | null;
  updatePost: (id: string, input: { channel: FeedChannel; title: string; body: string }) => boolean;
  deletePost: (id: string) => boolean;
};

const FeedCtx = createContext<Ctx | null>(null);

export function FeedProvider({ children }: { children: ReactNode }) {
  const { user } = useApp();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [remoteLoading, setRemoteLoading] = useState(false);

  const persistLocal = useCallback((updater: (prev: FeedPost[]) => FeedPost[]) => {
    setPosts((prev) => {
      const next = updater(prev);
      saveFeedPosts(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!user) {
      setPosts([]);
      setRemoteLoading(false);
      return;
    }

    const client = getSupabaseBrowserClient();
    const remote = !!(client && user.supabaseUid);
    let cancelled = false;
    let firstRemoteDone = false;

    if (remote) {
      setRemoteLoading(true);
      const refetch = async () => {
        try {
          const list = await listFeedPosts(client!);
          if (!cancelled) setPosts(list);
        } catch (e) {
          console.error("[feeds] remote list failed", e);
          if (!cancelled) setPosts([]);
        } finally {
          if (!cancelled && !firstRemoteDone) {
            firstRemoteDone = true;
            setRemoteLoading(false);
          }
        }
      };

      void refetch();
      const unsub = subscribeFeedPosts(client!, () => void refetch());
      return () => {
        cancelled = true;
        unsub();
      };
    }

    setRemoteLoading(false);
    setPosts(seedFeedPostsIfEmpty());
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.supabaseUid]);

  const userRef: FeedUserRef = user;

  const canModify = useCallback(
    (post: FeedPost) => canModifyFeedPost(userRef, post),
    [userRef],
  );

  const addPost = useCallback(
    (input: { channel: FeedChannel; title: string; body: string }): FeedPost | null => {
      if (!user?.id || !user.email) return null;
      const title = input.title.trim();
      const body = input.body.trim();
      if (!title || !body) return null;

      const client = getSupabaseBrowserClient();
      const remote = !!(client && user.supabaseUid);

      if (remote && client && user.supabaseUid) {
        const post = buildRemoteFeedPost({
          id: crypto.randomUUID(),
          channel: input.channel,
          title,
          body,
          authorUserId: user.supabaseUid,
          authorEmail: user.email.trim(),
          authorDisplayName: user.name?.trim() || user.email,
        });
        setPosts((prev) => [post, ...prev]);
        void (async () => {
          try {
            await insertFeedPost(client, post);
            const list = await listFeedPosts(client);
            setPosts(list);
          } catch (e) {
            console.error("[feeds] remote insert failed", e);
            setPosts((prev) => prev.filter((p) => p.id !== post.id));
          }
        })();
        return post;
      }

      const now = new Date().toISOString();
      const post: FeedPost = {
        id: crypto.randomUUID(),
        communityId: DEFAULT_COMMUNITY_ID,
        channel: input.channel,
        title,
        body,
        authorUserId: user.id,
        authorEmail: user.email.trim(),
        authorDisplayName: user.name?.trim() || user.email,
        createdAt: now,
        updatedAt: now,
      };
      persistLocal((prev) => [post, ...prev]);
      return post;
    },
    [user, persistLocal],
  );

  const updatePost = useCallback(
    (id: string, input: { channel: FeedChannel; title: string; body: string }): boolean => {
      const title = input.title.trim();
      const body = input.body.trim();
      if (!title || !body) return false;

      const client = getSupabaseBrowserClient();
      const remote = !!(client && user?.supabaseUid);

      if (remote && client) {
        const target = posts.find((p) => p.id === id);
        if (!target || !canModifyFeedPost(userRef, target)) return false;
        const now = new Date().toISOString();
        const optimistic = {
          ...target,
          channel: input.channel,
          title,
          body,
          updatedAt: now,
        };
        setPosts((prev) => prev.map((p) => (p.id === id ? optimistic : p)));
        void (async () => {
          try {
            await updateFeedPostRemote(client, id, input);
            const list = await listFeedPosts(client);
            setPosts(list);
          } catch (e) {
            console.error("[feeds] remote update failed", e);
            try {
              const list = await listFeedPosts(client);
              setPosts(list);
            } catch {
              setPosts((prev) => prev.map((p) => (p.id === id ? target : p)));
            }
          }
        })();
        return true;
      }

      let ok = false;
      persistLocal((prev) => {
        const post = prev.find((p) => p.id === id);
        if (!post || !canModifyFeedPost(userRef, post)) return prev;
        ok = true;
        const now = new Date().toISOString();
        return prev.map((p) =>
          p.id === id ? { ...p, channel: input.channel, title, body, updatedAt: now } : p,
        );
      });
      return ok;
    },
    [posts, userRef, persistLocal, user?.supabaseUid],
  );

  const deletePost = useCallback(
    (id: string): boolean => {
      const client = getSupabaseBrowserClient();
      const remote = !!(client && user?.supabaseUid);

      if (remote && client) {
        const target = posts.find((p) => p.id === id);
        if (!target || !canModifyFeedPost(userRef, target)) return false;
        setPosts((prev) => prev.filter((p) => p.id !== id));
        void (async () => {
          try {
            await deleteFeedPostRemote(client, id);
            const list = await listFeedPosts(client);
            setPosts(list);
          } catch (e) {
            console.error("[feeds] remote delete failed", e);
            try {
              const list = await listFeedPosts(client);
              setPosts(list);
            } catch {
              setPosts((prev) => {
                const has = prev.some((p) => p.id === id);
                if (has) return prev;
                return [target, ...prev].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
              });
            }
          }
        })();
        return true;
      }

      let ok = false;
      persistLocal((prev) => {
        const post = prev.find((p) => p.id === id);
        if (!post || !canModifyFeedPost(userRef, post)) return prev;
        ok = true;
        return prev.filter((p) => p.id !== id);
      });
      return ok;
    },
    [posts, userRef, persistLocal, user?.supabaseUid],
  );

  const value = useMemo(
    () => ({ posts, remoteLoading, canModify, addPost, updatePost, deletePost }),
    [posts, remoteLoading, canModify, addPost, updatePost, deletePost],
  );

  return <FeedCtx.Provider value={value}>{children}</FeedCtx.Provider>;
}

export function useFeeds(): Ctx {
  const c = useContext(FeedCtx);
  if (!c) throw new Error("useFeeds must be used inside FeedProvider");
  return c;
}
