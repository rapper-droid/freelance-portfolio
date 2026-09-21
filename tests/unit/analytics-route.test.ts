import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "../../src/app/api/analytics/route";
vi.mock("../../src/lib/abuse", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../src/lib/abuse")>()),
  quota: vi.fn().mockResolvedValue(true),
  clientBucket: () => "test",
}));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
const request = (body: unknown, origin = "https://portfolio.test") =>
  new Request("https://portfolio.test/api/analytics", {
    method: "POST",
    headers: { origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
function configured() {
  vi.stubEnv("NEXT_PUBLIC_ANALYTICS_ENABLED", "true");
  vi.stubEnv("ANALYTICS_ENABLED", "true");
  vi.stubEnv("POSTHOG_PROJECT_KEY", "fixture-project-token");
  vi.stubEnv("POSTHOG_HOST", "https://eu.i.posthog.com");
}
describe("optional analytics transport", () => {
  it("does no network I/O when unconfigured", async () => {
    vi.stubEnv("NEXT_PUBLIC_ANALYTICS_ENABLED", "false");
    vi.stubEnv("ANALYTICS_ENABLED", "false");
    const mock = vi.fn();
    vi.stubGlobal("fetch", mock);
    expect(
      (await POST(request({ event: "portfolio_project_open" }))).status,
    ).toBe(204);
    expect(mock).not.toHaveBeenCalled();
  });
  it("drops free text, URLs and visitor headers before forwarding", async () => {
    configured();
    const mock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", mock);
    expect(
      (
        await POST(
          request({
            event: "portfolio_project_open",
            project: "cafe",
            message: "private-input",
            url: "private-url",
          }),
        )
      ).status,
    ).toBe(202);
    const [url, options] = mock.mock.calls[0];
    expect(url).toBe("https://eu.i.posthog.com/i/v0/e/");
    expect(options.body).not.toContain("private");
    expect(options.headers).toEqual({ "Content-Type": "application/json" });
    const payload = JSON.parse(options.body);
    expect(payload.properties.project).toBe("cafe");
    expect(payload.properties.$process_person_profile).toBe(false);
  });
  it("rejects cross-origin, unknown IDs and oversized payloads without forwarding", async () => {
    configured();
    const mock = vi.fn();
    vi.stubGlobal("fetch", mock);
    expect(
      (
        await POST(
          request({ event: "portfolio_project_open" }, "https://other.test"),
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await POST(
          request({ event: "portfolio_project_open", project: "unknown" }),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await POST(
          request({ event: "portfolio_project_open", text: "x".repeat(1100) }),
        )
      ).status,
    ).toBe(413);
    expect(mock).not.toHaveBeenCalled();
  });
  it("handles upstream failure without throwing into the UI", async () => {
    configured();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(
      (
        await POST(
          request({ event: "portfolio_category_view", category: "lp" }),
        )
      ).status,
    ).toBe(503);
  });
});

it("joins a short-lived anonymous funnel and drops free-form UTM values", async () => {
  configured();
  const mock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
  vi.stubGlobal("fetch", mock);
  const session = "b37ae8a2-411a-4f03-963b-00e6ae6f8fca";
  await POST(
    request({
      event: "portfolio_contact_success",
      session,
      source: "crowdworks",
      utm_campaign: "private",
      email: "private",
    }),
  );
  const payload = JSON.parse(mock.mock.calls[0][1].body);
  expect(payload.distinct_id).toBe(session);
  expect(payload.properties.source).toBe("crowdworks");
  expect(JSON.stringify(payload)).not.toContain("private");
});
