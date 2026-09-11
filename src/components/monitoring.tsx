"use client";
import { useEffect } from "react";
import { redactError } from "@/lib/monitoring";
let client: Promise<typeof import("@sentry/browser") | undefined> | undefined;
export function browserMonitoring() {
  if (
    !process.env.NEXT_PUBLIC_SENTRY_DSN ||
    process.env.NODE_ENV !== "production"
  )
    return Promise.resolve(undefined);
  client ??= import("@sentry/browser")
    .then((Sentry) => {
      if (!Sentry.getClient())
        Sentry.init({
          dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
          defaultIntegrations: false,
          integrations: [Sentry.globalHandlersIntegration()],
          sendDefaultPii: false,
          tracesSampleRate: 0,
          beforeSend: (event) => redactError(event),
        });
      return Sentry;
    })
    .catch(() => undefined);
  return client;
}
export function Monitoring() {
  useEffect(() => {
    void browserMonitoring();
  }, []);
  return null;
}
