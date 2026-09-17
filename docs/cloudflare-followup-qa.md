# Workers follow-up QA — 2026-09-17

Preview version: `2b179ed6-d6db-4472-b57f-a89aceac5c16`. Production remains Netlify.

## Comparative performance

Lighthouse mobile simulated, 3 runs per host per route, alternating hosts. Use medians; these are laboratory results, not field CWV. Before and after each contain 30 Lighthouse runs plus 30 cold/warm navigation pairs. Final comparison uses the after-run Netlify control, not an earlier best score.

| Route        | Performance N / W | LCP ms N / W | TBT ms N / W | Verdict        |
| ------------ | ----------------- | ------------ | ------------ | -------------- |
| /            | 79 / 93           | 1945 / 2073  | 776 / 226    | Workers faster |
| /works       | 76 / 95           | 2731 / 2559  | 740 / 82     | Workers faster |
| /demos/cafe  | 86 / 95           | 2674 / 2632  | 382 / 28     | Workers faster |
| /demos/inbox | 96 / 96           | 2297 / 2340  | 115 / 34     | Equivalent     |
| /contact     | 87 / 98           | 2409 / 2169  | 437 / 44     | Workers faster |

The predeclared rubric uses LCP, TBT, CLS and transferred-byte regression limits. TOP's faster verdict is TBT-led, not a claim of lower LCP. Works and Cafe still exceed a 2.5-second LCP target in this simulated environment; comparative READY is not a claim that every metric is ideal. Workers CLS median is 0 on all five routes.

Cafe hero: original Workers fallback 1440×960 / 124,862 body bytes; Netlify 750×500 / 36,458 bytes; optimized Workers 750×500 / 35,934 bytes. Existing srcset/sizes are retained. 227 source images yield 1,692 manifest variant references, deduplicated into 1,238 generated files. All 232 original public assets are unchanged by SHA-256.

## Executed QA

- `npm run verify`: lint, Next types, 111 unit tests and Next build PASS.
- Worker types/build PASS.
- Local Workers E2E 141/141 PASS, no skipped tests; local SEO 41 routes PASS.
- Native SQLite state: 6 positive tests; all four safety mutations rejected.
- Built Worker + real SQLite: 11 contact scenarios PASS. Turnstile and Resend are intercepted fixtures, not live delivery.
- Deployed preview: 10 routes × 390/768/1440 = 30 full-page screenshots. Zero measured overflow, broken images, page exceptions or axe WCAG A/AA violations. 75 internal links PASS; 41-route existing SEO regression PASS.
- TOP desktop, Cafe mobile and Inbox mobile viewport screenshots visually inspected. No new layout damage identified in these inspected views; this is not an assertion of universal subjective quality.
- Current format audit: 175 pre-existing raw CRLF warnings, zero intersecting current changes; all 175 disappear with read-only LF normalization. The older count of 69 was not reused as a current count. No unrelated formatting changes made.

## SEO observation beyond the existing regression suite

Lighthouse Accessibility and Best Practices medians are 100 for all five routes on both hosts. Workers SEO is 58–69 because the preview intentionally blocks indexing; Cafe additionally reports a missing meta description.

Independent complete-HTML reads, three times per host, find the correct Cafe description. Netlify places it inside the initial head; Workers places it after `</head>`. Twitterbot, bingbot, Slackbot and Googlebot probes also found it outside the initial head. The installed vinext renderer supports streaming metadata, but these observed outputs do not prove search or social preview parity.

[Next.js streaming metadata documentation](https://nextjs.org/docs/app/api-reference/functions/generate-metadata#streaming-metadata) explains body-appended metadata and HTML-limited bot handling. Do not silently relabel the Lighthouse warning as fully resolved. Existing SEO tests check title/canonical/OG/JSON-LD/robots/sitemap; their PASS does not cover this initial-head distinction. Resolve or explicitly review bot/head metadata behavior before cutover. No metadata/runtime configuration change was made solely to improve the score.

## Remaining gates

- PERFORMANCE: READY (comparative rubric).
- CONTACT: BLOCKED. Mail infrastructure is OWNER-verified READY; preview Worker Resend key, Turnstile confirmations/settings, reviewed preview-origin activation and one real inquiry remain incomplete.
- WORKERS: BLOCKED. Functional and comparative performance checks pass, but real contact E2E and the metadata observation remain open.
- CUTOVER: NOT_READY. No production DNS/Custom Domains, Netlify settings, mail settings, paid upgrade, push or merge changed.

The Turnstile setup skill requires explicit confirmations before creating its widget. Those confirmations were requested; no reply was received during this run. `RATE_LIMIT_SALT` alone is provisioned as a preview Secret, without displaying or committing the value. Upstash is not required for Workers. See [native contact design](cloudflare-contact-native.md).

Evidence lives outside Git in `../../outputs/workers-performance-contact-20260917/` relative to the repository root. Responsive full-page screenshots are in `../../outputs/cloudflare-migration-20260917/native-optimized-owner-review/`. The final `OWNER_REVIEW_REPORT.md` includes all requested metrics, raw report pointers, commit and rollback status. Netlify's known-good deployment remains the immediate production fallback; web-only rollback details are in [migration notes](cloudflare-migration.md).
