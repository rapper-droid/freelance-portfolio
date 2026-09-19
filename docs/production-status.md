# Production status — tsudowa.com on Cloudflare Workers, 2026-09-20 JST

Current-state document. Earlier documents ([production candidate](cloudflare-production-candidate.md),
[cutover simulation](cloudflare-cutover-simulation.md), [PRODUCTION.md](PRODUCTION.md)
and the rest of `docs/cloudflare-*.md`) are kept as history. No credential value
was retrieved, printed or stored while producing this record; secrets are listed
by name only.

## What is live

| Item     | Value                                                                                                   |
| -------- | ------------------------------------------------------------------------------------------------------- |
| Origin   | `https://tsudowa.com` (TSUDOWA + TETSU WORKS, 53 public routes)                                         |
| Worker   | `tsudowa-production`                                                                                    |
| Version  | `e41e0535-a084-4d74-9eff-cf69e040323e` (100%), deployment `3f2dd8cc-dbd4-4629-8496-00fb1d756d31`        |
| Deployed | 2026-09-19 17:52 UTC (2026-09-20 02:52 JST) with `node scripts/workers-production.mjs deploy-candidate` |
| Source   | `tsudowa/cloudflare-workers-candidate` = `claude/visual-polish-20260918` = `8b0f7ee` (both on origin)   |
| Content  | Visual Polish ([VISUAL_POLISH.md](VISUAL_POLISH.md)) plus the release fixes listed there                |
| Preview  | `tsudowa-owner-preview` version `90cd99dc-225d-451f-9105-19291da84949`, same commit, noindex            |

## Rollback

1. **Primary:** roll the Worker back to the previous production version
   `90f14877-dedf-482e-8db7-9e8e469be50c` (pre-Visual-Polish build; deployment
   `2e189075-7b10-464d-83e4-94edc6e06d39`) — Workers & Pages > tsudowa-production >
   Deployments > Rollback, or `npx wrangler rollback 90f14877-dedf-482e-8db7-9e8e469be50c --name tsudowa-production`.
   No DNS or mail change is involved.
2. **Last resort only** (a Worker rollback cannot restore service): the retained
   Netlify known-good deploy `6aabc4aec1247183915ad890`
   (`https://6aabc4aec1247183915ad890--tsudowa.netlify.app`, HTTP 200 on
   2026-09-20). Switching back needs the Custom Domain / DNS steps in
   [cutover simulation](cloudflare-cutover-simulation.md) and a separate OWNER
   decision. Netlify project, deploy, environment and certificate are kept.

## Domains, TLS and redirects

- Workers Custom Domains: `tsudowa.com` and `www.tsudowa.com`, both on
  `tsudowa-production`. `www` answers 308 to the apex with path and query kept.
- Always Use HTTPS: **ON** (zone setting, changed 2026-09-18 21:29 UTC).
  `http://tsudowa.com/works?x=1` → 301 → `https://tsudowa.com/works?x=1` → 200;
  `http://www.tsudowa.com/…` reaches the HTTPS apex in two hops; no loop.
- Certificates: advanced packs for `tsudowa.com, *.tsudowa.com` and
  `tsudowa.com, www.tsudowa.com, *.www.tsudowa.com` active until 2026-12-16;
  universal pack active, backup issued.
- The production deploy did not touch routes, Custom Domains or DNS
  (`routes: []`; wrangler only publishes domains listed in the config).

## DNS and mail — unchanged

Eleven records before and after the deploy, byte-identical (SHA-256 of the full
record set `125fa6a9…`, of the nine mail records `6646dfb1…`):

- Web: `AAAA tsudowa.com 100::` and `AAAA www.tsudowa.com 100::`, proxied
  (created by the Custom Domains).
- Mail: apex MX `route1/2/3.mx.cloudflare.net`, apex SPF, Cloudflare DKIM
  `cf2024-1._domainkey`, Resend DKIM `resend._domainkey`, Return-Path
  `send` MX and SPF (Amazon SES), `rsend` CNAME.
