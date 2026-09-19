# Production candidate state — HEAD `580ebc6`, pre-cutover QA, 2026-09-18 JST

> History. tsudowa.com has since moved to the Workers (apex and www Custom
> Domains, 2026-09-18 JST) and the Visual Polish build is live; the current
> state is in [production status](production-status.md).

Current status document for the Cloudflare Workers migration. It supersedes the
gate verdicts in [final blockers](cloudflare-final-blockers.md) and the
[live contact checkpoint](cloudflare-live-contact-checkpoint.md); both remain as
history. Production still serves from Netlify. No Custom Domain, DNS, mail or
Netlify change has been made.

Branch: `tsudowa/cloudflare-workers-candidate`, HEAD
`580ebc627822f0cfba02df116d378fe011cd15c0`, working tree clean, no upstream, not
pushed. The other worktrees (`deb1cd0`, `220b6f7`) hold earlier states and are
not the candidate.

## Gates

| Gate        | Verdict                          | Basis                                                                |
| ----------- | -------------------------------- | -------------------------------------------------------------------- |
| METADATA    | READY                            | 10 routes x 3 widths plus 41-route SEO regression on the candidate   |
| PERFORMANCE | READY                            | 30 Lighthouse runs re-measured against the candidate host            |
| CONTACT     | READY pending production run     | Candidate is enabled and fails closed correctly; no production send  |
| WORKERS     | READY                            | Runtime, guards and Durable Objects verified on the candidate itself |
| CUTOVER     | READY_FOR_OWNER_CUTOVER_APPROVAL | Only the approved Custom Domain step and its smoke test remain       |

CONTACT carries an explicit condition: the candidate accepts, validates and rate
limits correctly, but no real inquiry has been delivered through it. That single
proof belongs to the post-cutover smoke test.

## Configuration — verified on the deployed candidate, names only

OWNER supplied the missing Resend Secret. Read back on 2026-09-18 from deployed
version `90f14877-dedf-482e-8db7-9e8e469be50c` (100%, message
`Add secret: RESEND_API_KEY`). No credential value was retrieved, printed,
logged or stored at any point.

| Item                           | `tsudowa-owner-preview` | `tsudowa-production` (candidate)  |
| ------------------------------ | ----------------------- | --------------------------------- |
| Deployed version               | `7f40949b` (100%)       | `90f14877` (100%)                 |
| Entry                          | `src/workers/entry.ts`  | `src/workers/production-entry.ts` |
| RESEND_API_KEY                 | present                 | **present**                       |
| TURNSTILE_SECRET               | present                 | present                           |
| RATE_LIMIT_SALT                | present                 | present, production-only value    |
| CONTACT_STATE / ASSETS         | bound                   | bound, separate DO namespace      |
| CONTACT_ENABLED                | `true`                  | `true`                            |
| CONTACT_FROM_EMAIL             | `no-reply@tsudowa.com`  | same                              |
| CONTACT_TO_EMAIL               | `contact@tsudowa.com`   | same                              |
| HOSTING_PLATFORM               | `cloudflare`            | same                              |
| STATE_BACKEND                  | `durable-objects`       | same                              |
| NEXT_PUBLIC_SITE_URL           | `https://tsudowa.com`   | same                              |
| NEXT_PUBLIC_TURNSTILE_SITE_KEY | present                 | present, same widget              |
| CONTACT_ORIGIN                 | preview origin override | **absent by design**              |
| OWNER_REVIEW                   | `true`                  | `false`                           |
| Custom Domains / routes        | none                    | none                              |

`GET /api/contact` now returns `{"enabled":true,...}` on the candidate.
`contactConfigured()` is satisfied for the first time on this Worker.

## Pre-cutover QA — 10 routes, candidate host

Audited routes: `/`, `/works`, `/demos/cafe`, `/demos/inbox`, `/demos/admin`,
`/demos/booking`, `/lab`, `/history`, `/contact`, `/contact/general`, each at
390, 768 and 1440 px. Raw report:
`outputs/production-precutover-20260918/candidate-qa.json`.

