import type { NextConfig } from "next";
const config: NextConfig = {
  poweredByHeader: false,
  // Workers candidate: resolve generated metadata into the initial head for
  // every user agent. Keep the original Next/Netlify build behavior unchanged.
  ...(process.env.HOSTING_PLATFORM === "cloudflare"
    ? { htmlLimitedBots: /.*/ }
    : {}),
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          ...(process.env.OWNER_REVIEW === "true"
            ? [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }]
            : []),
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          {
            key: "Content-Security-Policy",
            value:
              "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; frame-src https://challenges.cloudflare.com",
          },
          ...(process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://")
            ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }]
            : []),
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};
export default config;
