export const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Root-relative, email-safe source paths only. Reject line breaks and external URLs.
const pagePattern = /^\/[A-Za-z0-9\-\/_#?=&.]{0,120}$/;

// User-provided values must never create additional email headers.
export const headerSafe = (value: string) =>
  value.replace(/[\r\n]+/g, " ").trim();

export function validateContact(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const text = (key: string, min: number, max: number) =>
    typeof v[key] === "string" &&
    (v[key] as string).trim().length >= min &&
    (v[key] as string).length <= max;
  // Optional text is still length-bounded whenever it is present.
  const optional = (key: string, max: number) =>
    v[key] === undefined || v[key] === "" || text(key, 1, max);
  if (
    !text("email", 3, 254) ||
    !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(v.email as string) ||
    !text("detail", 10, 2000) ||
    !text("kind", 1, 80) ||
    !text("budget", 1, 80) ||
    !text("token", 1, 2048) ||
    !text("name", 1, 80) ||
    !optional("company", 80) ||
    !(
      v.page === undefined ||
      (typeof v.page === "string" && pagePattern.test(v.page))
    ) ||
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
    name: (v.name as string).trim(),
    company: typeof v.company === "string" ? v.company.trim() : "",
    page: typeof v.page === "string" ? v.page : "",
    token: v.token as string,
    id: v.id,
  };
}

// Keep every value visibly labeled, plus the safe reply address and reference id.
export function contactEmailText(value: {
  name: string;
  email: string;
  company: string;
  kind: string;
  budget: string;
  detail: string;
  page: string;
  id: string;
  receivedAt: string;
}) {
  const row = (label: string, text: string) => `${label}: ${text}`;
  return [
    row("お名前", value.name),
    ...(value.company ? [row("会社名・屋号", value.company)] : []),
    row("メールアドレス", value.email),
    row("問い合わせ種類", value.kind),
    row("ご予算", value.budget),
    "",
    "--- お問い合わせ内容 ---",
    value.detail,
    "",
    "--- 受付情報 ---",
    row("送信元ページ", value.page || "(不明)"),
    row("受信日時", value.receivedAt),
    row("受付番号", value.id),
    "",
    "このメールにそのまま返信すると、送信者へ届きます。",
  ].join("\n");
}

export function contactConfigured() {
  return (
    process.env.CONTACT_ENABLED === "true" &&
    [
      "RESEND_API_KEY",
      "CONTACT_FROM_EMAIL",
      "CONTACT_TO_EMAIL",
      "TURNSTILE_SECRET",
      "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
      "NEXT_PUBLIC_SITE_URL",
      "UPSTASH_REDIS_REST_URL",
      "UPSTASH_REDIS_REST_TOKEN",
      "RATE_LIMIT_SALT",
    ].every((key) => !!process.env[key])
  );
}
