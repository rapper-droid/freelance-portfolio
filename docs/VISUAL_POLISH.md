# Visual / Experience Master Polish — TSUDOWA + TETSU WORKS

Branch `claude/visual-polish-20260918`, based on `895f97b` (the deployed Workers
candidate). **Released to production on 2026-09-20 JST** as Worker version
`e41e0535` from `8b0f7ee`, after the release fixes at the end of this document;
current state and rollback are in [production status](production-status.md).
The sections before "Release" are the original pass-6 record. tetsuworks.com (the older standalone site built
from `codex/portfolio-sales-hub-v2`) is outside this repository and was not
touched. The TSUKUTTA LAB product was not touched; only its TSUDOWA gateway
page `/lab`.

## Route inventory — 53 public routes + the runtime error screen

Taken from the App Router tree (`src/app/**/page.tsx`), `sitemap.ts`,
`generateStaticParams`, the navigation and every internal link, not from a
hand-written list. `/experience/*` is noindex and absent from the sitemap but
linked from every demo, so it is in scope.

- **TSUDOWA (6 + error screen):** `/`, `/history`, `/lab`, `/contact/general`,
  `/privacy`, 404 (`not-found.tsx`), runtime error screen (`error.tsx`).
- **TETSU WORKS (47):** `/works`, `/contact`, `/works/{web, lp, coding, nextjs,
responsive, improvement, ec, apps, api, automation, design, qa}` (12),
  `/projects/{cafe, saas, ec, automation, booking, improvement, creative, qa,
csv, inbox, admin}` (11), `/demos/*` (11), `/experience/*` (11).

## Method

1. Every route at 320 / 360 / 390 / 430 / 768 / 1024 / 1440 / 1920: first
   screen at all eight widths and the full page at 390 and 1440, after walking
   the page so reveal effects settle. Automated checks per load: HTTP status,
   horizontal overflow, elements escaping the viewport, clipped text, broken
   images, JS errors, failed requests, tap targets under 24px, and axe WCAG
   2.0/2.1/2.2 A/AA at 390 and 1440.
2. Every route reviewed by eye from contact sheets (four mobile widths in a
   row, tablet, the two large widths, and the folded full pages).
3. Legibility: readable (non aria-hidden) text below 11px (Latin) or 12px
   (Japanese) was located in the browser, mapped through the Chrome DevTools
   Protocol to the rule that actually sets its size, and fixed in that rule —
   never with an override layer. The same method located every layout fix below.
4. UI states with the E2E suite's mocks (nothing is sent): contact form
   disabled / idle / validation / sending / success / error / receipt pending
   on both forms at 390 and 1440; keyboard focus rings; hover on cards, nav, CTA
   and demo actions; the mobile menu open / Escape / link.
5. A code review of the whole diff by a separate agent; its three regressions
   were fixed (see below).
6. Baseline plus six passes, the last one on the final build. The error screen
   is rendered by a temporary route that throws at request time (removed
   afterwards, never committed).

Evidence is outside the repository under
`outputs/visual-polish-20260918/{baseline,pass1..pass6,error-probe}`
(screenshots and `audit.json`).

## What changed

### Design system

- `src/app/tokens.css` is the single definition of colour roles for both
  personalities, the type scale with its floor, spacing, shape, motion and
  focus. Durations and easings were defined in four stylesheets with
  conflicting values; they now resolve through aliases to the previously
  effective values.
- Components styled across up to seven files now have one owner: WORKS
  header/footer (`works-chrome.css`, 522 lines removed elsewhere), catalogue
  card (`project-card.css`), demo frame (`demo-frame.css`).
- Japanese: headings and leads break between phrases (`auto-phrase` with
  `overflow-wrap: break-word`) and balance; paragraphs avoid a lone last line.
- Wide screens: content columns are centred, and coloured bands reach the
  screen edge instead of ending in a visible box at 1920 (rule recorded in
  `DESIGN_SYSTEM.md`).

### TSUDOWA

- `/privacy` rendered unstyled on white inside the WORKS header. It is now a
  TSUDOWA document with a contents list. The storage sentence names the
  services actually used: Cloudflare Durable Objects on the Workers build,
  Upstash on the Netlify build (checked against the contact route: HMAC
  digests, receipt number/time and send flags; no body, address or raw IP).
- 404 and runtime error screens carry the mark and a next step: the 404 links
  home, WORKS, LAB and contact; the error screen offers retry, home and WORKS.
- `/contact/general`: the panel sat left of centre from 1440px; it is centred
  and the "制作のご相談は TETSU WORKSへ" link aligns with it.
