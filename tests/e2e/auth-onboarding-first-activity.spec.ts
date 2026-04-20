// ============================================================================
// FUTURE_ROADMAP §1.2.I — E2E coverage of the
//   auth_view → auth_submit_* → onboard_step_view × 4 → onboard_complete →
//   activity_open → first_activity_open → activity_complete (is_first_activity)
//   → first_activity_complete
// funnel.
// ----------------------------------------------------------------------------
// captureProductEvent dispatches a `neurospark:product_event` CustomEvent on
// every fire. The spec listens for those events via an exposed function and
// asserts the funnel order + key properties end-to-end against the production
// build (no mocked API).
// ============================================================================

import { test, expect, type Page } from "@playwright/test";

/**
 * Mirror of `ProductEventPayload`: the captured payload is flat — every prop
 * lives at the top level alongside `event` / `ts`.
 */
type CapturedEvent = Record<string, unknown> & { event: string };

async function attachEventBus(page: Page, sink: CapturedEvent[]) {
  await page.exposeFunction(
    "__nsCaptureEventForTest",
    (payload: CapturedEvent) => {
      sink.push(payload);
    },
  );
  await page.addInitScript(() => {
    window.addEventListener("neurospark:product_event", (e) => {
      const detail = (e as CustomEvent).detail as
        | (Record<string, unknown> & { event?: string })
        | undefined;
      if (!detail || typeof detail.event !== "string") return;
      void (
        window as unknown as {
          __nsCaptureEventForTest?: (payload: Record<string, unknown>) => void;
        }
      ).__nsCaptureEventForTest?.(detail);
    });
  });
}

async function waitForEvent(
  events: CapturedEvent[],
  name: string,
  timeoutMs = 5000,
): Promise<CapturedEvent> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const hit = events.find((e) => e.event === name);
    if (hit) return hit;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(
    `Timeout waiting for analytics event "${name}". Captured so far: ${events
      .map((e) => e.event)
      .join(", ")}`,
  );
}

