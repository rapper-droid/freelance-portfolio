const url = process.env.NEXT_PUBLIC_SITE_URL;
if (
  !url ||
  !/^https:\/\/[^/]+\/?$/.test(url) ||
  new URL(url).username ||
  new URL(url).search ||
  new URL(url).hash ||
  ["localhost", "127.0.0.1"].includes(new URL(url).hostname)
)
  throw new Error(
    "Set NEXT_PUBLIC_SITE_URL to the final HTTPS origin before deploying.",
  );
if (new URL(url).hostname !== "tsudowa.com")
  throw new Error(
    "NEXT_PUBLIC_SITE_URL must use the approved tsudowa.com host.",
  );

const storageRequired =
  process.env.HOSTING_PLATFORM === "cloudflare" &&
  process.env.STATE_BACKEND === "durable-objects"
    ? []
    : ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"];
if (process.env.CONTACT_ENABLED === "true") {
  const required = [
    "RESEND_API_KEY",
    "CONTACT_FROM_EMAIL",
    "CONTACT_TO_EMAIL",
    "TURNSTILE_SECRET",
    "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
    ...storageRequired,
    "RATE_LIMIT_SALT",
  ];
  if (
    required.some((key) => !process.env[key]) ||
    process.env.RATE_LIMIT_SALT.length < 32
  )
    throw new Error("Contact configuration is incomplete (values redacted).");
  if (
    process.env.CONTACT_FROM_EMAIL !== "no-reply@tsudowa.com" ||
    process.env.CONTACT_TO_EMAIL !== "contact@tsudowa.com"
  )
    throw new Error(
      "Contact addresses do not match the approved TSUDOWA configuration.",
    );
}

if (
  (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true" ||
    process.env.ANALYTICS_ENABLED === "true") &&
  [
    "POSTHOG_PROJECT_KEY",
    "POSTHOG_HOST",
    ...storageRequired,
    "RATE_LIMIT_SALT",
  ].some((key) => !process.env[key])
)
  throw new Error("Analytics configuration is incomplete (values redacted).");

console.log("Production configuration validated (values redacted).");
