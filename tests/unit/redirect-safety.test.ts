import { afterEach, expect, it, vi } from "vitest";
import { redis } from "../../src/lib/abuse";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
it("does not follow an upstream Redis redirect or forward credentials", async () => {
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://fixture.upstash.io");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "fixture-only");
  const send = vi.fn().mockResolvedValue(
    new Response(null, {
      status: 302,
      headers: { Location: "https://evil.invalid" },
    }),
  );
  vi.stubGlobal("fetch", send);
  await expect(redis("PING")).rejects.toThrow("rate_unavailable");
  expect(send).toHaveBeenCalledTimes(1);
  expect(send.mock.calls[0][0]).toBe("https://fixture.upstash.io");
  expect(send.mock.calls[0][1].redirect).toBe("manual");
});
