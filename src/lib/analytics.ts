import { categories, projects } from "./portfolio";
import { offerRoutes } from "./offer-routes";
export const eventNames = [
  "contact_started",
  "category_selected",
  "contact_submitted",
  "contact_success",
  "contact_error",
  "portfolio_visit",
  "portfolio_price_view",
  "portfolio_contact_open",
  "portfolio_contact_submit",
  "portfolio_contact_success",
  "portfolio_category_view",
  "portfolio_project_open",
  "portfolio_live_demo_click",
  "portfolio_delivery_info_view",
  "portfolio_copy_contact_message",
  // Growth funnel (docs/growth/IMPLEMENTATION_MAP.md). Names describe what
  // happened in the browser only: "brief_created" is a brief that was
  // copied or carried to the form, never a sent or accepted inquiry.
  "service_view",
  "brief_created",
  "consultation_cta_clicked",
  "tool_started",
  "tool_completed",
  // Real-utility sample funnel (指示書 §19). Counts only: which step of the
  // sample was reached. No message body, file name or result ever travels
  // with these — the parameters are the fixed set below.
  "scenario_started",
  "first_result_seen",
  "sample_completed",
  "second_run_completed",
  "exception_reviewed",
  "consultation_started",
] as const;
export type PortfolioEvent = (typeof eventNames)[number];
export function safeEvent(value: unknown): {
  event: PortfolioEvent;
  category?: string;
  project?: string;
  offer?: string;
} | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (!eventNames.includes(row.event as PortfolioEvent)) return null;
  if (
    row.category !== undefined &&
    !categories.some((c) => c.id === row.category)
  )
    return null;
  if (
    row.project !== undefined &&
    !projects.some((p) => p.slug === row.project)
  )
    return null;
  if (row.offer !== undefined && !Object.hasOwn(offerRoutes, String(row.offer)))
    return null;
  return {
    event: row.event as PortfolioEvent,
    ...(typeof row.category === "string" ? { category: row.category } : {}),
    ...(typeof row.project === "string" ? { project: row.project } : {}),
    ...(typeof row.offer === "string" ? { offer: row.offer } : {}),
  };
}
export function posthogPayload(value: unknown, key: string, id: string) {
  const event = safeEvent(value);
  if (!event) return null;
  return {
    api_key: key,
    event: event.event,
    distinct_id: id,
    properties: {
      ...(event.category ? { category: event.category } : {}),
      ...(event.project ? { project: event.project } : {}),
      ...(event.offer ? { offer: event.offer } : {}),
      ...attribution(value),
      $process_person_profile: false,
      $geoip_disable: true,
      $ip: "0.0.0.0",
    },
  };
}
/**
 * Server-side switch, read from the Worker's runtime variables. It is
 * deliberately not a NEXT_PUBLIC_* value: those are inlined when the bundle is
 * built, so the deployed Worker would obey whatever was set on the build
 * machine, and the bundler would fold the branch away. The NEXT_PUBLIC flag
 * still governs whether the browser sends anything at all.
 */
export function analyticsAllowed() {
  return process.env.ANALYTICS_ENABLED === "true";
}
export function analyticsEndpoint() {
  const host = process.env.POSTHOG_HOST;
  return host &&
    ["https://us.i.posthog.com", "https://eu.i.posthog.com"].includes(host)
    ? `${host}/i/v0/e/`
    : null;
}

export function attribution(value: unknown) {
  const row = value as Record<string, unknown>;
  return {
    source: ["crowdworks", "lancers", "coconala", "direct", "other"].includes(
      String(row?.source),
    )
      ? row.source
      : "direct",
  };
}
export function sessionId(value: unknown) {
  const row = value as Record<string, unknown>;
  return typeof row?.session === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      row.session,
    )
    ? row.session
    : null;
}
