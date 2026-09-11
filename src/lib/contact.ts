export const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function validateContact(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const text = (key: string, min: number, max: number) =>
    typeof v[key] === "string" &&
    (v[key] as string).trim().length >= min &&
    (v[key] as string).length <= max;
  if (
    !text("email", 3, 254) ||
    !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(v.email as string) ||
    !text("detail", 10, 2000) ||
    !text("kind", 1, 80) ||
    !text("budget", 1, 80) ||
    !text("token", 1, 2048) ||
    typeof v.id !== "string" ||
    !uuidPattern.test(v.id) ||
    v.consent !== true ||
    v.website !== ""
  )
    return null;
  return {
    email: (v.email as string).trim(),
    detail: (v.detail as string).trim(),
    kind: (v.kind as string).trim(),
    budget: (v.budget as string).trim(),
    token: v.token as string,
    id: v.id,
  };
}
export function contactConfigured() {
  return (
    process.env.CONTACT_ENABLED === "true" &&
    [
      "RESEND_API_KEY",
      "CONTACT_FROM",
      "CONTACT_TO",
      "TURNSTILE_SECRET",
      "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
      "NEXT_PUBLIC_SITE_URL",
      "UPSTASH_REDIS_REST_URL",
      "UPSTASH_REDIS_REST_TOKEN",
      "RATE_LIMIT_SALT",
    ].every((k) => !!process.env[k])
  );
}
