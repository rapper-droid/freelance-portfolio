# Production status — tsudowa.com on Cloudflare Workers, 2026-09-24 JST

Current-state document. Earlier documents ([production candidate](cloudflare-production-candidate.md),
[cutover simulation](cloudflare-cutover-simulation.md), [PRODUCTION.md](PRODUCTION.md)
and the rest of `docs/cloudflare-*.md`) are kept as history. No credential value
was retrieved, printed or stored while producing this record; secrets are listed
by name only.

## What is live

| Item     | Value                                                                                                                                                   |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Origin   | `https://tsudowa.com` (TSUDOWA + TETSU WORKS, 47 routes in the sitemap plus 14 noindex shop routes)                                                     |
| Worker   | `tsudowa-production`                                                                                                                                    |
| Version  | `46f3f849-ae09-4d57-a36d-e4c158f89ffd`                                                                                                                  |
| Deployed | 2026-09-24 JST with `node scripts/workers-production.mjs deploy-candidate`                                                                              |
| Source   | `tsudowa/cloudflare-workers-candidate` = `6d2668f` (merge of PR #6, tree identical to `ec4422e`)                                                        |
| Content  | The operable demos: KISSA and FORME, the shared operations record behind RELAY / SMART INBOX / ADMIN, and the rebuilt STILL, REFINE, SHIP and FLOWSTATE |

### Not on production yet

`e4c7c66` (P4 — the catalogue's descriptions, the routes into the shops from
/works, /works/<category>, /projects/<slug>, partners and rescue, the dated
build records, and `portfolio_working_version_click`) is committed on
`claude/ultimate-experience-20260923` and **has not been deployed**. Releasing
it needs the owner's approval, then the usual path: PR into
`tsudowa/cloudflare-workers-candidate`, then
`node scripts/workers-production.mjs deploy-candidate`.

### Verified after this deployment, against `https://tsudowa.com`

| Check                                      | Result                                     |
| ------------------------------------------ | ------------------------------------------ |
| Route smoke, 33 routes                     | all 200                                    |
| `QA_BASE_URL=https://tsudowa.com qa:kissa` | 56/56                                      |
| `QA_BASE_URL=https://tsudowa.com qa:forme` | 62/62                                      |
| Runtime errors across 12 routes            | none                                       |
| RELAY → SMART INBOX on production          | case filed, 7 tickets in the inbox         |
| Downloads (FLOWSTATE, STILL)               | real files, correct names                  |
| `/kissa`, `/forme`                         | `noindex, follow`; absent from the sitemap |
| `/api/analytics` on GET                    | 405, which is its contract                 |
| `/api/contact`                             | 200 (enabled; nothing was sent)            |
| Unknown route                              | 404                                        |

Two defects were found by deploying rather than by testing, fixed, and the
fix verified on the preview before this release:

1. `runtime/ids.ts` imported `node:crypto`, which the Workers client bundle
   does not have. Adding to cart threw and the cart stayed empty, while every
   local test passed. SHA-256 is now implemented in `runtime/sha256.ts`,
   synchronous and byte-identical to Node's, so no derived id changed.
2. Three scrollable regions had no keyboard access. CI caught one at 768px
   that the local run did not; the other two were latent.

## Rollback

1. **Primary:** roll the Worker back to the version this release replaced,
   `9aaaed9e-1069-483c-aa64-01b2895d4e5c` — Workers & Pages >
   tsudowa-production > Deployments > Rollback, or
   `npx wrangler rollback 9aaaed9e-1069-483c-aa64-01b2895d4e5c --name tsudowa-production`.
   No DNS or mail change is involved. Earlier releases, oldest last:
   `609058eb`, `cfb7abac`, `2bdd0b86`, `ab261d93`, `e41e0535`.
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
- Real inquiry through production, on OWNER request, 2026-09-19 18:50 UTC:
  one submission from `/contact/general` in Chrome at 390px (compact
  Turnstile solved, no overflow). `POST /api/contact` 200 `accepted`,
  confirmation `sent`, receipt `TSW-260919-B9B38B38AF` shown in the success
  panel. Both mails were delivered (Resend) and reached the owner's Gmail inbox
  within about five seconds:
  - owner notice — From `TSUDOWA <no-reply@tsudowa.com>`, To
    `contact@tsudowa.com` via Cloudflare Email Routing, Reply-To the
    submitter, source page `/contact/general`;
  - receipt — Reply-To `contact@tsudowa.com`, plain text and HTML.

  Same receipt number and received time in both; DKIM (`tsudowa.com`) and SPF
  pass. Only one POST left the browser. The earlier real inquiry
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
- The production test inquiry `TSW-260919-B9B38B38AF` is in the owner's inbox
  (two mails, subject "[TSUDOWA][OTHER][未定] TSUDOWA 本番テスト様からのご相談"
  and its receipt); it needs no reply.

Evidence (screenshots, audit JSON, logs) is outside the repository under
`outputs/visual-polish-release-20260920/`.