| Check                    | Result                                                             |
| ------------------------ | ------------------------------------------------------------------ |
| HTTP status              | 30/30 page loads returned 200                                      |
| Same-origin subresources | 0 responses at 4xx or 5xx, 0 failed requests, across all 3 widths  |
| Images                   | every image decoded; 0 broken at any width                         |
| Fonts                    | `document.fonts.status` is `loaded` on every route; family `inter` |
| JS runtime errors        | 0 page errors and 0 console errors at all 3 widths                 |
| Metadata                 | title and description present on all 10 routes                     |
| Canonical                | exact `https://tsudowa.com` target on all 10 routes                |
| OGP                      | title, description, url, image, type and locale present            |
| Twitter                  | card, title, description and image present                         |
| JSON-LD                  | present in `<head>` and parses on every route                      |
| robots                   | `/robots.txt` 200, disallows `/api/`, points at the apex sitemap   |
| sitemap                  | `/sitemap.xml` 200, 41 URLs, all on the canonical apex host        |
| Accessibility            | axe WCAG 2 A/AA: 0 violations on all 30 route/width combinations   |
| Internal links           | 75 links 200; 27 anchors resolved, 0 unverified                    |
| Responsive               | 0 horizontal overflow at 390, 768 and 1440                         |
| SEO regression           | existing 41-route suite PASS against the candidate                 |

The repository `qa:links` helper reports `/history#independent-demos` as broken
against **both** the candidate and the live Netlify site. Its route list never
visits `/history`, so it cannot collect that id. The anchor exists on both hosts
and the audit above resolves it. This is a known limitation of that helper, not a
site defect, and the helper was not modified.

Turnstile emits three cross-origin `challenges.cloudflare.com` 4xx responses per
width on the candidate. The widget does not allow this workers.dev hostname and
Cloudflare also challenges automated browsers; the allowlisted preview shows the
same class of response under automation. These are recorded separately from
application errors and are the expected refusal, not a fault.

## Durable Objects and contact guards — live on the candidate

Proven against the deployed candidate with requests that cannot send mail,
because rejection happens before the provider is contacted:

- Origin guard: a POST whose `Origin` is the candidate workers.dev host is
  rejected `403 origin`. Only the canonical apex origin is accepted.
- Body guard: a malformed payload is rejected `400 invalid`.
- Durable Objects rate limit: five well-formed requests carrying an invalid
  Turnstile token returned `403 spam`; the sixth returned `429 rate` with
  `Retry-After: 600`. The `CONTACT_STATE` binding, its counter and its TTL are
  therefore live in the production namespace.
- Turnstile is enforced: the invalid token never passed verification, so no owner
  mail, acknowledgement, receipt or Durable Object submission record was created.

This probe consumed the QA client rate-limit bucket for ten minutes on the
candidate only. No quota was exhausted, no mail was sent, no setting was changed.

The boundary script `scripts/workers-production.mjs` refuses to deploy unless the
config has the exact Worker name and account, zero routes, no `env`, no
`CONTACT_ORIGIN`, `OWNER_REVIEW=false`, the expected sender/recipient/site key,
`run_worker_first`, and no Secret name present as a plain variable. It strips the
three Secrets from build subprocesses and rejects a preview noindex leaking into
production assets. It has no Custom Domain path at all. Boundary tests: 25 pass
across `workers-production` and `preview-deploy-policy`.

## Performance — re-measured against the candidate

Lighthouse mobile simulated, three runs per route per host with alternating host
order, 30 runs total, plus three cold/warm navigation pairs per route per host.
These are laboratory medians, not field Core Web Vitals. Raw output:
`outputs/production-precutover-20260918/performance/`.

