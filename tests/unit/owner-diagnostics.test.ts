import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import {
  ownerDiagnostics,
  OWNER_HOST,
  OWNER_REQUEST,
  OWNER_RECEIPT,
  OWNER_KEYS,
} from "../../src/workers/owner-diagnostics";
import { validateContact, contactPayload } from "../../src/lib/contact";

const secret = "test-only-not-a-real-secret-".repeat(4);
const payload = {
  id: OWNER_REQUEST,
  name: "Fixture",
  company: "",
  email: "fixture@example.invalid",
  detail: "Fixture only test message",
  page: "/contact/general",
  consent: true,
  website: "",
  token: "fixture-token",
};
let records: Map<string, { value: string; expires: number }>;
let count: number;
let env: Env;
const request = (
  path = "/inspect",
  options: RequestInit = {},
  host = OWNER_HOST,
) =>
  new Request("https://" + host + "/__owner-diagnostics" + path, {
    ...options,
    headers: { authorization: "Bearer " + secret, ...options.headers },
  });
const replay = (body: unknown = payload) =>
  request("/replay", {
    method: "POST",
    headers: {
      origin: "https://" + OWNER_HOST,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
beforeEach(() => {
  vi.stubEnv("OWNER_DIAGNOSTICS_SECRET", secret);
  vi.stubEnv("RATE_LIMIT_SALT", secret);
  vi.stubEnv("TURNSTILE_SECRET", "test-only");
  vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "test-only");
  const hash = createHmac("sha256", secret)
    .update(JSON.stringify(contactPayload(validateContact(payload)!)))
    .digest("hex");
  const values = [
    OWNER_REQUEST,
    hash,
    JSON.stringify({
      receipt: OWNER_RECEIPT,
      receivedAt: new Date().toISOString(),
    }),
    "1",
    "1",
  ];
  records = new Map(
    values.map((value, i) => [
      OWNER_KEYS[i],
      { value, expires: Date.now() + 60000 },
    ]),
  );
  count = 0;
  env = {
    OWNER_DIAGNOSTICS_ENABLED: "true",
    OWNER_REVIEW: "true",
    HOSTING_PLATFORM: "cloudflare",
    CONTACT_ORIGIN: "https://" + OWNER_HOST,
    CONTACT_STATE: {
      getByName: () => ({
        execute: async () => ++count,
        ownerInspect: async (key: string) => records.get(key) ?? null,
      }),
    },
  } as Env;
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({
        success: true,
        action: "contact",
        hostname: OWNER_HOST,
        challenge_ts: new Date().toISOString(),
      }),
    ),
  );
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
describe("temporary owner diagnostics fail closed", () => {
  it.each([
    "tsudowa.com",
    "www.tsudowa.com",
    "other.workers.dev",
    "example.netlify.app",
  ])("denies host %s", async (host) => {
    expect(
      (await ownerDiagnostics(request("/inspect", {}, host), env))?.status,
    ).toBe(404);
    expect(count).toBe(0);
  });
  it.each([undefined, "false"])(
    "denies disabled/missing flag %s",
    async (flag) => {
      Object.assign(env, { OWNER_DIAGNOSTICS_ENABLED: flag });
      expect((await ownerDiagnostics(request(), env))?.status).toBe(404);
    },
  );
  it("denies missing and incorrect secrets and query parameters", async () => {
    expect(
      (
        await ownerDiagnostics(
          request("/inspect", { headers: { authorization: "" } }),
          env,
        )
      )?.status,
    ).toBe(404);
    expect(
      (await ownerDiagnostics(request("/inspect?key=x"), env))?.status,
    ).toBe(404);
    vi.stubEnv("OWNER_DIAGNOSTICS_SECRET", "");
    expect((await ownerDiagnostics(request(), env))?.status).toBe(404);
  });
  it("rate limits and fails closed on storage failure", async () => {
    count = 30;
    expect((await ownerDiagnostics(request(), env))?.status).toBe(429);
    env.CONTACT_STATE.getByName = () => {
      throw Error("offline");
    };
    expect((await ownerDiagnostics(request(), env))?.status).toBe(503);
  });
  it("inspects only metadata and does not extend expiry", async () => {
    const before = JSON.stringify([...records]);
    const result = await (await ownerDiagnostics(request(), env))!.json();
    expect(result.receiptMappingMatches).toBe(true);
    expect(result.adminMailSent).toBe(true);
    expect(result.autoReplySent).toBe(true);
    expect(JSON.stringify(result)).not.toContain(payload.email);
    expect(JSON.stringify([...records])).toBe(before);
  });
  it("returns duplicate-only with fresh verification and no storage or mail writes", async () => {
    const before = JSON.stringify([...records]);
    const r = await ownerDiagnostics(replay(), env);
    const b = await r!.json();
    expect(r!.status).toBe(200);
    expect(b).toMatchObject({
      duplicate: true,
      idempotent: true,
      receipt: OWNER_RECEIPT,
      adminMailSends: 0,
      autoReplySends: 0,
      newReceipts: 0,
    });
    expect(JSON.stringify([...records])).toBe(before);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    );
  });
  it.each([
    { ...payload, token: "" },
    { ...payload, id: "12345678-1234-4123-8123-123456789012" },
    { ...payload, detail: "Different message fixture" },
  ])("rejects invalid token, request or payload", async (body) => {
    const r = await ownerDiagnostics(replay(body), env);
    expect([400, 409]).toContain(r!.status);
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each([
    { success: false },
    { success: true, action: "wrong", hostname: OWNER_HOST },
    { success: true, action: "contact", hostname: "tsudowa.com" },
    {
      success: true,
      action: "contact",
      hostname: OWNER_HOST,
      challenge_ts: new Date(0).toISOString(),
    },
  ])("rejects invalid Turnstile result", async (verification) => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json({
        challenge_ts: new Date().toISOString(),
        ...verification,
      }),
    );
    expect((await ownerDiagnostics(replay(), env))!.status).toBe(403);
  });
  it("never resumes partial mail state or expired records", async () => {
    records.delete(OWNER_KEYS[4]);
    expect((await ownerDiagnostics(replay(), env))!.status).toBe(409);
    expect(fetch).not.toHaveBeenCalled();
    records.get(OWNER_KEYS[1])!.expires = 1;
    expect((await ownerDiagnostics(replay(), env))!.status).toBe(409);
  });
  it("rechecks records after verification and rejects changed state", async () => {
    vi.mocked(fetch).mockImplementation(async () => {
      records.delete(OWNER_KEYS[3]);
      return Response.json({
        success: true,
        action: "contact",
        hostname: OWNER_HOST,
        challenge_ts: new Date().toISOString(),
      });
    });
    expect((await ownerDiagnostics(replay(), env))!.status).toBe(409);
  });
  it("rejects wrong origin and oversized bodies", async () => {
    const r = replay();
    r.headers.set("origin", "https://example.invalid");
    expect((await ownerDiagnostics(r, env))!.status).toBe(403);
    expect(
      (await ownerDiagnostics(
        replay({ ...payload, extra: "x".repeat(17000) }),
        env,
      ))!.status,
    ).toBe(400);
  });
});
