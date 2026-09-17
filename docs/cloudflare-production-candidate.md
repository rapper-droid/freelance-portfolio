# Production candidate state — HEAD `975cdf9`, 2026-09-18 JST

Current status document for the Cloudflare Workers migration. It supersedes the
gate verdicts in [final blockers](cloudflare-final-blockers.md) and the
[live contact checkpoint](cloudflare-live-contact-checkpoint.md); both remain as
history. Production still serves from Netlify. CUTOVER is BLOCKED.

Branch: `tsudowa/cloudflare-workers-candidate`, HEAD
`975cdf998b9e253114d16a336f22c2ce045e3078`, working tree clean, no upstream, not
pushed. The other worktrees (`deb1cd0`, `220b6f7`) hold earlier states and are
not the candidate.

## Gates

| Gate        | Verdict                     | Basis                                                                        |
| ----------- | --------------------------- | ---------------------------------------------------------------------------- |
| METADATA    | READY                       | Initial-head metadata verified on the deployed production candidate          |
| PERFORMANCE | READY (preview measurement) | Connected comparison on the preview Worker; not re-measured on the candidate |
| CONTACT     | READY on preview only       | One real inquiry `TSW-260917-350B4FF8D9` delivered end to end                |
| WORKERS     | READY on preview only       | Same preview evidence; the candidate cannot accept a live inquiry yet        |
| CUTOVER     | BLOCKED                     | Candidate `RESEND_API_KEY` absent; no Custom Domain; no production inquiry   |

Do not read the preview CONTACT and WORKERS evidence as production readiness. The
two Workers are separate applications with separate Durable Object namespaces.

## Live contact evidence — preview, superseding the earlier BLOCKED verdicts

The preview gate closed after the earlier documents were written. A real inquiry
was accepted through the ordinary `/contact/general` form with a human-solved
Turnstile challenge on the owner preview.

- Receipt `TSW-260917-350B4FF8D9`, internal request ID
  `aad7daa5-7b9d-4ff8-acb4-97a199c4fc92`.
- Both mails reached OWNER Gmail with Resend `delivered` status: the owner mail
  and the automatic acknowledgement, sent 2026-09-18 01:42:49 / 01:42:50 JST.
- From is `TSUDOWA <no-reply@tsudowa.com>` on both. The owner mail Reply-To is the
  sender address; the acknowledgement Reply-To is `contact@tsudowa.com`.
- Gmail Received and forwarding headers confirm Cloudflare Email Routing transit
  from the contact address. SPF and DKIM pass. DMARC is recorded as `none`; no DNS
  record was changed.
- Durable Object records were read for this receipt: receipt mapping, payload
  hash, receipt metadata, owner-sent and acknowledgement-sent flags, no stale
  lock. Stored values, `createdAt` and expiry were identical before and after the
  duplicate check; no TTL was extended.
- Duplicate replay returned the existing receipt as `duplicate` and `idempotent`
  with zero additional mail: Gmail stayed at two messages for this receipt and the
  Resend list stayed at six entries.

Limits that remain true: the duplicate replay used a temporary owner-only endpoint
that cannot send mail, not a second submission to `/api/contact`. Provider-error,
quota, concurrency and TTL regressions run in workerd with real SQLite but
intercepted Turnstile and Resend. The application stores no historical duplicate
counter, and none was invented.

The temporary diagnostics were added in `05b1434` and removed in `c0e3710` with an
exactly symmetric diff (+486 / -486 lines). HEAD contains no diagnostic route,
RPC, flag or Secret. Past commits and Worker versions remain as audit history.

## Two Workers — verified configuration, names only

Read back from the deployed versions on 2026-09-18. No credential value was
retrieved, printed or stored.

| Item                           | `tsudowa-owner-preview` | `tsudowa-production` (candidate)  |
| ------------------------------ | ----------------------- | --------------------------------- |
| Deployed version               | `7f40949b` (100%)       | `2e2709c1` (100%)                 |
| Entry                          | `src/workers/entry.ts`  | `src/workers/production-entry.ts` |
| RESEND_API_KEY                 | present                 | **absent**                        |
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

`GET /api/contact` returns `{"enabled":true,...}` on the preview and
`{"enabled":false}` on the candidate. The candidate fails closed because
`contactConfigured()` requires `RESEND_API_KEY`; this is the designed behavior,
not a fault.

## Why the candidate cannot be contact-tested at its workers.dev URL

Two independent guards make a live inquiry against
`tsudowa-production.tetsuyasmile52l.workers.dev` impossible on purpose:

- With no `CONTACT_ORIGIN` override, `contactOrigin()` resolves to the canonical
  `https://tsudowa.com`, so a submission from the workers.dev hostname is rejected
  as a wrong origin.
