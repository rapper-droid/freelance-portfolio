# Final blocker phase — owner review, September 17–18, 2026

Historical phase: the missing Resend Secret was supplied by OWNER afterward, and
the preview CONTACT and WORKERS gates later closed. The gate verdicts below are
superseded. See [production candidate state](cloudflare-production-candidate.md)
for the current HEAD, the two-Worker configuration and the remaining blockers;
the [live contact checkpoint](cloudflare-live-contact-checkpoint.md) covers the
intermediate enabled preview.

Production remains Netlify. No DNS, Custom Domain, mail DNS/routing, Netlify environment/project/certificate, push or merge changes were made. The approved external changes are the preview application deployment and one Turnstile widget with its preview bindings.

Base commit: `cba453d4fba3d70c5298a5413f9c7c38d977c9c4`.
Preview application version: `3924be53-5c9e-4f9d-8403-449983aa2e80`.
Preview: https://tsudowa-owner-preview.tetsuyasmile52l.workers.dev/

## Gates

- METADATA: READY.
- PERFORMANCE: READY under the same comparative rubric, with contact disabled. Repeat the service-connected gate after activation.
- CONTACT: BLOCKED — preview RESEND_API_KEY absent; no real inquiry has been sent.
- WORKERS: BLOCKED — live contact acceptance remains unverified despite the passing runtime/UI tests.
- CUTOVER: NOT_READY. This is not a production release approval.

## Cafe metadata fixed with real response evidence

In Cloudflare builds only, `htmlLimitedBots: /.*/` makes the installed vinext renderer resolve generated metadata into the initial head for every User-Agent. The ordinary Next.js/Netlify build keeps its previous behavior. No client-side injection workaround or duplicated route metadata was introduced.

The remote before-response failed all five UA checks because required metadata was outside the initial head. The deployed after-response passes all five: normal Chrome, Googlebot, Twitterbot, Slackbot and bingbot. Saved full HTML proves title, description, canonical, OGP and Twitter tags are inside `<head>`. The audit also checks route-specific title/description consistency, exact canonical, expected OGP/Twitter image and card type.

Cafe OGP deliberately retains the site's existing `og-hq.png`; this phase fixes metadata placement, not social artwork. Browser JavaScript execution is not part of the raw-HTML verdict. See [Next.js htmlLimitedBots documentation](https://nextjs.org/docs/app/api-reference/config/next-config-js/htmlLimitedBots).

## Comparative performance

Lighthouse mobile simulated: three fresh-browser runs per route per host, alternating host order, 30 runs total. Navigation: three cold/warm pairs per route per host. Both hosts were measured again; previous best scores were not substituted. These are laboratory results, not field CWV or a guarantee about every user.

| Route        | Performance Netlify / Workers | LCP ms N / W | TBT ms N / W | Comparative verdict     |
| ------------ | ----------------------------- | ------------ | ------------ | ----------------------- |
| /            | 79 / 99                       | 1904 / 2086  | 813 / 10.5   | Workers faster, TBT-led |
| /works       | 87 / 95                       | 2538 / 2565  | 416 / 14.5   | Workers faster, TBT-led |
| /demos/cafe  | 96 / 96                       | 2653 / 2571  | 76 / 5.5     | Equivalent              |
| /demos/inbox | 97 / 97                       | 2279 / 2254  | 82 / 13      | Equivalent              |
| /contact     | 96 / 97                       | 2376 / 2306  | 47 / 2       | Equivalent              |

Workers CLS medians are zero on all five routes. Works and Cafe remain just above the 2.5-second LCP good threshold; no claim is made that every metric is ideal. TOP's LCP is slower than Netlify's median, while TBT improves substantially. The predeclared rule also checks transferred-byte regression; every route passes it. Raw files include FCP, Speed Index, cold/warm TTFB, requests and JS/CSS/image bytes.

