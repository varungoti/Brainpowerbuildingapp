import { describe, expect, it, vi, afterEach } from "vitest";
import {
  canModifyFeedPost,
  isAuthorOfFeedPost,
  parseCommunityAdminEmails,
} from "./feedPermissions";
import type { FeedPost } from "@/app/data/feedTypes";

const post: FeedPost = {
  id: "1",
  communityId: "default",
  channel: "general",
  title: "T",
  body: "B",
  authorUserId: "u1",
  authorEmail: "author@example.com",
  authorDisplayName: "Author",
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
};

describe("feedPermissions", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("author can modify own post", () => {
    expect(
      canModifyFeedPost({ id: "u1", email: "author@example.com" }, post),
    ).toBe(true);
  });

  it("wrong id blocks author email spoof", () => {
    expect(
      canModifyFeedPost({ id: "u2", email: "author@example.com" }, post),
    ).toBe(false);
  });

  it("community admin can modify any post when email allowlisted", () => {
    vi.stubEnv("VITE_COMMUNITY_ADMIN_EMAILS", "mod@example.com");
    vi.stubEnv("VITE_ADMIN_EMAILS", "");
    vi.stubEnv("VITE_SUPERADMIN_EMAILS", "");
    expect(canModifyFeedPost({ id: "x", email: "mod@example.com" }, post)).toBe(true);
  });

  it("isAuthorOfFeedPost requires both id and email", () => {
    expect(isAuthorOfFeedPost({ id: "u1", email: "author@example.com" }, post)).toBe(true);
    expect(isAuthorOfFeedPost({ id: "u1", email: "other@example.com" }, post)).toBe(false);
  });

  it("parseCommunityAdminEmails splits list", () => {
    vi.stubEnv("VITE_COMMUNITY_ADMIN_EMAILS", "a@x.com, B@x.com");
    const s = parseCommunityAdminEmails();
    expect(s.has("a@x.com")).toBe(true);
    expect(s.has("b@x.com")).toBe(true);
  });
});
