/**
 * Who can edit or delete a feed post (client-side checks; pair with server RLS when you add a backend).
 *
 * Roles:
 * - Superadmin: VITE_SUPERADMIN_EMAILS, or if unset, same allowlist as VITE_ADMIN_EMAILS (Blueprint admins).
 * - Community admin: VITE_COMMUNITY_ADMIN_EMAILS (comma-separated).
 * - Author: same user id + email as stored on the post.
 */
import { parseAdminEmails } from "./adminAccess";
import type { FeedPost } from "@/app/data/feedTypes";

export function parseEmailSet(raw: string | undefined): Set<string> {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

/** Superadmins for moderation; defaults to blueprint admin list when VITE_SUPERADMIN_EMAILS is empty. */
export function parseSuperAdminEmails(): Set<string> {
  const explicit = import.meta.env.VITE_SUPERADMIN_EMAILS?.trim();
  if (explicit) return parseEmailSet(explicit);
  return parseAdminEmails();
}

export function parseCommunityAdminEmails(): Set<string> {
  return parseEmailSet(import.meta.env.VITE_COMMUNITY_ADMIN_EMAILS);
}

export type FeedUserRef = { id: string; email?: string } | null | undefined;

export function isSuperAdminForFeeds(user: FeedUserRef): boolean {
  if (import.meta.env.VITE_FEED_MODERATION_DEV_OPEN === "true" && import.meta.env.DEV) {
    return true;
  }
  const email = user?.email?.trim().toLowerCase();
  if (!email) return false;
  return parseSuperAdminEmails().has(email);
}

export function isCommunityAdminForFeeds(user: FeedUserRef): boolean {
  const email = user?.email?.trim().toLowerCase();
  if (!email) return false;
  return parseCommunityAdminEmails().has(email);
}

export function isAuthorOfFeedPost(user: FeedUserRef, post: FeedPost): boolean {
  if (!user?.id || !user?.email) return false;
  return (
    post.authorUserId === user.id &&
    post.authorEmail.trim().toLowerCase() === user.email.trim().toLowerCase()
  );
}

export function canModifyFeedPost(user: FeedUserRef, post: FeedPost): boolean {
  if (!user?.email) return false;
  if (isSuperAdminForFeeds(user)) return true;
  if (isCommunityAdminForFeeds(user)) return true;
  return isAuthorOfFeedPost(user, post);
}