- Home, BUILD LOG and LAB were already at a high level: legibility floor and nav
  scaling only.

### TETSU WORKS

- Header: unambiguous lockup, Japanese section links, a native mobile menu
  (there was none below 1024px), one CTA.
- `/works`: sections numbered 01–07 in order (they read 01, 03, 05, 06, 07,
  08, 07), a distinct heading instead of a repeated one, no orphaned card, the
  ribbon's CTA goes to this page's form.
- `/contact`: the form band was pinned to the left edge from 1440px (dark strip
  on the right); it now spans the screen with the form centred. Choice labels
  break at the slash, radios are 18px, a neutral notice for "received,
  confirmation pending", a progress mark while sending, "受付済み" as a stamp.
- Category pages (12): no inherited "07"; the intro and "この種類の仕事を依頼した
  場合。" bands reach the screen edge at 1920 instead of showing box edges.
- Case pages (11): styled tech tags, one "related services" heading, a readable
  title for assistive technology, the contact note names the project; on dark
  cases the SCOPE / DELIVERY / PRICE row lost a half-drawn panel.
- Demos (11): one shared frame (previously two unrelated ones) closing with a
  TETSU WORKS panel instead of a white strip; inbox and admin keep their own
  page colour inside the frame.
- Experiences (11): an exit to the case page; showcases sit on an artboard from
  1520px, tools fill the screen in their own colour (no white side bars);
  two-word names wrap instead of being cut ("ADMIN DASHBOARD" at 320/360).
- Demo internals keep their identities; fixes were local: SaaS hero fade,
  booking week strip aligned with the content beside it (it ran to the screen
  edge), admin cards scrolling with the page, CSV badge wrap, QA exhibit no
  longer clipping, disclosure markers on the FAQ and the API contract,
  legibility floor.

## Route status

Status is per route after review: **Improved** (changed in this work, with
what), **No change required** (reviewed, nothing to change). Every route below
was reviewed at all eight widths.

### TSUDOWA ROUTES

| Route              | Status   | What                                                          |
| ------------------ | -------- | ------------------------------------------------------------- |
| `/`                | Improved | Legibility floor, nav scaling                                 |
| `/history`         | Improved | Legibility floor, nav scaling                                 |
| `/lab`             | Improved | Legibility floor, nav scaling (LAB product untouched)         |
| `/contact/general` | Improved | Centred panel ≥1440, form states (sending, pending, stamp)    |
| `/privacy`         | Improved | TSUDOWA document layout, contents, storage sentence corrected |
| 404                | Improved | Branded page with next steps                                  |
| Runtime error      | Improved | Branded page with retry and paths                             |

### TETSU WORKS ROUTES

