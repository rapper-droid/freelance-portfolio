import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST, GET } from "../../src/app/api/contact/route";
import { validateContact } from "../../src/lib/contact";
import { quota, redis, fingerprint } from "../../src/lib/abuse";
vi.mock("../../src/lib/abuse", async (original) => ({
  ...(await original<typeof import("../../src/lib/abuse")>()),
  quota: vi.fn(),
  redis: vi.fn(),
  clientBucket: () => "masked",
}));
vi.mock("../../src/lib/server-monitoring", () => ({ reportFailure: vi.fn() }));
const body = {
  name: "山田 太郎",
  company: "サンプル商店",
  page: "/works/web",
  email: "example@example.test",
  kind: "Web",
  detail: "Please build a company website.",
  budget: "discuss",
  token: "fresh-token",
  id: "b37ae8a2-411a-4f03-963b-00e6ae6f8fca",
  consent: true,
  website: "",
};
function request(value: unknown = body, origin = "https://portfolio.test") {
  return new Request("https://portfolio.test/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json", origin },
    body: JSON.stringify(value),
  });
}
function configured() {
  for (const key of [
    "RESEND_API_KEY",
    "CONTACT_FROM_EMAIL",
    "CONTACT_TO_EMAIL",
    "TURNSTILE_SECRET",
    "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
    "UPSTASH_REDIS_REST_TOKEN",
  ])
    vi.stubEnv(key, "test-only");
  vi.stubEnv("CONTACT_ENABLED", "true");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://portfolio.test");
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://test.upstash.io");
  vi.stubEnv("RATE_LIMIT_SALT", "x".repeat(32));
}
beforeEach(() => {
  vi.mocked(quota).mockResolvedValue(true);
  vi.mocked(redis).mockImplementation(async (...args) =>
    args[0] === "GET" ? null : "OK",
  );
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});
describe("contact safety", () => {
  it("keeps unconfigured contact closed", async () => {
    expect((await POST(request())).status).toBe(503);
    expect(await (await GET()).json()).toEqual({ enabled: false });
  });
  it("rejects malformed inputs, header injection, spam and no consent", () => {
    for (const change of [
      { email: "user@example.test\r\nBcc: evil@test.test" },
      { detail: "short" },
      { detail: "x".repeat(2001) },
      { token: "" },
      { consent: false },
      { website: "bot" },
      { id: "no" },
      { name: "" },
      { name: "x".repeat(81) },
      { company: "x".repeat(81) },
      { page: "https://attacker.test/steal" },
      { page: "/works" + String.fromCharCode(13, 10) + "Bcc: evil@test.test" },
    ])
      expect(validateContact({ ...body, ...change })).toBeNull();
  });
  it("rejects origin, oversized body and invalid JSON before dependencies", async () => {
    configured();
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    expect((await POST(request(body, "https://attacker.test"))).status).toBe(
      403,
    );
    expect(
      (await POST(request({ ...body, extra: "x".repeat(17000) }))).status,
    ).toBe(400);
    expect(
      (
        await POST(
          new Request("https://portfolio.test/api/contact", {
            method: "POST",
            headers: {
              origin: "https://portfolio.test",
              "Content-Type": "application/json",
            },
            body: "{",
          }),
        )
      ).status,
    ).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("enforces the shared rate limit before verification or mail", async () => {
    configured();
    vi.mocked(quota).mockResolvedValue(false);
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    expect((await POST(request())).status).toBe(429);
    expect(f).not.toHaveBeenCalled();
  });
  it.each([
    { success: false, action: "contact", hostname: "portfolio.test" },
    { success: true, action: "login", hostname: "portfolio.test" },
    { success: true, action: "contact", hostname: "attacker.test" },
  ])("requires success, action and hostname: %j", async (verification) => {
    configured();
    const f = vi.fn().mockResolvedValue(Response.json(verification));
    vi.stubGlobal("fetch", f);
    expect((await POST(request())).status).toBe(403);
    expect(f).toHaveBeenCalledTimes(1);
  });
  it("sends a fixed recipient, text email and idempotency key only after all guards", async () => {
    configured();
    const f = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          success: true,
          action: "contact",
          hostname: "portfolio.test",
        }),
      )
      .mockResolvedValueOnce(Response.json({ id: "provider-id" }));
    vi.stubGlobal("fetch", f);
    expect((await POST(request())).status).toBe(200);
    expect(f.mock.calls[1][0]).toBe("https://api.resend.com/emails");
    const options = f.mock.calls[1][1];
    expect(options.headers["Idempotency-Key"]).toBe(`tsudowa-${body.id}`);
    expect(JSON.parse(options.body).to).toEqual(["test-only"]);
    expect(JSON.parse(options.body).from).toBe("TSUDOWA <test-only>");
    expect(JSON.parse(options.body).subject).toContain("TSUDOWA:");
    expect(JSON.parse(options.body).reply_to).toBe(body.email);
    expect(options.body).not.toContain("fresh-token");
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });
  it("never reports success on upstream rejection, timeout or Redis failure", async () => {
    configured();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("private input")),
    );
    expect((await POST(request())).status).toBe(503);
    vi.mocked(quota).mockRejectedValue(new Error("private credential"));
    expect((await POST(request())).status).toBe(503);
  });
  it("stops when the global mail budget is exhausted", async () => {
    configured();
    vi.mocked(quota).mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const f = vi.fn().mockResolvedValue(
      Response.json({
        success: true,
        action: "contact",
        hostname: "portfolio.test",
      }),
    );
    vi.stubGlobal("fetch", f);
    expect((await POST(request())).status).toBe(429);
    expect(f).toHaveBeenCalledTimes(1);
  });
  it("rejects concurrent submissions before sending", async () => {
    configured();
    vi.mocked(redis).mockImplementation(async (...args) =>
      args[0] === "GET"
        ? null
        : args[1].toString().endsWith(":lock")
          ? null
          : "OK",
    );
    const f = vi.fn().mockResolvedValue(
      Response.json({
        success: true,
        action: "contact",
        hostname: "portfolio.test",
      }),
    );
    vi.stubGlobal("fetch", f);
    expect((await POST(request())).status).toBe(409);
    expect(f).toHaveBeenCalledTimes(1);
  });
});

