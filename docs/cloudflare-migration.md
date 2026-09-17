# TSUDOWA Cloudflare Workers migration — owner preview only

Latest status: [production candidate state](cloudflare-production-candidate.md); the [final blocker phase](cloudflare-final-blockers.md) is now history. Use the newer [names-only manifest](cloudflare-production-manifest.md) and [web-only rollback simulation](cloudflare-cutover-simulation.md); the initial audit below is retained as history.

## Follow-up status: Lighthouse / Playwright authorized, 2026-09-17

The initial audit below is historical. The owner subsequently authorized Lighthouse / Playwright comparisons and Cloudflare-native contact preparation, but **not production cutover**. The current implementation supersedes the initial original-image and Upstash limitations:

- Known local Next/Image raster requests now use build-time responsive WebP assets while preserving existing srcset/sizes. 227 source images produce 1,692 variants; originals are retained. Unsupported requests keep the framework fallback. No paid Images service is provisioned.
- `CONTACT_STATE` is a SQLite Durable Object binding; `STATE_BACKEND=durable-objects` selects private native state for Workers. Netlify retains its original adapter. See [native contact details](cloudflare-contact-native.md) for concurrency, TTL, quota, failure and mutation evidence.
- `RATE_LIMIT_SALT` is safely provisioned only as a preview Worker Secret. Resend mail infrastructure is OWNER-verified READY; Worker credentials and real form delivery are separate gates.
- Contact remains disabled. Resend key setup and the confirmations required by the Turnstile setup skill remain pending. No live test inquiry has been sent.
- New measurements, before/after image evidence and final follow-up outcomes are in `../../outputs/workers-performance-contact-20260917/OWNER_REVIEW_REPORT.md` (relative to the repository root). Read that report rather than treating the historical performance block below as current.
- No production Custom Domains, DNS, Netlify settings or email settings are changed. The fallback and owner-gated rollback plan below still apply.

## Boundaries

- Base: `deb1cd080ce1fefdab3183062933afdec16e46c8` (`tsudowa/master-hq-build`).
- Isolated local branch: `tsudowa/cloudflare-workers-candidate`.
- No push, merge, production cutover, Custom Domain attachment, DNS changes, mail configuration changes, or Netlify deletion.
- `npm run dev`, `build`, `start`, and `build:production` remain Next.js commands. Netlify configuration remains present.
- The only deploy target currently allowed by the helper is `tsudowa-owner-preview` in account `403d3196e2006bbfb76edb1eba214acf`, with no routes and contact/analytics disabled.
- Preview: https://tsudowa-owner-preview.tetsuyasmile52l.workers.dev
- Existing Netlify production permalink / fallback: https://6aabc4aec1247183915ad890--tsudowa.netlify.app
- Preview is publicly accessible but returns `X-Robots-Tag: noindex, nofollow, noarchive`. It is not an authenticated private preview.

## Compatibility and choice

Next.js 16.3.4, React 19.2.8, App Router, 14 page definitions, 2 route handlers, no app Server Actions or middleware. Dynamic route parameters and metadata are retained. Node crypto is supported through `nodejs_compat`; external integrations use fetch-based APIs.

`npx vinext check` was attempted first. The bare invocation failed npm peer resolution; an explicit supported peer set completed successfully with vinext 1.0.0-beta.10: 15 supported, 0 partial, 0 issues. Network-reset installation failures were retried; they were not treated as application compatibility failures.

vinext is the candidate because its build and real workerd execution work with this application. The check is not a production guarantee. Runtime tests found and corrected:

1. Workers rejects `redirect: "error"`; use `manual` and reject non-2xx without following upstream redirects.
2. Netlify's trusted IP header needs a Cloudflare-specific branch. Never trust arbitrary `X-Forwarded-For`.
3. A single CSS entry preserves the original import order and is imported directly by route modules. A TypeScript side-effect intermediary did not reliably emit vinext HTML stylesheet links. An Admin rule also needed greater selector specificity to preserve the original cascade.
4. Generated Workers global types must stay separate from Next.js's DOM / Node typechecking.

No unsupported architecture feature currently requires adopting OpenNext. If visual/runtime gates remain red, OpenNext is the alternative to evaluate, not a silently substituted production deployment.

