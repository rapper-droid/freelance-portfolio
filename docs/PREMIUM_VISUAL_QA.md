# TSUDOWA premium refinement — verification receipt

Date: 2026-09-17 JST. Branch: `tsudowa/parent-brand-migration-work`.
Baseline HEAD: `b41cf16765e10cedda82c073c175481e67f8503f`.
Scope: local implementation and local commits only. No push, merge, deploy, domain, DNS, email or external service changes.

## Review entry points

- Local production-build preview: `http://127.0.0.1:3147/` (loopback only).
- Existing development server: `http://127.0.0.1:3137/`, retained without stopping or restarting it.
- [Before / after viewer](PREMIUM_REVIEW.html): 8 key pages, desktop/mobile, first view/full page, 64 image combinations.
- Complete captures: `screenshots/premium/before/` and `screenshots/premium/after/`; 37 routes × 2 sizes for each state, plus key-page full captures.
- [Audit and decisions](PREMIUM_VISUAL_AUDIT.md), [art direction](ART_DIRECTION.md), [asset provenance](IMAGE_SOURCES.md).

The before images use the pre-change development server; the after images use the finished local production build. Both use the same viewport sizes and reduced motion for comparison. This is not a controlled field-performance comparison.

## Executed checks

| Check                                        | Result                         | Evidence / scope                                                                                                                   |
| -------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `npm run verify`                             | PASS                           | ESLint, Next type generation + TypeScript, 52 unit tests in 8 files, production build (45 generated pages)                         |
| `node scripts/check-production.mjs`          | PASS                           | Correct TSUDOWA origin, contact disabled; missing/incorrect enabled-contact configuration is covered by negative unit tests        |
| Playwright E2E                               | PASS, 90/90                    | Desktop, tablet, mobile; 0 unexpected, skipped or flaky results; `screenshots/premium/e2e-results.json`                            |
| Contact flow                                 | PASS, mocked only              | Validation, retained drafts after failure, idempotent retry, repeat-success protection, honest disabled API; no real email sent    |
| Visual route sweep                           | PASS, 148/148                  | 37 routes × 320/390/768/1440 px; no overflow, missing images or browser runtime errors; `screenshots/portfolio/visual-report.json` |
| Representative design sweep                  | PASS, 36/36                    | 6 routes × 320/390/768/1024/1440/1920 px; keyboard focus, contrast/axe, overflow and images; `screenshots/sales-ui/report.json`    |
| All-route accessibility                      | PASS, 74/74                    | 37 routes × 390/1440 px; 0 axe violations; `screenshots/premium/accessibility.json`                                                |
| Links                                        | PASS                           | 37 routes / 124 internal links and anchors; `link-report.json`                                                                     |
| SEO regression                               | PASS                           | 37 route titles/canonicals/OGP, TSUDOWA origin, structured data, robots, sitemap, manifest and brand assets                        |
| Image captures                               | PASS                           | 33 responsive demo previews, sales screenshots and 74 after first views (all HTTP 200)                                             |
| Lighthouse                                   | PASS with qualifications below | 14 routes, isolated from other active browser QA; `performance/summary.json`                                                       |
| Product registry                             | UNCHANGED                      | `src/lib/portfolio.ts` Git blob `68deb931b8861bdfc7cf2324cbcd2c8301d5401e`, matching the baseline                                  |
| Changed-file formatting / `git diff --check` | PASS                           | Only task-related files formatted                                                                                                  |
| Repository-wide `format:check`               | NOT GREEN                      | Pre-existing formatting warnings remain in unrelated files; no unrelated bulk formatting was performed                             |
| `verify:all` aggregate                       | NOT CLAIMED GREEN              | Its repository-wide formatting step is not green; the functional/build/browser gates above were executed separately                |

### New behavioral evidence

- Inbox completion and open-state counts change with the displayed inquiry state.
- Admin totals and ranked customer meters change on create/delete and survive local reload as expected.
- Booking week buttons stay synchronized with the existing date filter and preserve keyboard operation; at 320 px each target is at least 44 px wide and high.
- Café Coffee/Food tabs switch the contextual photograph while retaining the six menu entries and prices.
- Client-side navigation registers reveal observers for the new route. Reduced-motion preference leaves the content visible.
- Existing CSV import/export, customer editing/history, booking collision/cancel, EC cart, automation human review and QA checklist behavior remain under E2E coverage.

## Lighthouse mobile measurements

