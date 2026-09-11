"use client";
import { useEffect } from "react";
import { redactError } from "@/lib/monitoring";
export function Monitoring() {
  useEffect(() => {
    if (
      !process.env.NEXT_PUBLIC_SENTRY_DSN ||
      process.env.NODE_ENV !== "production"
    )
      return;
    void import("@sentry/browser")
      .then((Sentry) => {
        if (Sentry.getClient()) return;
        Sentry.init({
          dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
          defaultIntegrations: false,
          integrations: [Sentry.globalHandlersIntegration()],
          sendDefaultPii: false,

          tracesSampleRate: 0,
          beforeSend: (event) => redactError(event),
        });
      })
      .catch(() => {});
  }, []);
  return null;
}
