import { afterEach, expect, it, vi } from "vitest";
import * as Sentry from "@sentry/node";
import {
  initServerMonitoring,
  reportFailure,
} from "../../src/lib/server-monitoring";
vi.mock("@sentry/node", () => ({
  init: vi.fn(),
  getClient: vi.fn(),
  captureMessage: vi.fn(),
  flush: vi.fn(),
}));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});
it("rebuilds server events without request, email, message, stack or extra", () => {
  vi.stubEnv("SENTRY_DSN", "https://public@example.test/1");
  initServerMonitoring();
  const options = vi.mocked(Sentry.init).mock.calls[0][0]!;
  const event = options.beforeSend!(
    {
      type: undefined,
      event_id: "id",
      message: "private input",
      request: { url: "https://private" },
      user: { email: "private" },
      extra: { secret: "private" },
    },
    {},
  );
  expect(JSON.stringify(event)).not.toContain("private");
  expect(JSON.stringify(event)).toContain("server_render");
  expect(options.sendDefaultPii).toBe(false);
  expect(options.defaultIntegrations).toBe(false);
});
it("bounds monitoring wait and tolerates provider failures", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.mocked(Sentry.flush).mockRejectedValue(new Error("unavailable"));
  await expect(reportFailure("contact_dependency")).resolves.toBeUndefined();
  expect(Sentry.captureMessage).toHaveBeenCalledWith(
    "contact_dependency",
    "error",
  );
  expect(Sentry.flush).toHaveBeenCalledWith(1500);
});
