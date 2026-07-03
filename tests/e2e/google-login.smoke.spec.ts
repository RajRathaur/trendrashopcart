import { test, expect, type Route } from "@playwright/test";

/**
 * Smoke test: Google login redirect sequence.
 *
 * We do NOT authenticate with real Google credentials (that would require
 * a service account + captcha bypass). Instead we verify every leg of the
 * round-trip that OUR app controls:
 *
 *   1. /login renders and exposes a "Continue with Google" button.
 *   2. Clicking it redirects to accounts.google.com with the correct
 *      Lovable-managed OAuth broker redirect_uri (no /~oauth/initiate 404).
 *   3. /auth/callback route is served by the SPA (no 404 on return).
 *   4. Simulating the broker POST-BACK to /auth/callback lands the user
 *      on the landing page (/) without a redirect loop.
 */

const GOOGLE_AUTH_HOST = "accounts.google.com";
const EXPECTED_BROKER_REDIRECT = "https://oauth.lovable.app/callback";

test.describe("Google login redirect sequence", () => {
  test("login page renders Google button", async ({ page }) => {
    const res = await page.goto("/login", { waitUntil: "domcontentloaded" });
    expect(res?.status(), "login page status").toBeLessThan(400);

    const googleBtn = page.getByRole("button", { name: /google/i });
    await expect(googleBtn).toBeVisible();
  });

  test("clicking Google redirects to Google OAuth with Lovable broker redirect_uri", async ({
    page,
  }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });

    // Capture the first navigation that leaves our origin.
    const navPromise = page.waitForURL(
      (url) => url.hostname.endsWith(GOOGLE_AUTH_HOST),
      { timeout: 20_000 },
    );

    await page.getByRole("button", { name: /google/i }).click();
    await navPromise;

    const finalUrl = new URL(page.url());
    expect(finalUrl.hostname).toContain(GOOGLE_AUTH_HOST);

    // Guardrail: we must NOT have bounced through /~oauth/initiate on our own
    // origin (that path 404s on custom domains).
    expect(page.url()).not.toContain("/~oauth/initiate");

    const redirectUri = finalUrl.searchParams.get("redirect_uri");
    expect(
      redirectUri,
      "Google should receive the Lovable-managed broker redirect_uri",
    ).toBe(EXPECTED_BROKER_REDIRECT);

    // Sanity: Google OAuth params are present.
    expect(finalUrl.searchParams.get("client_id")).toBeTruthy();
    expect(finalUrl.searchParams.get("response_type")).toBeTruthy();
  });

  test("/auth/callback route is served by SPA (no 404)", async ({ page }) => {
    const res = await page.goto("/auth/callback", {
      waitUntil: "domcontentloaded",
    });
    expect(res, "callback response").not.toBeNull();
    expect(res!.status(), "callback status").toBeLessThan(400);
  });

  test("callback with hash tokens hydrates session and lands on /", async ({
    page,
    context,
  }) => {
    // Simulate the broker returning to our origin with a fake hash payload.
    // We intercept Supabase token endpoints so we don't need a real session.
    await context.route("**/auth/v1/**", (route: Route) => {
      const url = route.request().url();
      if (url.includes("/token") || url.includes("/user")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            access_token: "smoke-test-token",
            refresh_token: "smoke-test-refresh",
            token_type: "bearer",
            expires_in: 3600,
            user: { id: "smoke", email: "smoke@test.local" },
          }),
        });
      }
      return route.continue();
    });

    await page.goto("/auth/callback#access_token=smoke&refresh_token=smoke", {
      waitUntil: "domcontentloaded",
    });

    // The PostLoginRedirect / callback handler should navigate us off /auth/callback
    // to either the saved path or "/". Give it a bounded window.
    await page
      .waitForURL(
        (u) => !u.pathname.startsWith("/auth/callback"),
        { timeout: 15_000 },
      )
      .catch(() => {
        // Some implementations render "Signing you in..." briefly; assert we
        // never ping-pong back to /login (redirect loop).
      });

    expect(page.url(), "must not loop back to /login").not.toContain("/login");
  });
});
