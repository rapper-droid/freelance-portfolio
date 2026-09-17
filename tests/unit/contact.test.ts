import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST, GET } from "../../src/app/api/contact/route";
import { validateContact, contactPayload } from "../../src/lib/contact";
import { quota, redis, fingerprint } from "../../src/lib/abuse";
import { internalMail, receiptMail } from "../../src/lib/contact-mail";
import { safeEvent, posthogPayload } from "../../src/lib/analytics";
import { contactContext, safeReference } from "../../src/lib/contact-options";
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
  email: "visitor@example.test",
  kind: "Webサイト / LP",
  detail: "会社のWebサイトの制作について相談したいです。",
  budget: "5〜10万円",
  stage: "アイデア段階",
  timing: "1か月以内",
  reference: "https://example.test/reference",
  supplement: "小さく始めたいです。",
  token: "fresh-token",
  id: "b37ae8a2-411a-4f03-963b-00e6ae6f8fca",
  consent: true,
  website: "",
};
const key = "portfolio:submission:" + body.id;
const store = new Map<string, unknown>();
const provider = new Map<string, string>();
let mails: {
  body: Record<string, unknown>;
  key: string;
  options: RequestInit;
}[];
function configured() {
  for (const k of [
    "RESEND_API_KEY",
    "TURNSTILE_SECRET",
    "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
    "UPSTASH_REDIS_REST_TOKEN",
  ])
    vi.stubEnv(k, "test-only");
  vi.stubEnv("CONTACT_ENABLED", "true");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://portfolio.test");
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://test.upstash.io");
  vi.stubEnv("RATE_LIMIT_SALT", "x".repeat(32));
  vi.stubEnv("CONTACT_FROM_EMAIL", "no-reply@tsudowa.com");
  vi.stubEnv("CONTACT_TO_EMAIL", "contact@tsudowa.com");
}
function request(v: unknown = body, origin = "https://portfolio.test") {
  return new Request("https://portfolio.test/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json", origin },
    body: JSON.stringify(v),
  });
}
async function memoryRedis(...args: (string | number)[]) {
  const [cmd, k, v] = args;
  const name = String(k);
  if (cmd === "GET") return store.get(name) ?? null;
  if (cmd === "SET") {
    if (args.includes("NX") && store.has(name)) return null;
    store.set(name, v);
    return "OK";
  }
  if (cmd === "EVAL") {
    if (store.get(String(args[3])) === args[4]) {
      store.delete(String(args[3]));
      return 1;
    }
    return 0;
  }
  throw Error("Unsupported fake Redis command");
}
function fetcher(
  fail?: (id: string, n: number) => "timeout" | "reject" | undefined,
) {
  return vi.fn(async (url: string, opts: RequestInit) => {
    if (url.includes("siteverify"))
      return Response.json({
        success: true,
        action: "contact",
        hostname: "portfolio.test",
      });
    expect(url).toBe("https://api.resend.com/emails");
    const id = (opts.headers as Record<string, string>)["Idempotency-Key"];
    mails.push({ body: JSON.parse(String(opts.body)), key: id, options: opts });
    const error = fail?.(id, mails.length);
    if (error === "timeout") throw new DOMException("private", "TimeoutError");
    if (error === "reject")
      return Response.json({ error: "private" }, { status: 503 });
    const previous = provider.get(id);
    if (previous && previous !== opts.body)
      return Response.json({ error: "idempotency_mismatch" }, { status: 409 });
    provider.set(id, String(opts.body));
    return Response.json({ id: "mock-" + id });
  });
}
beforeEach(() => {
  store.clear();
  provider.clear();
  mails = [];
  vi.mocked(quota).mockResolvedValue(true);
  vi.mocked(redis).mockImplementation(memoryRedis);
  vi.stubGlobal("fetch", fetcher());
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetAllMocks();
  vi.useRealTimers();
});
describe("sales intake guards", () => {
  it("keeps missing configuration closed", async () => {
    expect((await POST(request())).status).toBe(503);
    expect(await (await GET()).json()).toEqual({ enabled: false });
  });
  it.each([
    "RESEND_API_KEY",
    "CONTACT_FROM_EMAIL",
    "CONTACT_TO_EMAIL",
    "TURNSTILE_SECRET",
    "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
    "NEXT_PUBLIC_SITE_URL",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "RATE_LIMIT_SALT",
  ])("fails closed without %s", async (k) => {
    configured();
    vi.stubEnv(k, "");
    expect((await POST(request())).status).toBe(503);
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each([
    { email: "user@example.test\r\nBcc:evil@test.test" },
    { name: "" },
    { name: "x".repeat(81) },
    { name: "Injected\r\nX" },
    { detail: "short" },
    { detail: "x".repeat(2001) },
    { company: "x".repeat(81) },
    { token: "" },
    { consent: false },
    { website: "bot" },
    { id: "bad" },
    { page: "https://evil.test" },
    { page: "/works/web?email=private" },
    { category: "api" },
    { demo: "inbox" },
    { kind: "Invented" },
    { budget: "free" },
    { stage: "maybe" },
    { timing: "tomorrow" },
    { reference: "javascript:alert(1)" },
    { reference: "data:text/html,bad" },
    { reference: "https://user:pass@example.test" },
    { supplement: "x".repeat(1001) },
  ])("rejects malformed/unsafe input %j", (change) => {
    expect(validateContact({ ...body, ...change })).toBeNull();
  });
  it("normalizes omitted optional fields and derives non-PII context", () => {
    const v = validateContact({
      ...body,
      kind: undefined,
      budget: undefined,
      stage: undefined,
      timing: undefined,
      reference: undefined,
    });
    expect(v?.kind).toBe("まだ決まっていない");
    expect(v?.budget).toBe("未定");
    expect(v?.category).toBe("web");
    expect(contactContext("/experience/inbox")).toMatchObject({
      demo: "inbox",
      category: "apps",
    });
    expect(contactContext("/works/constructor")).toBeNull();
    expect(safeReference("https://example.test/a?b=1")).toBe(true);
  });
  it("rejects origin, oversized body, invalid JSON and content type before dependencies", async () => {
    configured();
    expect((await POST(request(body, "https://evil.test"))).status).toBe(403);
    expect(
      (await POST(request({ ...body, extra: "x".repeat(17000) }))).status,
    ).toBe(400);
    for (const [content, ct] of [
      ["{", "application/json"],
      ["{}", "text/plain"],
    ])
      expect(
        (
          await POST(
            new Request("https://portfolio.test/api/contact", {
              method: "POST",
              headers: { origin: "https://portfolio.test", "Content-Type": ct },
              body: content,
            }),
          )
        ).status,
      ).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("applies rate limit before captcha and mail", async () => {
    configured();
    vi.mocked(quota).mockResolvedValue(false);
    const response = await POST(request());
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("600");
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each([
    { success: false, action: "contact", hostname: "portfolio.test" },
    { success: true, action: "login", hostname: "portfolio.test" },
    { success: true, action: "contact", hostname: "evil.test" },
  ])("requires Turnstile success/action/hostname %j", async (v) => {
    configured();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(v)));
    expect((await POST(request())).status).toBe(403);
    expect(mails).toHaveLength(0);
  });
  it("caps each outgoing email, not just each form submission", async () => {
    configured();
    const result = await POST(request());
    expect(result.status).toBe(200);
    expect(
      vi.mocked(quota).mock.calls.filter((a) => a[0] === "mail-day"),
    ).toHaveLength(2);
    expect(
      vi.mocked(quota).mock.calls.filter((a) => a[0] === "mail-30days"),
    ).toHaveLength(2);
  });
  it("does not send when the global cap is exhausted", async () => {
    configured();
    vi.mocked(quota).mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    expect((await POST(request())).status).toBe(429);
    expect(mails).toHaveLength(0);
    expect(store.has(key + ":lock")).toBe(false);
  });
  it("rejects competing work without releasing its lock", async () => {
    configured();
    store.set(key + ":lock", "other-owner");
    expect((await POST(request())).status).toBe(409);
    expect(mails).toHaveLength(0);
    expect(store.get(key + ":lock")).toBe("other-owner");
  });
});
describe("mail delivery contract", () => {
  it("sends two emails with correct From, To and opposite Reply-To; returns a reserved receipt", async () => {
    configured();
    const response = await POST(request());
    const result = await response.json();
    expect(response.status).toBe(200);
    expect(result).toMatchObject({ code: "accepted", confirmation: "sent" });
    expect(result.receipt).toMatch(/^TSW-\d{6}-[A-F0-9]{10}$/);
    expect(store.get("portfolio:receipt:" + result.receipt)).toBe(body.id);
    expect(mails).toHaveLength(2);
    const [internal, auto] = mails;
    expect(internal.body).toMatchObject({
      from: "TSUDOWA <no-reply@tsudowa.com>",
      to: ["contact@tsudowa.com"],
      reply_to: body.email,
    });
    expect(auto.body).toMatchObject({
      to: [body.email],
      reply_to: "contact@tsudowa.com",
      subject: "お問い合わせを受け付けました｜TSUDOWA",
    });
    for (const value of [
      body.name,
      body.company,
      body.email,
      body.detail,
      body.reference,
      body.supplement,
      body.stage,
      body.timing,
      body.page,
      body.id,
      result.receipt,
    ])
      expect(internal.body.text).toContain(value);
    expect(internal.body.subject).toContain("[TSUDOWA][WEB][5〜10万円]");
    expect(String(internal.body.subject)).not.toMatch(/[\r\n]/);
    expect(auto.body.text).toContain(result.receipt);
    expect(auto.body.html).toContain('lang="ja"');
    expect(auto.body.html).toContain("<h1");
    expect(auto.body.text).not.toContain(body.reference);
    expect(JSON.stringify(mails)).not.toContain("fresh-token");
    for (const mail of mails) {
      expect(mail.options.signal).toBeInstanceOf(AbortSignal);
      expect(mail.options.redirect).toBe("error");
    }
    expect(internal.key).toBe("tsudowa-" + body.id + "-owner");
    expect(auto.key).toBe("tsudowa-" + body.id + "-confirmation");
  });
  it("accepted retries return the same receipt without sending again", async () => {
    configured();
    const first = await (await POST(request())).json();
    const second = await (
      await POST(request({ ...body, token: "fresh-again" }))
    ).json();
    expect(second).toEqual(first);
    expect(mails).toHaveLength(2);
  });
  it.each(["name", "company", "detail", "reference", "supplement", "timing"])(
    "changed %s under the same ID is rejected",
    async (field) => {
      configured();
      await POST(request());
      const changed = {
        ...body,
        [field]:
          field === "timing"
            ? "未定"
            : String(body[field as keyof typeof body]) + "x",
      };
      expect((await POST(request(changed))).status).toBe(409);
      expect(mails).toHaveLength(2);
    },
  );
  it("auto-reply failure is honest; retry only sends the receipt", async () => {
    configured();
    vi.stubGlobal(
      "fetch",
      fetcher((id, n) =>
        id.endsWith("confirmation") && n === 2 ? "reject" : undefined,
      ),
    );
    const first = await POST(request());
    expect(first.status).toBe(503);
    expect((await first.json()).code).toBe("receipt_pending");
    const second = await POST(request());
    expect(second.status).toBe(200);
    expect(mails.filter((m) => m.key.endsWith("owner"))).toHaveLength(1);
    expect(provider.size).toBe(2);
  });
  it("keeps the exact retry payload and timestamp after an ambiguous timeout", async () => {
    configured();
    vi.stubGlobal(
      "fetch",
      fetcher((_id, n) => (n === 1 ? "timeout" : undefined)),
    );
    expect((await POST(request())).status).toBe(503);
    const first = String(mails[0].options.body);
    expect((await POST(request())).status).toBe(200);
    expect(String(mails[1].options.body)).toBe(first);
    expect(mails[1].key).toBe(mails[0].key);
  });
  it("retains provider idempotency when Redis cannot record a successful owner send", async () => {
    configured();
    let fail = true;
    vi.mocked(redis).mockImplementation(async (...args) => {
      if (args[0] === "SET" && args[1] === key + ":owner" && fail) {
        fail = false;
        throw Error("unavailable");
      }
      return memoryRedis(...args);
    });
    expect((await POST(request())).status).toBe(503);
    expect((await POST(request())).status).toBe(200);
    expect(provider.size).toBe(2);
    expect(mails[0].options.body).toBe(mails[1].options.body);
  });
  it("never reports upstream/Redis/timeout errors as a full success", async () => {
    configured();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(Error("private")));
    expect((await POST(request())).status).toBe(503);
    vi.mocked(quota).mockRejectedValue(Error("private credential"));
    expect((await POST(request())).status).toBe(503);
  });
  it("stops retries before the provider 24-hour idempotency window ends", async () => {
    configured();
    const v = validateContact(body)!;
    store.set(key, fingerprint(JSON.stringify(contactPayload(v))));
    store.set(
      key + ":receipt",
      JSON.stringify({
        receipt: "TSW-260917-ABCDEF0123",
        receivedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
      }),
    );
    const response = await POST(request());
    expect(response.status).toBe(409);
    expect((await response.json()).code).toBe("expired");
    expect(mails).toHaveLength(0);
  });
  it("retries a receipt-number collision atomically", async () => {
    configured();
    let reservations = 0;
    vi.mocked(redis).mockImplementation(async (...args) => {
      if (
        args[0] === "SET" &&
        String(args[1]).startsWith("portfolio:receipt:") &&
        ++reservations === 1
      )
        return null;
      return memoryRedis(...args);
    });
    expect((await POST(request())).status).toBe(200);
    expect(reservations).toBe(2);
  });
  it("stores no raw form content, email or Turnstile token in Redis", async () => {
    configured();
    await POST(request());
    const saved = JSON.stringify([...store.entries()]);
    for (const s of [
      body.name,
      body.email,
      body.detail,
      body.reference,
      body.token,
    ])
      expect(saved).not.toContain(s);
  });
  it("escapes receipt HTML and keeps arbitrary content out of automated mail", () => {
    const v = validateContact({ ...body, name: "<b>名前</b>" })!;
    const r = {
      receipt: "TSW-260917-ABCDEF0123",
      receivedAt: "2026-09-17T00:00:00.000Z",
    };
    expect(receiptMail(v, r).html).toContain("&lt;b&gt;名前&lt;/b&gt;");
    expect(receiptMail(v, r).html).not.toContain("<b>名前</b>");
    expect(internalMail(v, r).text).toContain(v.detail);
  });
  it("allows funnel names but strips every input field from analytics", () => {
    for (const event of [
      "contact_started",
      "category_selected",
      "contact_submitted",
      "contact_success",
      "contact_error",
    ]) {
      const value = {
        event,
        ...body,
        message: "private",
        url: "https://private.test",
      };
      expect(safeEvent(value)).toEqual({ event });
      const payload = posthogPayload(value, "key", "anonymous");
      for (const s of [body.name, body.email, body.detail, body.reference])
        expect(JSON.stringify(payload)).not.toContain(s);
    }
  });
});
