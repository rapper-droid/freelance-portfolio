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
if (process.env.CONTACT_ENABLED === "true") {
  const required = [
    "RESEND_API_KEY",
    "CONTACT_FROM",
    "CONTACT_TO",
    "TURNSTILE_SECRET",
    "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "RATE_LIMIT_SALT",
  ];
  if (
    required.some((k) => !process.env[k]) ||
    process.env.RATE_LIMIT_SALT.length < 32
  )
    throw new Error("Contact configuration is incomplete (values redacted).");
}
if (
  process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true" &&
  [
    "POSTHOG_PROJECT_KEY",
    "POSTHOG_HOST",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "RATE_LIMIT_SALT",
  ].some((k) => !process.env[k])
)
  throw new Error("Analytics configuration is incomplete (values redacted).");
console.log("Production configuration validated (values redacted).");