References: [Cloudflare Next.js guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/), [vinext](https://github.com/cloudflare/vinext), [Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/).

## Commands

```sh
npm ci
npm run check:workers
npm run types:workers
npm run build:workers
npm run preview:workers
# In a separate terminal; real external providers are fully intercepted:
node scripts/workers-contact-qa.mjs
npx playwright test --config playwright.workers.config.ts
# Only after build and local checks; helper rejects domains and enabled contact:
npm run deploy:workers:preview
```

Stop this migration's local `preview:workers` process before rebuilding on Windows. It watches `dist/` and can lock files; a failed cleanup can leave a partial local output. Never stop the pre-existing servers on 3147, 3160 or 3162. Build failure must block subsequent deploy.

The current `wrangler.jsonc` has ASSETS, CONTACT_STATE (SQLite Durable Object) and non-secret vars. It has no KV, R2, D1, Queue or paid Images binding. Responsive image generation runs before every Workers build. The initial audit used original-image fallback; its measurements are retained as the baseline.

## Initial audit: env and secrets (historical; see follow-up above)

Netlify currently contains only five non-secret site settings. They are retained unchanged there:

| Name                           | Workers preview      | Future contact-enabled production          |
| ------------------------------ | -------------------- | ------------------------------------------ |
| NEXT_PUBLIC_SITE_URL           | https://tsudowa.com  | same canonical origin                      |
| CONTACT_ENABLED                | false                | true only after real QA and owner approval |
| NEXT_PUBLIC_ANALYTICS_ENABLED  | false                | optional, separate approval                |
| CONTACT_FROM_EMAIL             | no-reply@tsudowa.com | same                                       |
| CONTACT_TO_EMAIL               | contact@tsudowa.com  | same                                       |
| HOSTING_PLATFORM               | cloudflare           | cloudflare                                 |
| OWNER_REVIEW                   | true                 | false only for approved production build   |
| RESEND_API_KEY                 | absent               | secret required                            |
| TURNSTILE_SECRET               | absent               | secret required                            |
| NEXT_PUBLIC_TURNSTILE_SITE_KEY | absent               | public configuration required              |
| UPSTASH_REDIS_REST_URL         | absent               | server configuration required              |
| UPSTASH_REDIS_REST_TOKEN       | absent               | secret required                            |
| RATE_LIMIT_SALT                | absent               | stable secret, at least 32 characters      |

Optional monitoring: SENTRY_DSN / NEXT_PUBLIC_SENTRY_DSN; optional analytics: POSTHOG_HOST / POSTHOG_PROJECT_KEY. These stay disabled/unconfigured. Do not paste secrets into chat or commit them. Configure secret values in Cloudflare's protected settings or interactive Wrangler secret input for the specifically approved environment.

The same production Redis and salt would be needed to preserve rate/idempotency state during a later cutover; do not generate a replacement salt casually. Preview must not share production submission state or enable real sending merely for review. A real preview contact test needs an explicitly allowed preview Origin and Turnstile hostname, plus a controlled recipient; do not change the canonical URL to bypass the current exact-origin check.

The workerd fixture harness executes the built Worker with all external fetches intercepted. Its owner email, auto-reply, Reply-To, replay, conflict, quota, spam, Redis failure and partial-send cases are not evidence of actual Resend delivery or inbox reception. Disabled remote GET/POST checks must remain false/503 until credentials and real QA are approved.

## Netlify preservation

Existing project `tsudowa` (`728f34ef-949c-446c-aab2-e5d69f32521e`) is unchanged. It is not linked to Git. Existing project `tetsu-works` is also unchanged. No Netlify Functions source exists beyond framework-generated Next adapter functions; no application imports a Netlify Functions SDK. `NETLIFY` remains supported solely for trusted client-IP selection.

The previously published Netlify ZIP used a LF `.nvmrc` and explicit `@netlify/plugin-nextjs` entry. That known-good ZIP and permalink are the fallback; do not assume an arbitrary fresh ZIP without its adapter will be equivalent. This migration removes no Netlify dependency or configuration.

## Owner-gated cutover plan — NOT executed

1. Finish all correctness, visual, SEO, image and performance gates. Owner reviews the exact candidate version and explicitly approves production cutover. Contact activation is a separate gate; keep it disabled if real QA is incomplete.
2. Re-read and snapshot all DNS and Netlify state. Compare against the reviewed snapshot before any write; stop on drift. Verify the fallback permalink and its assets over HTTPS.
3. Prepare a separate production Worker/config from the reviewed commit, remove preview-only noindex, preserve canonical `https://tsudowa.com`. Current helper deliberately cannot perform this operation.
4. Attach `tsudowa.com` as a Workers **Custom Domain** only after explicit owner approval. Cloudflare manages the DNS target and certificate. Review/replace only the existing apex web record; never bulk-rewrite the zone.
5. For `www`, preserve path/query in a permanent redirect to `https://tsudowa.com`. The existing `www` CNAME conflicts with a same-hostname Custom Domain. Either use a separately approved www Custom Domain with an application redirect, or replace only www with a proxied originless DNS record plus Cloudflare Redirect Rule. Do not attach only apex and assume www is covered.
6. Let Cloudflare issue/renew managed SSL; do not import certificates or weaken TLS validation. Confirm certificate coverage and status before declaring success. Check both hostnames, redirects, all routes, assets, canonical, robots, sitemap and no unexpected 5xx.
7. Compare all nine protected email records before/after. Stop and roll back web traffic if unintended differences or serious route/contact errors occur. Retain Netlify and its environment settings throughout the observation period.

[Custom Domain documentation](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/) explains exact-hostname matching, CNAME conflicts and automatic certificate handling.

## Rollback — web only, NOT executed

Current web baseline:

| Host            | Type  | Content             | Proxy | TTL | Record ID                        |
| --------------- | ----- | ------------------- | ----- | --- | -------------------------------- |
| tsudowa.com     | A     | 75.2.60.5           | false | 300 | 8ec5b01dcdad56408ac4aec94b41957b |
| www.tsudowa.com | CNAME | tsudowa.netlify.app | false | 300 | f0f66819d01af9b06a434c8c2ee9ca32 |

On an approved rollback, disable the newly introduced www redirect / Custom Domain mapping and detach the new apex Worker Custom Domain as needed, then restore exactly these two web records. Verify HTTPS on Netlify, both hostnames and key routes. Do not delete Netlify, redeploy an unverified archive, modify nameservers, or touch mail records. DNS caches may prolong the transition; do not promise zero downtime. A detached Custom Domain certificate may remain; leave certificate cleanup for a separately scoped audit.

Protected email records: apex Cloudflare MX x3, apex SPF, cf2024-1 DKIM, Resend DKIM, send MX, send SPF, rsend CNAME. Never proxy email CNAMEs or replace SPF records as part of web migration. DNS preservation is distinct from proving actual email delivery.

## Evidence

The run-specific audit, logs, screenshots, QA reports and deployment versions are stored outside Git under `../../outputs/cloudflare-migration-20260917/`. See its final `OWNER_REVIEW_REPORT.md` for measured outcomes and remaining gates. A green build alone is not release approval.

### Initial verified candidate, 2026-09-17 (historical)

Preview version: `dc7af346-2f41-40ac-9650-da12a908085f`.

- Lint, TypeScript, 104 unit tests, original Next build and Workers build passed.
- The final Workers local runtime passed all 141 E2E tests. No tests were skipped.
- The deployed preview passed 10 routes at 390 / 768 / 1440 px: no measured overflow, image decode errors, page exceptions, or axe WCAG A/AA violations. Thirty full-page screenshots are saved; TOP and Admin desktop viewport captures were also visually inspected.
- The deployed preview passed 41-route SEO checks and 209 internal links including anchors.
- Eleven isolated workerd contact scenarios passed with providers intercepted, not real email delivery.
- All 232 source public assets match built files by SHA-256. Image optimization is still original-asset fallback, not proven Next/Image transformation parity.
- All 11 DNS records are unchanged, including 9 protected mail records. There are no tsudowa.com Worker Custom Domains.
- The preview deployment guard accepted its valid configuration and rejected all 10 unsafe configuration mutations without any deployment.

### Initial approval gates (historical; superseded by follow-up report)

- Performance comparison is **not measured**: the web-perf skill requires Chrome DevTools MCP, which is unavailable. Permission to substitute existing Lighthouse / Playwright measurements was requested but not received. Do not infer TTFB, LCP, CLS, request count, JS bytes, image timing or API latency from functional test duration or Worker startup time.
- Actual Resend delivery, auto-reply reception, Reply-To behavior in a real mailbox, Turnstile production validation and Upstash service connectivity remain unverified. Production credentials are absent from the existing Netlify project and were not provisioned here. Keep contact disabled.
- vinext is beta and the QA-only Miniflare package is an alpha release. Pinning and successful tests do not remove runtime upgrade risk. Owner visual review and the unresolved image/performance gate are required before cutover.

Overall migration gate at the time of this audit was **BLOCKED**. For the current verdicts see [production candidate state](cloudflare-production-candidate.md): the preview contact gate has since closed, while production cutover remains blocked and production remains on Netlify.
