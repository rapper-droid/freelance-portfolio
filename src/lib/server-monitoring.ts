import * as Sentry from "@sentry/node";
const codes = [
  "contact_dependency",
  "analytics_dependency",
  "server_render",
] as const;
export type FailureCode = (typeof codes)[number];
export function initServerMonitoring() {
  if (!process.env.SENTRY_DSN || Sentry.getClient()) return;
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    defaultIntegrations: false,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    transportOptions: { bufferSize: 20 },
    beforeSend(event) {
      return {
        type: undefined,
        event_id: event.event_id,
        timestamp: event.timestamp,
        platform: "node",
        level: "error",
        message: codes.includes(event.message as FailureCode)
          ? event.message
          : "server_render",
      };
    },
  });
}
export async function reportFailure(code: FailureCode) {
  console.error(JSON.stringify({ event: code }));
  try {
    initServerMonitoring();
    Sentry.captureMessage(code, "error");
    await Sentry.flush(1500);
  } catch {
    /* Monitoring must never break the response. */
  }
}