| Route                     | Status   | What                                                                                                              |
| ------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| `/works`                  | Improved | Header/menu, sections 01–07 in order, distinct headings, no orphaned card, ribbon CTA to this form                |
| `/contact`                | Improved | Full-width band with centred form ≥1440, choice wrap, 18px radios, sending / pending / stamp states               |
| `/works/web`              | Improved | WORKS header and menu, no inherited 07, full-bleed bands ≥1440                                                    |
| `/works/lp`               | Improved | WORKS header and menu, no inherited 07, full-bleed bands ≥1440                                                    |
| `/works/coding`           | Improved | WORKS header and menu, no inherited 07, full-bleed bands ≥1440                                                    |
| `/works/nextjs`           | Improved | WORKS header and menu, no inherited 07, full-bleed bands ≥1440                                                    |
| `/works/responsive`       | Improved | WORKS header and menu, no inherited 07, full-bleed bands ≥1440                                                    |
| `/works/improvement`      | Improved | WORKS header and menu, no inherited 07, full-bleed bands ≥1440; before/after diagram on mobile                    |
| `/works/ec`               | Improved | WORKS header and menu, no inherited 07, full-bleed bands ≥1440                                                    |
| `/works/apps`             | Improved | WORKS header and menu, no inherited 07, full-bleed bands ≥1440                                                    |
| `/works/api`              | Improved | WORKS header and menu, no inherited 07, full-bleed bands ≥1440; pipeline step numbers no longer overlap           |
| `/works/automation`       | Improved | WORKS header and menu, no inherited 07, full-bleed bands ≥1440; pipeline step numbers no longer overlap           |
| `/works/design`           | Improved | WORKS header and menu, no inherited 07, full-bleed bands ≥1440                                                    |
| `/works/qa`               | Improved | WORKS header and menu, no inherited 07, full-bleed bands ≥1440; pipeline step numbers no longer overlap           |
| `/projects/cafe`          | Improved | Tech tags, related-services heading, project name in contact note, SCOPE row without half panel, accessible title |
| `/projects/saas`          | Improved | Tech tags, related-services heading, project name in contact note, SCOPE row without half panel, accessible title |
| `/projects/ec`            | Improved | Tech tags, related-services heading, project name in contact note, SCOPE row without half panel, accessible title |
| `/projects/automation`    | Improved | Tech tags, related-services heading, project name in contact note, SCOPE row without half panel, accessible title |
| `/projects/booking`       | Improved | Tech tags, related-services heading, project name in contact note, SCOPE row without half panel, accessible title |
| `/projects/improvement`   | Improved | Tech tags, related-services heading, project name in contact note, SCOPE row without half panel, accessible title |
| `/projects/creative`      | Improved | Tech tags, related-services heading, project name in contact note, SCOPE row without half panel, accessible title |
| `/projects/qa`            | Improved | Tech tags, related-services heading, project name in contact note, SCOPE row without half panel, accessible title |
| `/projects/csv`           | Improved | Tech tags, related-services heading, project name in contact note, SCOPE row without half panel, accessible title |
| `/projects/inbox`         | Improved | Tech tags, related-services heading, project name in contact note, SCOPE row without half panel, accessible title |
| `/projects/admin`         | Improved | Tech tags, related-services heading, project name in contact note, SCOPE row without half panel, accessible title |
| `/demos/cafe`             | Improved | Shared demo frame and TETSU WORKS outro                                                                           |
| `/demos/saas`             | Improved | Shared demo frame and TETSU WORKS outro; hero fade, FAQ markers                                                   |
| `/demos/ec`               | Improved | Shared demo frame and TETSU WORKS outro                                                                           |
| `/demos/automation`       | Improved | Shared demo frame and TETSU WORKS outro; API contract toggle is a 44px target with a +/× marker                   |
| `/demos/booking`          | Improved | Shared demo frame and TETSU WORKS outro; week strip aligned (mobile and desktop)                                  |
| `/demos/improvement`      | Improved | Shared demo frame and TETSU WORKS outro                                                                           |
| `/demos/creative`         | Improved | Shared demo frame and TETSU WORKS outro                                                                           |
| `/demos/qa`               | Improved | Shared demo frame and TETSU WORKS outro                                                                           |
| `/demos/csv`              | Improved | Shared demo frame and TETSU WORKS outro (tool frame); title and badge wrap                                        |
| `/demos/inbox`            | Improved | Shared demo frame and TETSU WORKS outro (tool frame); own page colour kept                                        |
| `/demos/admin`            | Improved | Shared demo frame and TETSU WORKS outro (tool frame); own page colour kept, cards scroll with the page            |
| `/experience/cafe`        | Improved | Exit to case page, artboard ≥1520                                                                                 |
| `/experience/saas`        | Improved | Exit to case page, artboard ≥1520                                                                                 |
| `/experience/ec`          | Improved | Exit to case page, artboard ≥1520                                                                                 |
| `/experience/automation`  | Improved | Exit to case page, artboard ≥1520                                                                                 |
| `/experience/booking`     | Improved | Exit to case page, artboard ≥1520; week strip aligned                                                             |
| `/experience/improvement` | Improved | Exit to case page, artboard ≥1520                                                                                 |
| `/experience/creative`    | Improved | Exit to case page, artboard ≥1520; name wraps at 320                                                              |
| `/experience/qa`          | Improved | Exit to case page, artboard ≥1520                                                                                 |
| `/experience/csv`         | Improved | Exit to case page, tool fills the screen in its own colour ≥1440; name wraps at 320                               |
| `/experience/inbox`       | Improved | Exit to case page, tool fills the screen in its own colour ≥1440; name wraps at 320                               |
| `/experience/admin`       | Improved | Exit to case page, tool fills the screen in its own colour ≥1440; name wraps at 320/360                           |

## Results

Final pass (pass 6) on the final build, 53 routes × 8 widths = 424 loads:

| Check                                   | Result                                                                                                                                                                          |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HTTP status                             | 200 on every route; 404 on the not-found probe                                                                                                                                  |
| Horizontal overflow / escaping elements | 0 / 0                                                                                                                                                                           |
| Clipped text                            | 0 (only intentionally visually-hidden labels)                                                                                                                                   |
| Broken images / failed requests         | 0 / 0                                                                                                                                                                           |
| JS errors                               | 0 (the 404 page logs only its own 404 status)                                                                                                                                   |
| axe WCAG 2.0/2.1/2.2 A/AA (390 + 1440)  | 0 violations in 106 runs                                                                                                                                                        |
| Readable text below the floor           | 0 (the experience exit is drawn at 0px ≤520px on purpose; its `aria-label` keeps the name)                                                                                      |
| Targets under 24px                      | Only the 18px radios inside 48px labels, the inline privacy link in the consent sentence (WCAG 2.5.8 inline exception) and the CSV file input hidden behind its labelled button |

Runtime error screen (temporary throwing route, all eight widths): HTTP 500
with the TSUDOWA error screen, no overflow, no text below the floor, no small
targets, axe 0 violations at 390 and 1440, visible keyboard focus.

Verification of the final tree:

| Command                                              | Result                                 |
| ---------------------------------------------------- | -------------------------------------- |
| `npm run verify` (lint, typecheck, unit, build)      | exit 0; unit 143 / 143                 |
| `npx playwright test` (Next build)                   | exit 0; 141 / 141                      |
| `npm run typecheck:workers`                          | exit 0                                 |
| `node scripts/workers-production.mjs build`          | exit 0 (writes only gitignored output) |
| E2E against the Workers bundle in local workerd      | exit 0; 141 / 141                      |
| `prettier --check` on changed files                  | clean                                  |
| Credential patterns / dependency changes in the diff | 0 / 0                                  |

## Known limits

- The legacy WORKS cascade (`components/portfolio-styles.css`, ten layers) is
  still present for everything not listed above; this pass consolidated the
  shared components and fixed the rest in their owning rules.
- Chrome renders `word-break: auto-phrase`; other browsers fall back to normal
  Japanese line breaking.
- Demo preview images (`public/previews/*`) were not regenerated; demo
  internals changed only in small type and spacing.
- The privacy sentence was corrected for accuracy; the owner (or legal) should
  confirm the wording before release.

## Release — real Cloudflare QA and production, 2026-09-19/20

The pass-6 QA ran locally with the contact form disabled. On the preview Worker
the real Turnstile widget and a second detector (text covered by another
element, sampled on every rendered line) found five defects, each fixed on this
branch, re-deployed to the preview and re-checked on all 53 routes at all eight
widths before release:

| Commit    | Defect                                                                                                                                                                                                                                                                                                                    | Fix                                                                                                                                                                                      |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `5c1f4a8` | Turnstile's flexible size has a 300px minimum; on 320–390px the form is narrower, so the widget widened the card and the grid, pushing the whole intake section past the viewport (+35px `/contact`, +48px `/contact/general` at 320). Also on the previous production build and on every page with the form (26 routes). | Compact size (150×140) below 300px of form width, flexible above, re-rendered on rotation; inline-size containment around the host; `minmax(0, 1fr)` track. Security settings unchanged. |
| `f0766dd` | Both mobile menus closed themselves when React hydrated, so a menu opened while the page was loading snapped shut.                                                                                                                                                                                                        | Close only on an actual path change after the first render.                                                                                                                              |
| `001cb82` | The runtime error screen's kicker contained Japanese at 11px (floor 12px).                                                                                                                                                                                                                                                | Kicker at `--text-caption`.                                                                                                                                                              |
| `8b0f7ee` | `/works` catalogue intro used `gap: 6%`; a percentage row gap resolves against the final height, so at 320–768px the exhibit hung ~60px into the ribbon and at 768px its box covered the "TETSU WORKSに相談する" CTA (not clickable, also on the previous production).                                                    | Fixed 56px row gap in the one-column layout.                                                                                                                                             |
| `8b0f7ee` | Collage images over text: the dashboard card over the "01 / PRODUCT WEBSITE / FLOWSTATE" caption (`/works`, 320–430 and 1024–1920px); the dashboard screenshot over "THAT WORKS." and the tagline in the home TETSU WORKS window (320–390px).                                                                             | Caption wraps with a gap and keeps room for the card; the home window places the screenshot after the copy up to 760px.                                                                  |

Each fix has an E2E test that fails on the previous build. Results on the
released build (preview `90cd99dc` and production `e41e0535`): 424/424 loads
clean on both, axe 0, covered text 0, real Turnstile 104/104 without overflow
and solved at 320/360/390/430, interaction checks 55/55, crawler-visible
metadata identical to the previous production. Details, gates, performance and
rollback: [production status](production-status.md).

The privacy wording noted under "Known limits" is still awaiting OWNER / legal
confirmation; it was not changed.