test.describe("FUTURE_ROADMAP §1.2.I — auth + onboarding + first-activity funnel", () => {
  test("dispatches the full funnel of analytics events end-to-end", async ({
    page,
  }) => {
    const events: CapturedEvent[] = [];
    await attachEventBus(page, events);

    // Seed only `credits: 3` so the brand-new account isn't sent straight to
    // the paywall when generating the first pack. We deliberately leave
    // `user` / `children` null so the auth + onboarding funnel still runs.
    await page.addInitScript(() => {
      try {
        const raw = window.localStorage.getItem("neurospark_v2");
        const base = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
        window.localStorage.setItem(
          "neurospark_v2",
          JSON.stringify({ ...base, credits: 3 }),
        );
      } catch {
        /* ignore — storage may be unavailable */
      }
    });

    // ------------------------------------------------------------------------
    // 1) Cold landing → AuthScreen
    // ------------------------------------------------------------------------
    await page.goto("/");
    await page.getByRole("button", { name: /Get Started Free/i }).click();

    const authView = await waitForEvent(events, "auth_view");
    expect(authView.screen).toBe("auth");
    expect(authView.auth_mode).toBe("signup");

    // ------------------------------------------------------------------------
    // 2) Signup → auth_submit_attempt + auth_submit_success
    // ------------------------------------------------------------------------
    await page.getByPlaceholder(/Priya Sharma/i).fill("Priya");
    await page.getByPlaceholder(/parent@email.com/i).fill("priya@example.com");
    await page.getByPlaceholder(/Minimum 6 characters/i).fill("secret1");
    await page.getByRole("button", { name: /Create Account & Start/i }).click();

    const submitAttempt = await waitForEvent(events, "auth_submit_attempt");
    expect(submitAttempt.auth_mode).toBe("signup");
    expect(typeof submitAttempt.dwell_ms).toBe("number");

    const submitSuccess = await waitForEvent(events, "auth_submit_success");
    expect(submitSuccess.auth_mode).toBe("signup");

    // ------------------------------------------------------------------------
    // 3) Onboarding flow — Welcome → Child → Materials → Ready
    // ------------------------------------------------------------------------
    await expect(page.getByText(/Welcome, Priya!/i)).toBeVisible();
    const welcomeView = await waitForEvent(events, "onboard_step_view");
    expect(welcomeView.step).toBe("welcome");

    await page.getByRole("button", { name: /Set Up My Child/i }).click();
    await page.getByPlaceholder(/Arjun, Aisha, Leo/i).fill("Aarav");
    await page.getByRole("button", { name: /Next: Materials/i }).click();
    await page.getByRole("button", { name: /Select All/i }).click();
    await page.getByRole("button", { name: /Next: All Ready/i }).click();
    await page
      .getByRole("button", { name: /Generate First Activities/i })
      .click();

    // After the click we expect to have seen all four step views and the
    // completion event. We poll for `onboard_complete` then assert the four
    // step ids are present in `events`.
    const completeEvt = await waitForEvent(events, "onboard_complete");
    expect(completeEvt.screen).toBe("onboard_ready");

    const onboardSteps = events
      .filter((e) => e.event === "onboard_step_view")
      .map((e) => e.step);
    for (const step of ["welcome", "child", "materials", "ready"]) {
      expect(onboardSteps).toContain(step);
    }

    // ------------------------------------------------------------------------
    // 4) Generated pack → open first activity → first_activity_open
    // ------------------------------------------------------------------------
    await expect(page.getByText(/2026 Year Plan/i)).toBeVisible();

    await page.getByRole("button", { name: /^Today/i }).click();
    await page.getByRole("button", { name: /Generate My Pack/i }).click();

    await expect(page.getByText(/Today's Pack for/i)).toBeVisible({
      timeout: 15_000,
    });

    // Expand the first activity card so the "Mark as Complete" CTA appears.
    await page
      .getByText(/Tap to expand, or open the full detail view below/i)
      .first()
      .click();

    // Activity expansion does not itself fire `activity_open` — that fires
    // when the user opens the full detail view. Open it now.
    await page
      .getByRole("button", { name: /Open full detail/i })
      .first()
      .click();

    const activityOpen = await waitForEvent(events, "activity_open");
    expect(activityOpen.screen).toBe("activity_detail");
    expect(typeof activityOpen.is_first_activity).toBe("boolean");
    expect(activityOpen.is_first_activity).toBe(true);

    const firstOpen = await waitForEvent(events, "first_activity_open");
    expect(firstOpen.screen).toBe("activity_detail");

    // ------------------------------------------------------------------------
    // 5) Mark complete from the pack list → activity_complete + first_activity_complete
    // ------------------------------------------------------------------------
    await page.getByRole("button", { name: /Back to activities/i }).click();
    await expect(page.getByText(/Today's Pack for/i)).toBeVisible();

    // Expand the first card again (collapses on navigation away/back).
    await page
      .getByText(/Tap to expand, or open the full detail view below/i)
      .first()
      .click();
    await page
      .getByRole("button", { name: /Mark as Complete/i })
      .first()
      .click();
    // Confirm completion ("Done! +XX BP ⚡") — match by the leading "Done!" text
    // since the BP suffix varies with the rating slider default.
    await page
      .getByRole("button", { name: /^Done! \+\d+ BP/i })
      .first()
      .click();

    const completeFire = await waitForEvent(events, "activity_complete");
    expect(completeFire.is_first_activity).toBe(true);

    const firstComplete = await waitForEvent(events, "first_activity_complete");
    expect(firstComplete.event).toBe("first_activity_complete");

    // ------------------------------------------------------------------------
    // 6) Funnel order + uniqueness sanity checks
    // ------------------------------------------------------------------------
    const order = events.map((e) => e.event);
    const idx = (name: string) => order.indexOf(name);

    expect(idx("auth_view")).toBeGreaterThanOrEqual(0);
    expect(idx("auth_submit_success")).toBeGreaterThan(idx("auth_view"));
    expect(idx("onboard_complete")).toBeGreaterThan(idx("auth_submit_success"));
    expect(idx("first_activity_open")).toBeGreaterThan(idx("onboard_complete"));
    expect(idx("first_activity_complete")).toBeGreaterThan(
      idx("first_activity_open"),
    );

    // first_activity_* should fire exactly once per fresh signup.
    expect(events.filter((e) => e.event === "first_activity_open")).toHaveLength(1);
    expect(
      events.filter((e) => e.event === "first_activity_complete"),
    ).toHaveLength(1);
  });
});