Accessibility and Best Practices medians are 100 on both hosts. Preview SEO scores are reduced by deliberate noindex/robots restrictions; the previously missing Cafe description now passes the raw-head audit. Do not remove preview indexing protection to improve a score. See [Web Vitals definitions](https://web.dev/articles/vitals).

## Turnstile and protected configuration

Created one managed, no-clearance widget named TSUDOWA-CONTACT for exactly the three approved hosts: apex, www and the owner-preview hostname. No localhost or wildcard hosts were added. A single widget can cover these approved hosts; the application still checks the exact expected hostname and action. Separate production credentials/widgets can later be chosen for operational isolation, but are not required to use this allowlist.

Stored TURNSTILE_SECRET as a preview Worker Secret and NEXT_PUBLIC_TURNSTILE_SITE_KEY as a public runtime binding. Retained RATE_LIMIT_SALT. No secret value was printed, committed or stored in an artifact. `--keep-vars` preserves the remotely supplied public binding during guarded preview deployments. Repository deploy defaults remain CONTACT_ENABLED=false.

RESEND_API_KEY remains absent. A protected Cloudflare Secret input was requested. The available Resend key-creation connector requires returning/displaying the new value, which conflicts with the owner's non-disclosure requirement; it was not used. No new Resend key was created and no mail was sent.

The new CONTACT_ORIGIN override permits only this explicitly approved Cloudflare owner preview, while keeping the apex SEO canonical unchanged. It is rejected on Netlify, in non-owner production mode, for arbitrary origins, localhost and hostname lookalikes. Production omits this override. The override is implemented and runtime-tested but not activated remotely because the key is missing.

## Partial success and retries

An owner-accepted / confirmation-failed response is now a neutral status: the inquiry itself is accepted, with a visible receipt and a dedicated confirmation-only retry. Fields are locked within that mounted form, retaining the same payload and submission identity. The backend already skips the completed owner phase. An owner-send failure still reports failure and retains input; it cannot show full success. Full success requires both phases accepted by the provider.

Browser reload retains the bounded draft/submission identity but not the newly added mounted-form acceptance lock. This is not a claim of permanent cross-tab locking or infinite deduplication. The existing seven-day retention and 23-hour incomplete-retry guard still apply.

## Executed QA and limits

| Check                                           | Result                                                                                             |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Lint, Next types and Next build                 | PASS                                                                                               |
| Unit tests                                      | 118 / 118 PASS, 16 files                                                                           |
| Workers types/build                             | PASS                                                                                               |
| Next browser E2E                                | 141 / 141 PASS                                                                                     |
| Workers browser E2E                             | 141 / 141 PASS                                                                                     |
| Remote SEO regression                           | 41 routes PASS                                                                                     |
| Remote Cafe initial-head metadata               | 5 / 5 UAs PASS                                                                                     |
| Remote responsive/a11y/image smoke              | 30 screenshots; zero measured overflow, broken images, page exceptions or axe WCAG A/AA violations |
| Internal links and anchors                      | 41 routes, 209 links, zero failures                                                                |
| Additional image probe                          | 86 image observations across both hosts; zero decode failures                                      |
| Native state in workerd/SQLite                  | 6 positive checks; all 4 deliberate safety mutations rejected                                      |
| Built application + real SQLite contact runtime | 16 scenarios PASS; external providers intercepted                                                  |
| Live form → Resend → mailboxes                  | NOT RUN; missing Worker secret                                                                     |

TOP desktop, Cafe mobile and Inbox mobile viewport images were also visually inspected. No new layout damage was observed in those three inspected views; this is not a universal subjective quality claim.

One unit rerun during simultaneous browser suites hit the existing 5-second timeout in a process-spawning production-config test. The failed log is retained. A subsequent full single-worker run passed all 118 tests without changing timeouts or assertions. The earlier complete verify also passed.

Native contact scenarios cover owner/confirmation IDs, Reply-To, retry, conflicting payload, body/origin limits, invalid/replayed tokens, missing token, wrong action/hostname, per-IP limit, daily/monthly caps, state failure, 12 concurrent submissions, partial send, and Resend timeout/5xx/rejection recovery. The concurrency check asserts exactly one provider call per owner/confirmation phase, not merely one map entry per idempotency key.

These tests use the built Worker with real SQLite storage and intercepted providers; they are not deployed-edge delivery receipts. The timeout test injects a transport TimeoutError rather than waiting for the full real provider timeout duration. No production quota or genuine provider credential was modified. Missing each required configuration item independently fails closed.

The mail, native-state and Turnstile skill guidance was used to preserve exact origin/action validation, private atomic state, stable idempotency and non-disclosure. The web-perf skill's unavailable DevTools step was replaced only under the owner's explicit Lighthouse/Playwright authorization. No test CAPTCHA bypass was deployed.

## Live acceptance checklist — all pending, not evidence of success

The following must be recorded from one logical real inquiry after protected secret input and reviewed preview-only activation:

1. Actual browser success state.
2. Submission/request ID and displayed receipt.
3. Resend API acceptance and provider IDs.
4. Owner mail acceptance.
5. contact mailbox routing.
6. Evidence of Cloudflare Email Routing transit.
7. OWNER Gmail reception.
8. Auto-reply acceptance.
9. Sender mailbox reception.
10. Correct owner and auto-reply Reply-To headers.
11. Correct TSUDOWA sender display name/address.
12. Correct subjects.
13. Correct receipt/body details.
14. Correct source page.
15. Matching IDs across the application and received messages.

Use TSUDOWA TEST / TSUDOWA and the exact two-line owner-provided test body. The existing request category menu has no connection-test category: use its honest Other category and explicitly identify `種類: 本番前接続テスト` in the supplementary field, rather than inventing a production category or falsifying validation. The owner-provided body and test name remain unchanged.

Then repeat the same logical submission with fresh single-use Turnstile tokens, preserving its UUID and payload. Verify no additional owner or auto-reply messages and stable UI. If Turnstile requests human interaction, require the owner to complete it. Do not substitute fixture tokens or directly send through a connector as proof of browser delivery.

Keep remote CONTACT_ENABLED=false until all three Secrets and the public site key are present. Once the approved key is supplied, review exact Worker settings, activate only the approved preview origin, rerun live checks and the service-connected QA, then reassess all gates. Current disabled-mode QA does not fulfill the service-connected gate.

## Artifacts and follow-up

The raw format audit reports 173 pre-existing warnings, zero intersecting this change. All disappear under read-only CRLF-to-LF normalization. The older count of 69 is historical, not the current measured count. Unrelated files were not reformatted; this remains separate line-ending technical debt.

Primary output directory (outside Git, relative to this repository): `../../outputs/workers-final-blockers-20260917/`.
Performance raw results: `../../outputs/workers-performance-contact-20260917/final-blockers/`.
Responsive screenshots: `../../outputs/cloudflare-migration-20260917/final-blockers-owner-review/`.

See [names-only production manifest](cloudflare-production-manifest.md) and [cutover/rollback simulation](cloudflare-cutover-simulation.md). Preserve Netlify until a separate retirement approval. Upstash is not required by the Workers implementation.
