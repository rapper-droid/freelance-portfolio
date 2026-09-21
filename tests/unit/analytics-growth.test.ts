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

const session = "8f14e45f-ceea-467a-9b2b-1234567890ab";
function configured(host = "https://us.i.posthog.com", key = "phc_fixture") {
  // The browser switch is irrelevant to the server: only ANALYTICS_ENABLED is.
  vi.stubEnv("NEXT_PUBLIC_ANALYTICS_ENABLED", "false");
  vi.stubEnv("ANALYTICS_ENABLED", "true");
  vi.stubEnv("POSTHOG_HOST", host);
  vi.stubEnv("POSTHOG_PROJECT_KEY", key);
  const sent: { url: string; body: Record<string, unknown> }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: { body: string }) => {
      sent.push({ url: String(url), body: JSON.parse(init.body) });
      return new Response(null, { status: 200 });
    }),
  );
  return sent;
}
const send = (body: unknown) =>
  POST(
    new Request("https://tsudowa.com/api/analytics", {
      method: "POST",
      headers: {
        origin: "https://tsudowa.com",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }),
  );

describe("growth events over the live analytics route (G08, G31, G49)", () => {
  it("forwards an allowed event to the pinned ingest host, stripped of identity", async () => {
    const sent = configured();
    expect(
      (
        await send({
          event: "service_view",
          offer: "web-fix",
          session,
          source: "crowdworks",
        })
      ).status,
      // 202 proves the event was forwarded and accepted, which 204 did not.
    ).toBe(202);
    expect(sent).toHaveLength(1);
    expect(sent[0].url).toBe("https://us.i.posthog.com/i/v0/e/");
    expect(sent[0].body).toMatchObject({
      event: "service_view",
      distinct_id: session,
      properties: {
        offer: "web-fix",
        source: "crowdworks",
        $process_person_profile: false,
        $geoip_disable: true,
        $ip: "0.0.0.0",
      },
    });
  });
  it("never forwards brief text, e-mail addresses or URLs", async () => {
    const sent = configured();
    await send({
      event: "brief_created",
      offer: "csv-routine",
      session,
      detail: "秘密の相談本文",
      email: "person@example.test",
      reference: "https://example.test/?q=private",
    });
    const payload = JSON.stringify(sent);
    for (const leak of ["秘密の相談本文", "person@example.test", "private"])
      expect(payload).not.toContain(leak);
    expect(sent[0].body.properties).toEqual({
      offer: "csv-routine",
      source: "direct",
      $process_person_profile: false,
      $geoip_disable: true,
      $ip: "0.0.0.0",
    });
  });
  it("rejects an unknown event or offer before any network call", async () => {
    const sent = configured();
    expect((await send({ event: "made_up_event", session })).status).toBe(400);
    expect(
      (await send({ event: "service_view", offer: "not-an-offer", session }))
        .status,
    ).toBe(400);
    expect(sent).toHaveLength(0);
  });
  it("forwards on the runtime switch alone, never on the build-time one", async () => {
    // A: runtime switch on, key present -> one upstream send, 202.
    let sent = configured();
    expect(
      (await send({ event: "service_view", offer: "web-fix", session })).status,
    ).toBe(202);
    expect(sent).toHaveLength(1);
    // B: runtime switch off -> nothing sent, even with the browser flag on.
    sent = configured();
    vi.stubEnv("ANALYTICS_ENABLED", "false");
    vi.stubEnv("NEXT_PUBLIC_ANALYTICS_ENABLED", "true");
    expect(
      (await send({ event: "service_view", offer: "web-fix", session })).status,
    ).toBe(204);
    expect(sent).toHaveLength(0);
  });
  it("fails closed: no key, or a host outside the allowlist, sends nothing", async () => {
    let sent = configured("https://us.i.posthog.com", "");
    expect(
      (await send({ event: "service_view", offer: "web-fix", session })).status,
    ).toBe(204);
    expect(sent).toHaveLength(0);
    sent = configured("https://evil.test", "phc_fixture");
    expect(
      (await send({ event: "service_view", offer: "web-fix", session })).status,
    ).toBe(204);
    expect(sent).toHaveLength(0);
  });
});
