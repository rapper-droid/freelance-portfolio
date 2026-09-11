import { afterEach, expect, it, vi } from "vitest";
import {
  redis,
  quota,
  fingerprint,
  limitedJson,
  clientBucket,
} from "../../src/lib/abuse";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it("requires a trusted Redis endpoint and secret without forwarding input", async () => {
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://evil.test");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "private");
  const f = vi.fn();
  vi.stubGlobal("fetch", f);
  await expect(redis("PING")).rejects.toThrow();
  expect(f).not.toHaveBeenCalled();
});
it("uses an atomic increment with expiry and enforces the result", async () => {
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://test.upstash.io");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "private");
  const f = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ result: 5 }))
    .mockResolvedValueOnce(Response.json({ result: 6 }));
  vi.stubGlobal("fetch", f);
  expect(await quota("test", 5, 600)).toBe(true);
  expect(await quota("test", 5, 600)).toBe(false);
  expect(JSON.parse(f.mock.calls[0][1].body)[1]).toContain("EXPIRE");
});
it("does not trust spoofed forwarding headers outside Netlify", () => {
  vi.stubEnv("RATE_LIMIT_SALT", "x".repeat(32));
  expect(
    clientBucket(
      new Request("https://test", {
        headers: { "x-forwarded-for": "attacker" },
      }),
    ),
  ).toBe(fingerprint("shared-untrusted-host"));
});
it("bounds streamed input without trusting content-length", async () => {
  const request = new Request("https://test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: "x".repeat(1100) }),
  });
  await expect(limitedJson(request, 1024)).rejects.toThrow("body_too_large");
});
