# FINAL MASTER PASS — QA and owner handoff

Date: 2026-09-17. Baseline: `8f57c9276e43bfeb75837180bedc90b875c662f0`.
Branch: `tsudowa/parent-brand-migration-work`. Local review: `http://127.0.0.1:3147/`.
This is an OWNER REVIEW candidate, not a deployment approval or a claim of live mail delivery.

## Executed verification

| Check                                    | Result                        | Scope / evidence                                                                                                                                                               |
| ---------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run verify`                         | PASS                          | ESLint, Next type generation + TypeScript, 97 unit tests in 9 files, production-mode Next build                                                                                |
| Final `npm run lint`                     | PASS                          | Includes the added local QA scripts                                                                                                                                            |
| `npm run test:e2e`                       | PASS — 111/111                | Chromium desktop/tablet/mobile projects; contact success/error/draft, 11 actual standalone navigation links, existing functional demos                                         |
| Final route sweep                        | PASS — 147/147                | Existing 37 + `/contact` + 11 `/experience/*`; 390 / 768 / 1440px; all HTTP 200                                                                                                |
| Overflow / image decode / runtime errors | 0 / 0 / 0                     | All 147 route/viewport combinations; `after/audit.json`                                                                                                                        |
| axe                                      | 0 violations                  | All 147 screens, plus contact success and validation states in E2E                                                                                                             |
| Internal links and SEO                   | PASS                          | 49 routes; 217 unique internal targets/anchors; `links-seo.json`                                                                                                               |
| Production configuration contract        | PASS — 5 cases                | Disabled review; wrong site URL rejected; enabled-without-secrets rejected; wrong sender rejected; synthetic valid configuration accepted. No real secret or external request. |
| Product registry                         | Unchanged                     | `src/lib/portfolio.ts` blob equals baseline `68deb931b8861bdfc7cf2324cbcd2c8301d5401e`                                                                                         |
| Original OWNER evidence                  | Preserved                     | 86 original image/video/frame files hash-matched; no overwrite                                                                                                                 |
| Changed-file formatting                  | PASS                          | Existing warnings intersecting the changed files fixed; no new warnings                                                                                                        |
| Whole-repository formatting              | NOT GREEN — pre-existing debt | 69 baseline warnings → 60; remaining 60 unchanged and disjoint from this diff                                                                                                  |
| `git diff --check`                       | PASS                          | No whitespace errors                                                                                                                                                           |
| Mobile Lighthouse target                 | NOT MET                       | Main 7 routes still 2.67–3.12s LCP. See `FINAL_MASTER_PERFORMANCE.md`; no blanket performance pass.                                                                            |

`npm run verify:all` is **not** reported as passing: it includes the still-failing whole-repository format gate. The other applicable checks above were executed individually. The Next build emits 57 entries including metadata/system routes; the visual audit covers 49 human-facing content routes, not 57 distinct pages.

## Contact test contract

`tests/unit/contact.test.ts` covers payload and enum validation; unsafe URL schemes; source allowlisting; body bounds; malformed JSON; honeypot; consent; missing configuration; exact origin; Turnstile success/action/hostname; rate limiting; per-phase quota; lock contention and token-fenced release; receipt collision handling; UUID-to-receipt mapping; changed-payload conflicts; retry age; provider errors/timeouts; and independent owner/confirmation delivery checkpoints.

Owner notification: `From: TSUDOWA <no-reply@tsudowa.com>`, `To: contact@tsudowa.com`, `Reply-To: visitor`. Visitor receipt: same From, `To: visitor`, `Reply-To: contact@tsudowa.com`. Tests verify both envelopes, structured owner fields, escaped HTML, stable subject/body/time and idempotency keys on retry, and skipping a phase already accepted by the provider. Visitor auto-receipts deliberately do not echo arbitrary URLs or the free-form body.

The public success state appears only after the provider accepts both messages. If only the owner notification was accepted, the UI reports that the confirmation mail is pending, keeps the same request identity, and does not pretend the whole flow completed. Provider acceptance is not proof of inbox delivery.

E2E checks editable prefill, native form semantics, error association and focus, success receipt, preserved inputs after failure, same-tab reload recovery, retry identity, draft clearing after success, and PII-free analytics event properties. Session drafts expire after 2 hours; no PII draft in localStorage. Detailed operational bounds are in `CONTACT_EMAIL.md`.

`email/owner-notification.txt`, `email/visitor-receipt.txt`, `email/visitor-receipt.html`, and `email/envelopes.json` are rendered synthetic fixtures using the production mail renderer, **not sent messages**. The three `contact-success-*.png` images show an intercepted API-success fixture. The review server has `CONTACT_ENABLED=false`; no Resend call, mail configuration update, routing change, or DNS change was made.

## Visual, motion, and native-scroll evidence

- `before/`: 37 routes × 3 sizes, first viewport and full page. `after/`: 49 routes × 3 sizes, first viewport and full page. `/contact` has no previous route; `before/contact-{390,1440}-top-ending.png` shows the old embedded form for comparison.
- `sheets/`: 10 contact sheets cover all final routes at mobile/desktop. They were visually reviewed, in addition to key full-size pages and Cafe photo details.
- `motion/`: TOP, Cafe and Inbox each have a WebM plus sequential PNG frames (42 total). `timings.json` distinguishes actual CSS durations/animation events from capture/wait overhead.
- TOP CTA/service hover 220ms, press 140ms; image hover 800 → 600ms; section reveal 400ms, crop token 560ms; Inbox hover 180ms/detail 260ms; Cafe menu 300ms. Cafe CTA has immediate color feedback rather than an artificial delay. The old 1.4–1.7s screenshot-settling observations were not CSS durations.
- Reduced motion: all three motion runs show 0 active animations and no `revealReady` gate. Initial visible content is not hidden pending a scroll/reveal.
- `native-scroll-form.json`: all 9 TOP sections at 390 and 1440px become visible at opacity 1 during real scrolling without injected CSS. The old full-page blank corridor is `content-visibility:auto` capture omission, not a real oversized spacer.
- Full-page comparison captures alone temporarily disable offscreen painting omission. First-view captures, native scroll screenshots, and videos use the real page. This distinction is disclosed in the gallery.
- Contact category targets are 48px high; textarea focus is on-screen at both inspected widths. Booking date targets retain at least 64px width with horizontal scroll/snap. No physical device/software keyboard was used.

## Format technical debt — separate scope

Debt: `FORMAT-BASELINE-001`. Baseline has 69 warnings. Nine existing warning files were necessarily touched and formatted: four demo routes, privacy, sitemap, contact sender, contact section, and analytics definitions. The remaining 60 are byte/blob unchanged from baseline, have zero intersection with this pass, and contain no new warning. The full list, comparison, and formatter exit code are in `integrity.json`. Do not mass-format them as part of visual/contact review.

## SEO and boundary preservation

Existing canonical, metadataBase, OGP, structured data, titles/descriptions, robots and routes were retained. `/contact` is added to sitemap; standalone pages have canonical `/demos/<slug>` and `noindex,follow`, and are excluded from sitemap. Automated checks cover those contracts, not future search indexing/ranking.

The categoryId/slug/price/duration/materials source is unchanged. Existing demos remain self-initiated examples with honest demo/data notices. No fabricated client delivery, revenue, customer, or live integration claim was added. Analytics is disabled in the local review process; new contact events exclude names, email, company, message, arbitrary URLs and receipt IDs.

## Reproduce locally

Use the repository's installed packages and a compatible installed Playwright Chromium. On this workstation the browser cache is `../playwright-browsers`; set `PLAYWRIGHT_BROWSERS_PATH` accordingly. Run against a local production-mode server bound to `127.0.0.1:3147`, with `CONTACT_ENABLED=false`, `ANALYTICS_ENABLED=false`, and `NEXT_PUBLIC_SITE_URL=https://tsudowa.com`.

```text
npm run verify
npm run test:e2e
node --experimental-strip-types scripts/master-review.mjs after
node --experimental-strip-types scripts/master-links.mjs
node scripts/master-details.mjs
node scripts/master-motion.mjs
node scripts/master-production-checks.mjs
node scripts/master-integrity.mjs
node scripts/master-evidence.mjs
```

Performance runs must not overlap other browser-heavy tests. `master-performance.mjs` uses local Chromium/Lighthouse and saves complete JSON, including LCP element, resource bytes, request count, CLS, TBT and long-task evidence. Do not run a rebuild against the already-running review server: preserve the verified build, or stop/restart only the owned review process and redo the evidence binding.

Final captures were taken after freezing application source hashes and the build ID in `APP_SOURCE_FREEZE.json`. Local commits do not change those files. `FINAL_CHECKPOINT.json` binds the final commit/tree/clean state to that exact source/build; raw capture JSON may still say `8f57c92` because captures preceded commits. Documents and capture scripts are not included in the application hash.

## Open owner/release gates

1. OWNER judgement of first impression, premium feel, photographic realism, typography, spacing, motion, CTA, parent/child hierarchy, mobile quality and whether the site makes them want to commission work.
2. `PERF-LCP-002`: the 2.5s mobile simulated LCP goal is not met; Cafe/Booking did not improve in the final single-run comparison. No measured result is presented as real-user Core Web Vitals.
3. Real iOS/Android software-keyboard behavior, hardware touch feel and actual screen-reader speech remain unverified. Chromium emulation/axe/keyboard semantics are not a substitute.
4. The existing mail foundation is OWNER-confirmed, but this new two-message form flow has only isolated mock/provider-contract tests. Production secret installation, one owner-approved live acceptance/receipt test, deliverability/bounce handling and sender reputation are release gates, not actions authorized in this pass.
5. No push, merge, deployment, external mail/DNS change or new paid subscription. Local commits only. Review status is **READY_FOR_OWNER_REVIEW / NOT_DEPLOYED**, not production readiness.