| Route        | Perf N / W | LCP ms N / W | TBT ms N / W | CLS N / W     | Cold TTFB ms N / W |
| ------------ | ---------- | ------------ | ------------ | ------------- | ------------------ |
| /            | 80 / 98    | 2260 / 2117  | 566 / 0      | 0.003 / 0.000 | 92 / 78            |
| /works       | 87 / 95    | 2548 / 2595  | 389 / 6      | 0.003 / 0.000 | 86 / 90            |
| /demos/cafe  | 96 / 95    | 2517 / 2650  | 88 / 1       | 0.003 / 0.000 | 89 / 20            |
| /demos/inbox | 97 / 97    | 2300 / 2281  | 99 / 7       | 0.003 / 0.000 | 117 / 50           |
| /contact     | 98 / 97    | 2009 / 2297  | 111 / 10     | 0.003 / 0.000 | 94 / 89            |

Accessibility and Best Practices medians are 100 on both hosts for all five
routes. The candidate wins decisively on TBT everywhere and holds CLS at exactly
zero. Honest regressions: FCP is slower on the candidate on all five routes
(for example 1186 to 1592 ms on TOP), and LCP is slower on `/works`,
`/demos/cafe` and `/contact`, the largest being `/contact` at +288 ms. Speed
Index improves substantially on TOP and `/works`. Several routes remain just
above the 2.5-second LCP good threshold on both hosts; no claim is made that
every metric is ideal or that field data will match.

## Netlify and DNS — unchanged and available for rollback

- `tsudowa.com` answers 200 from `Server: Netlify`; `www.tsudowa.com` returns
  301 to the apex. The Let's Encrypt certificate for `tsudowa.com` is valid to
  2026-12-16.
- Public DNS read back unchanged: apex A `75.2.60.5`, www CNAME
  `tsudowa.netlify.app`, three Cloudflare Email Routing MX records, SPF
  `include:_spf.mx.cloudflare.net`, and the Resend DKIM selector. Mail DNS was
  neither read for secrets nor modified.
- `netlify.toml` and the Upstash/Redis state adapter in `src/lib/state-provider.ts`
  are intact, so the Netlify build path still works without the Workers backend.
- The candidate Worker bundle contains no Upstash adapter.
- No Workers Custom Domain exists for this zone.

Local note: the working `dist/` currently holds a preview-target build. Any
redeploy must rebuild with `TSUDOWA_WORKERS_TARGET=production` through
`scripts/workers-production.mjs build`; the boundary guard would otherwise refuse.

## QA at this HEAD

lint PASS, unit 143/143 PASS across 18 files, boundary tests 25/25 PASS,
`prettier --check` on the Cloudflare docs PASS. The candidate audit above reports
zero failures. Not run this turn: the full Playwright E2E suite against the
candidate host, and any production mail delivery.

## Remaining blockers

1. `tsudowa.com` is not attached to the candidate Worker. Attaching a Custom
   Domain is an OWNER approval gate and has not been performed.
2. No real inquiry has been delivered through the candidate, so production mail
   delivery, Reply-To, Email Routing transit, the acknowledgement and the
   production Durable Object submission record are unproven. This is only
   testable after cutover, because the canonical origin check and the Turnstile
   host allowlist both refuse the workers.dev hostname by design.

Neither `CONTACT_ORIGIN`, the Turnstile allowlist, nor any Turnstile enforcement
was loosened to obtain a test, and none should be.

## Cutover

See [cutover and rollback simulation](cloudflare-cutover-simulation.md) for the
staged plan, the production smoke test and the rollback conditions. Until that
smoke test passes, do not report CONTACT as proven in production.

Evidence outside this repository, relative to the containing workspace:
`outputs/production-precutover-20260918/` (this QA and performance run),
`outputs/owner-diagnostics-20260918/` (preview live receipt and replay),
`outputs/workers-receipt-350b4ff8d9-20260918/` (mail delivery matching) and
`outputs/production-cutover-20260918/` (candidate status, DNS diff, checkpoint).