- Email Routing enabled / ready; the `contact@tsudowa.com` forward rule is
  enabled and its rule set hash is unchanged.

## Contact readiness

- `GET /api/contact` → `enabled: true` with the public Turnstile site key.
- Secrets present (names): `RESEND_API_KEY`, `TURNSTILE_SECRET`, `RATE_LIMIT_SALT`.
  Bindings: `CONTACT_STATE` (Durable Object `ContactState`), `ASSETS`.
- Turnstile keeps its site key, action, hostname list, secret and server-side
  verification. Only the widget size is chosen by the layout (compact below
  300px of form width, flexible above).
- No new real inquiry was sent in this release; mail sending code was not
  changed. The only real inquiry recorded in this repository
  (`TSW-260917-350B4FF8D9`) went through the preview Worker; see the
  [live contact checkpoint](cloudflare-live-contact-checkpoint.md).

## Release QA (preview, then production)

| Check                                                                                                                                               | Preview `90cd99dc`                         | Production `e41e0535`                                        |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------ |
| 53 routes × 8 widths (320–1920): status, overflow, escaping elements, clipped text, images and decode, fonts, console, page errors, failed requests | 424 / 424 clean                            | 424 / 424 clean                                              |
| axe WCAG 2.0–2.2 A/AA                                                                                                                               | 0 violations in 424 runs                   | 0 violations in 424 runs                                     |
| Text covered by another element (every rendered line)                                                                                               | 0 / 424                                    | 0 / 424                                                      |
| Real Turnstile, 26 form routes × 320/360/390/430                                                                                                    | 104 / 104 inside, no overflow              | 104 / 104 inside, no overflow                                |
| Turnstile solved in Chrome, `/contact` + `/contact/general` × 4 widths                                                                              | 8 / 8                                      | 8 / 8 (two on a second attempt)                              |
| Menus, keyboard focus, hover, form validation (nothing sent), reduced motion                                                                        | 55 / 55                                    | 55 / 55                                                      |
| Metadata: title, description, canonical, OGP, Twitter, JSON-LD, h1                                                                                  | identical to previous production on all 53 | same; apex has no noindex; `/experience/*` noindex as before |

Gates on `8b0f7ee`: lint, Next typegen + typecheck, unit 143/143, Next build,
Workers typecheck, Prettier (whole repository, line endings aside), E2E on the
Next build 150/150, production Workers build, E2E on the exact deployed
Workers artifact in local workerd 150/150. Credential patterns, `eval` and new
`innerHTML` in the diff since `895f97b`: 0; dependency changes: 0. `npm audit`
(production and all dependencies): 0 vulnerabilities, run after the deploy
because the registry answered 503 (maintenance) during the gates.

Lighthouse (mobile, median of three), production before → after on the same
host: `/` 95 → 95, `/works` 92 → 92, `/contact` 94 → 94, `/demos/cafe` 92 → 91;
LCP within +10–140 ms (run-to-run range), CLS 0.000 everywhere. The new build on
the workers.dev preview scored 99 / 95 / 97 / 95.

## Follow-up for OWNER

- **Privacy wording (OWNER / legal review recommended).** `/privacy` states
  that send counts and duplicate checks are kept, for a limited time, in the
  hosting platform's store — "Cloudflare Durable Objects または Upstash" — and
  that message bodies, e-mail addresses and raw IP addresses are not stored.
  This matches the code (Durable Objects on Workers, Upstash on the retained
  Netlify build), but the wording names technical services and was not
  reviewed by the owner or counsel. No new legal promise, guarantee or
  disclaimer was added in this release.
- A real end-to-end inquiry through the production Worker is not recorded
  here and was not sent in this release; send one when convenient (the form
  code path is unchanged).

Evidence (screenshots, audit JSON, logs) is outside the repository under
`outputs/visual-polish-release-20260920/`.
