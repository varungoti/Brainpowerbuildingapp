import { describe, expect, it } from "vitest";
import { feedPostRowToPost, type FeedPostRow } from "./feedPosts";

describe("feedPostRowToPost", () => {
  it("maps a valid row", () => {
    const row: FeedPostRow = {
      id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      community_id: "default",
      channel: "ai_news",
      title: "T",
      body: "B",
      author_user_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12",
      author_email: "a@b.com",
      author_display_name: "A",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-02T00:00:00.000Z",
    };
    const p = feedPostRowToPost(row);
    expect(p).toEqual({
      id: row.id,
      communityId: "default",
      channel: "ai_news",
      title: "T",
      body: "B",
      authorUserId: row.author_user_id,
      authorEmail: "a@b.com",
      authorDisplayName: "A",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  });

  it("returns null for unknown channel", () => {
    const row = {
      id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      community_id: "default",
      channel: "bogus",
      title: "T",
      body: "B",
      author_user_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12",
      author_email: "a@b.com",
      author_display_name: "A",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-02T00:00:00.000Z",
    } as FeedPostRow;
    expect(feedPostRowToPost(row)).toBeNull();
  });
});
