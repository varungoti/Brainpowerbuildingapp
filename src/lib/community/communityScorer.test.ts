// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../utils/supabase/info", () => ({
  functionsBaseUrl: "https://test.supabase.co/functions/v1/make-server-76b0ba9a",
  isSupabaseConfigured: () => true,
  publicAnonKey: "anon-key-test",
}));

vi.mock("../../utils/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      getSession: async () => ({
        data: { session: { access_token: "user-jwt-test" } },
      }),
    },
  }),
}));

import { submitRating, fetchRatings } from "./communityScorer";

describe("communityScorer URL contract", () => {
  const fetchSpy = vi.fn();

  beforeEach(() => {
    fetchSpy.mockReset();
    (globalThis as unknown as { fetch: typeof fetch }).fetch =
      fetchSpy as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("submitRating posts to the /make-server-76b0ba9a/rate-activity endpoint with the user's JWT", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, avg: 4.2, count: 17 }),
    });

    const result = await submitRating("alpha-123", 5);

    expect(result).toEqual({ avg: 4.2, count: 17 });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://test.supabase.co/functions/v1/make-server-76b0ba9a/rate-activity",
    );
    expect(init?.method).toBe("POST");
    const headers = init?.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer user-jwt-test");
    expect(headers.apikey).toBe("anon-key-test");
    expect(JSON.parse(String(init?.body))).toEqual({
      activityId: "alpha-123",
      rating: 5,
    });
  });

  it("submitRating returns null on non-OK responses instead of throwing", async () => {
    fetchSpy.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) });
    expect(await submitRating("alpha-123", 5)).toBeNull();
  });

  it("fetchRatings uses the same base URL and filters out malformed ids", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        ratings: { "alpha-123": { avg: 3.3, count: 9 } },
      }),
    });

    const result = await fetchRatings([
      "alpha-123",
      "  bad id with spaces  ",
      "$$$",
    ]);

    expect(result).toEqual({ "alpha-123": { avg: 3.3, count: 9 } });
    const [url] = fetchSpy.mock.calls[0] as [string];
    expect(url).toMatch(
      /^https:\/\/test\.supabase\.co\/functions\/v1\/make-server-76b0ba9a\/activity-ratings\?ids=/,
    );
    expect(url).toContain("alpha-123");
    expect(url).not.toContain("$$$");
  });
});