Measurement: 2026-09-17 05:02 JST, local Next production build, simulated mobile throttling. One final run per route; these are lab measurements, not field Core Web Vitals or a guarantee of real-user performance.

| Route               | Performance | Prior same-route score | LCP (s) | TBT (ms) | CLS |
| ------------------- | ----------: | ---------------------: | ------: | -------: | --: |
| `/`                 |          94 |                     80 |    3.05 |     30.5 |   0 |
| `/works`            |          92 |                     90 |    3.31 |     42.5 |   0 |
| `/works/lp`         |          95 |                     83 |    2.99 |     30.0 |   0 |
| `/projects/cafe`    |          94 |                     92 |    3.04 |     26.5 |   0 |
| `/projects/saas`    |          96 |                     95 |    2.83 |     32.0 |   0 |
| `/projects/ec`      |          95 |                     95 |    2.98 |     31.0 |   0 |
| `/projects/inbox`   |          95 |                     98 |    2.90 |     28.0 |   0 |
| `/demos/booking`    |          96 |                     96 |    2.82 |     26.5 |   0 |
| `/demos/cafe`       |          95 |                      — |    3.00 |     41.0 |   0 |
| `/demos/inbox`      |          95 |                      — |    2.82 |     48.7 |   0 |
| `/demos/admin`      |          96 |                      — |    2.83 |     53.3 |   0 |
| `/works/automation` |          94 |                      — |    3.00 |     42.0 |   0 |
| `/works/api`        |          96 |                      — |    2.84 |     39.5 |   0 |
| `/works/qa`         |          96 |                      — |    2.65 |     25.0 |   0 |

Accessibility / Best Practices / SEO: **100 / 100 / 100 on all 14 routes**.
JS transfer: 159,528–185,104 bytes; for the eight baseline routes, 727–999 bytes lower than before. No new runtime dependency.

The prior performance file is preserved at `screenshots/premium/performance-before.json`.
Most scores improved, but `/projects/inbox` fell from 98 to 95. LCP increased on seven of the eight comparable routes (largest change: that case page, about +0.70 s). All final LCP values exceed 2.5 s; this remains an optimization opportunity. Do not call the entire pass a universal performance improvement. TBT and CLS are healthy in this local sample, but CPU/network differences and repeat-run variance still matter.

## Assets and limits

Four new generated café photographs: ritual, food, space, drip. Original PNGs are retained in `assets/imagery/`; shipped 1440×960 WebP files total 577,794 bytes. Conversion is reproducible with `node scripts/premium-images.mjs`.

The photographs depict a fictional café, not a real client or photographed venue. All 33 `premium-3` preview images depict the actual local demo UI with fictional/sample data. No reference-site image, logo or code is included in public assets.

Automation does not establish that a design is the highest possible quality or that it will generate sales. This receipt is not legal or accessibility certification. Physical iOS/Android, Safari, screen-reader listening, public-network field measurements and real contact delivery were not tested.

## Reproduction

Use Node and the lockfile dependencies from this branch. Keep existing processes intact and choose unused loopback ports. Set the official origin for the build, while keeping contact and analytics disabled for local QA:

```powershell
$env:NEXT_PUBLIC_SITE_URL='https://tsudowa.com'
$env:CONTACT_ENABLED='false'
$env:NEXT_PUBLIC_ANALYTICS_ENABLED='false'
npm.cmd run verify
node scripts/check-production.mjs
```

Run the production preview in a separate terminal on a verified-free port:

```powershell
node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3147
```

```powershell
$env:QA_BASE_URL='http://127.0.0.1:3147'
$env:E2E_PORT='3157'
npm.cmd run test:e2e
npm.cmd run qa:visual
npm.cmd run qa:design
node --experimental-strip-types scripts/premium-accessibility.mjs
npm.cmd run qa:links
npm.cmd run qa:seo
```

Stop competing browser QA before running `npm.cmd run qa:performance`. Its dedicated debugging port 9223 must be free. Do not target production with mutation-bearing E2E tests.

## Handoff gate

**READY_FOR_OWNER_REVIEW — NOT_DEPLOYED_BY_THIS_UNIT**.

OWNER reviews the brand feeling, the photographic details, the small-screen rhythm, sales wording, the independent TSUKUTTA LAB presentation and the working tool interactions. Before release: authorize push, obtain new-SHA CI, decide how to handle the known formatting debt, confirm the hosting environment and verify actual email delivery in the authorized environment. None of these gates is inferred from a local green build.