- The TSUDOWA-CONTACT Turnstile widget allows apex, www and the preview hostname
  only. The candidate hostname is deliberately not in that allowlist.

Do not add the candidate hostname to `CONTACT_ORIGIN` or to the widget in order to
obtain a test. The production contact path is verifiable only once the candidate
serves `tsudowa.com` under an approved cutover.

## Production candidate additions at this HEAD

`975cdf9` introduces the isolated candidate without touching the preview:

- `wrangler.production.jsonc` for `tsudowa-production`: no routes, `preview_urls`
  off, `run_worker_first` assets, `OWNER_REVIEW=false` and no `CONTACT_ORIGIN`.
- `src/workers/production-entry.ts` wraps the shared app: a 308 redirect from
  `www.tsudowa.com` to the apex, the worker-first asset ordering that redirect
  requires, and `X-Robots-Tag: noindex, nofollow, noarchive` on any `.workers.dev`
  hostname so the candidate URL stays out of search.
- `vite.config.ts` selects the config through `TSUDOWA_WORKERS_TARGET=production`.
- `scripts/workers-production.mjs` with `tests/unit/workers-production.test.ts`
  guards the candidate deployment.
- The WebSite JSON-LD moved from `<body>` into `<head>` in `src/app/layout.tsx`.

Worker-first ordering initially caused `_next` static 404s; the production-only
wrapper fixes it and a regression test covers it. A live recheck of 65 referenced
assets passed.

## Verified on the deployed candidate

- `/`, `/works`, `/demos/cafe`, `/demos/inbox`, `/demos/admin`, `/demos/booking`,
  `/lab`, `/history`, `/contact/general`: HTTP 200. 65 referenced assets 200.
- `/demos/cafe` fetched as Googlebot has title, description, canonical, OGP and
  Twitter tags inside the initial `<head>`. Cafe keeps the shared `og-hq.png`.
- `X-Robots-Tag: noindex, nofollow, noarchive` present on the candidate origin.
- Ten candidate routes carry canonical, title and description.

QA at this HEAD: Workers build, lint, Next typegen/typecheck and Workers typecheck
pass; unit 143/143 pass. Full browser E2E, image decode, accessibility, real
Turnstile, real mail, production Durable Object behavior and post-cutover
performance have **not** been run against the candidate.

## Netlify and DNS — unchanged

`tsudowa.com` still answers from Netlify with HTTP 200. All 11 DNS records are
unchanged, including all nine protected mail records: apex A `75.2.60.5`, www
CNAME `tsudowa.netlify.app`, Email Routing MX, SPF, DKIM and the Resend selector.
The Netlify certificate is valid to 2026-12-16. No Workers Custom Domain or
certificate is attached. The Netlify adapter and environment stay intact for
rollback until a separate retirement approval.

## Remaining blockers

1. `RESEND_API_KEY` is absent on `tsudowa-production`. OWNER stores it directly in
   Cloudflare Workers & Pages > `tsudowa-production` > Settings > Variables and
   Secrets as an encrypted Secret, using a sending-only Resend key scoped to the
   verified `tsudowa.com` domain. The value never appears in chat, source, docs,
   logs, screenshots or a command-line argument. Preview keys stay valid.
2. No Workers Custom Domain exists for the zone. Attaching one is a separate OWNER
   approval; see the [cutover and rollback simulation](cloudflare-cutover-simulation.md).
3. No production inquiry has been sent, so production contact, mail delivery,
   Reply-To and the production Durable Object namespace are unverified.
4. Browser E2E, accessibility, image and performance suites have not been re-run
   against the candidate.

## Next steps, in order

1. OWNER stores the candidate `RESEND_API_KEY` as described above.
2. Re-check Secret names and the runtime preflight, rebuild this HEAD and redeploy
   the candidate; confirm `GET /api/contact` reports enabled.
3. Run the candidate browser, accessibility, image and performance suites and
   capture a fresh DNS and status checkpoint.
4. Request explicit OWNER approval for the staged Custom Domain cutover, carrying
   the rollback conditions from the simulation. No automatic re-cutover after a
   rollback.
5. After cutover, send one real production inquiry, verify both mails, the receipt
   and identity matching, then repeat the same payload with a fresh Turnstile
   token and confirm no duplicate mail.

Until step 5 completes, do not report CONTACT or WORKERS as READY for production.

Evidence outside this repository, relative to the containing workspace:
`outputs/owner-diagnostics-20260918/` (live receipt, replay, cleanup),
`outputs/workers-receipt-350b4ff8d9-20260918/` (mail delivery matching) and
`outputs/production-cutover-20260918/` (candidate status, DNS diff, checkpoint).
