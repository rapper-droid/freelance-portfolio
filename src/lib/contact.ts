import {
  contactBudgets,
  contactKinds,
  contactStages,
  contactTimings,
  contactContext,
  safeReference,
} from "./contact-options";
export const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const headerSafe = (value: string) =>
  value.replace(/[\r\n]+/g, " ").trim();
export function validateContact(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  const text = (k: string, min: number, max: number) =>
    typeof v[k] === "string" &&
    (v[k] as string).trim().length >= min &&
    (v[k] as string).length <= max;
  const optional = (k: string, max: number) =>
    v[k] === undefined || v[k] === "" || text(k, 1, max);
  const choice = (k: string, values: readonly string[], fallback: string) =>
    v[k] === undefined || v[k] === ""
      ? fallback
      : typeof v[k] === "string" && values.includes(v[k] as string)
        ? (v[k] as string)
        : null;
  const kind = choice("kind", contactKinds, contactKinds[7]),
    budget = choice("budget", contactBudgets, "未定"),
    stage = choice("stage", contactStages, contactStages[5]),
    timing = choice("timing", contactTimings, "未定");
  const page = v.page === undefined ? "/" : v.page;
  const context = typeof page === "string" ? contactContext(page) : null;
  if (
    !text("name", 1, 80) ||
    /[\u0000-\u001f\u007f]/.test(v.name as string) ||
    !text("email", 3, 254) ||
    !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(v.email as string) ||
    !text("detail", 10, 2000) ||
    !text("token", 1, 2048) ||
    !optional("company", 80) ||
    !optional("reference", 2000) ||
    !optional("supplement", 1000) ||
    !kind ||
    !budget ||
    !stage ||
    !timing ||
    !context ||
    typeof v.id !== "string" ||
    !uuidPattern.test(v.id) ||
    v.consent !== true ||
    v.website !== ""
  )
    return null;
  for (const key of ["category", "project", "demo"] as const)
    if (v[key] !== undefined && v[key] !== context[key]) return null;
  const reference = typeof v.reference === "string" ? v.reference.trim() : "";
  if (!safeReference(reference)) return null;
  return {
    name: (v.name as string).trim(),
    company: typeof v.company === "string" ? v.company.trim() : "",
    email: (v.email as string).trim(),
    detail: (v.detail as string).trim(),
    kind,
    budget,
    stage,
    timing,
    reference,
    supplement: typeof v.supplement === "string" ? v.supplement.trim() : "",
    ...context,
    id: v.id.toLowerCase(),
    token: v.token as string,
  };
}
export type ContactValue = NonNullable<ReturnType<typeof validateContact>>;
export function contactPayload(v: ContactValue) {
  const {
    name,
    company,
    email,
    detail,
    kind,
    budget,
    stage,
    timing,
    reference,
    supplement,
    page,
    category,
    project,
    demo,
  } = v;
  return {
    name,
    company,
    email,
    detail,
    kind,
    budget,
    stage,
    timing,
    reference,
    supplement,
    page,
    category,
    project,
    demo,
  };
}
export function contactOrigin(): URL | null {
  try {
    const canonical = new URL(process.env.NEXT_PUBLIC_SITE_URL!);
    const override = process.env.CONTACT_ORIGIN;
    if (override) {
      if (
        process.env.HOSTING_PLATFORM !== "cloudflare" ||
        process.env.OWNER_REVIEW !== "true" ||
        override !==
          "https://tsudowa-owner-preview.tetsuyasmile52l.workers.dev" ||
        canonical.origin !== "https://tsudowa.com"
      )
        return null;
      return new URL(override);
    }
    return canonical;
  } catch {
    return null;
  }
}
export function contactConfigured() {
  return (
    process.env.CONTACT_ENABLED === "true" &&
    contactOrigin() !== null &&
    [
      "RESEND_API_KEY",
      "CONTACT_FROM_EMAIL",
      "CONTACT_TO_EMAIL",
      "TURNSTILE_SECRET",
      "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
      "NEXT_PUBLIC_SITE_URL",
      "RATE_LIMIT_SALT",
    ].every((k) => !!process.env[k]) &&
    ((process.env.HOSTING_PLATFORM === "cloudflare" &&
      process.env.STATE_BACKEND === "durable-objects") ||
      !!(
        process.env.UPSTASH_REDIS_REST_URL &&
        process.env.UPSTASH_REDIS_REST_TOKEN
      ))
  );
}
