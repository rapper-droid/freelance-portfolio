import { categories, projects } from "./portfolio";
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
] as const;
export type PortfolioEvent = (typeof eventNames)[number];
export function safeEvent(
  value: unknown,
): { event: PortfolioEvent; category?: string; project?: string } | null {
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
  return {
    event: row.event as PortfolioEvent,
    ...(typeof row.category === "string" ? { category: row.category } : {}),
    ...(typeof row.project === "string" ? { project: row.project } : {}),
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
      ...attribution(value),
      $process_person_profile: false,
      $geoip_disable: true,
      $ip: "0.0.0.0",
    },
  };
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
    source: ["crowdworks", "lancers", "direct", "other"].includes(
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