it("recognizes accepted retry and never sends a second email", async () => {
  configured();
  const { email, detail, kind, budget, name, company } = body;
  const digest = fingerprint(
    JSON.stringify({ email, detail, kind, budget, name, company }),
  );
  vi.mocked(redis).mockResolvedValueOnce(digest).mockResolvedValueOnce("1");
  const f = vi.fn().mockResolvedValue(
    Response.json({
      success: true,
      action: "contact",
      hostname: "portfolio.test",
    }),
  );
  vi.stubGlobal("fetch", f);
  expect((await POST(request())).status).toBe(200);
  expect(f).toHaveBeenCalledTimes(1);
});
it("rejects changed payload under an existing idempotency key", async () => {
  configured();
  vi.mocked(redis).mockResolvedValueOnce("different-digest");
  const f = vi.fn().mockResolvedValue(
    Response.json({
      success: true,
      action: "contact",
      hostname: "portfolio.test",
    }),
  );
  vi.stubGlobal("fetch", f);
  expect((await POST(request())).status).toBe(409);
  expect(f).toHaveBeenCalledTimes(1);
});
it("never reports a rejected provider response as successful", async () => {
  configured();
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          success: true,
          action: "contact",
          hostname: "portfolio.test",
        }),
      )
      .mockResolvedValueOnce(
        Response.json({ message: "private" }, { status: 403 }),
      ),
  );
  expect((await POST(request())).status).toBe(503);
});

it("puts everything needed to reply in the email, and nothing dangerous in the subject", async () => {
  configured();
  const f = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({
        success: true,
        action: "contact",
        hostname: "portfolio.test",
      }),
    )
    .mockResolvedValueOnce(Response.json({ id: "provider-id" }));
  vi.stubGlobal("fetch", f);
  expect(
    (
      await POST(
        request({ ...body, kind: "Web" + String.fromCharCode(13, 10) + "X" }),
      )
    ).status,
  ).toBe(200);
  const sent = JSON.parse(f.mock.calls[1][1].body);
  // Everything the reader needs to answer without opening anything else.
  for (const needle of [
    body.name,
    body.company,
    body.email,
    body.detail,
    body.page,
    body.id,
  ])
    expect(sent.text).toContain(needle);
  // A timestamp, in a form that is unambiguous across timezones.
  expect(sent.text).toMatch(/\d{4}-\d{2}-\d{2}T[\d:.]+Z/);
  // The subject is a header: a newline in user input must not survive into it.
  expect(sent.subject).not.toMatch(/[\r\n]/);
  expect(sent.subject).toContain(body.name);
  // Still never leaks the captcha token.
  expect(f.mock.calls[1][1].body).not.toContain("fresh-token");
});
