# TSUDOWA / TETSU WORKS — visual audit and decisions

Date: 2026-09-17 (JST). Baseline HEAD: `b41cf16765e10cedda82c073c175481e67f8503f`.
Branch: `tsudowa/parent-brand-migration-work`. Local-only implementation; no push, merge or deploy.

## Baseline and scope

37 routes: TOP / WORKS / privacy / 12 categories / 11 project pages / 11 demos.
Baseline images: `screenshots/premium/before/` (1440×1000, 390×844).
The source product registry (`src/lib/portfolio.ts`) is protected. Category ids, slugs, price,
duration and materials are not changed by this pass.

| Route family                                           | Before: observed issue                                                                      | Direction                                                                                                                       | Evidence / retained behavior                                                                 |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `/`                                                    | Large text and abstract ring carry almost all of the first view; work evidence starts later | Photo-led hospitality example + compact workflow UI beside parent-brand statement                                               | Brand architecture and TETSU WORKS remain distinct; all service/price/contact links retained |
| `/works`                                               | Introductory text and filters, little sense of completed work before scrolling              | Two contrasting work examples and clear path to catalogue                                                                       | All 11 projects and 12 filters retained                                                      |
| `/works/web`, `/works/ec`                              | Low-contrast decorative background communicates little about a deliverable                  | Photography / product material as tangible evidence                                                                             | Existing sales data preserved                                                                |
| `/works/lp`, `/works/nextjs`, `/works/apps`            | Same text-first layout                                                                      | Actual responsive demo screen in a framed product view                                                                          | Local captures, no invented client screenshots                                               |
| `/works/responsive`                                    | Abstract devices in a low-information background                                            | Desktop + mobile images of the same delivered demo                                                                              | Labels expose the device relationship                                                        |
| `/works/automation`, `/works/api`                      | Flow explanation needs reading before its shape is understood                               | Intake → transformation → result / human decision as semantic cards                                                             | No claim of a live external integration                                                      |
| `/works/qa`                                            | Assurance expressed mostly in prose                                                         | Delivery-quality dossier of concrete check categories                                                                           | Checkmarks label review criteria, not unmeasured success scores                              |
| `/works/coding`, `/works/design`, `/works/improvement` | Similar-looking abstract heroes                                                             | Code structure, creative screen, before/better composition                                                                      | No change to the product offer or scope                                                      |
| `/projects/*` (11)                                     | Repetitive frames and weak hierarchy between preview and explanation                        | Larger project-specific stage, numbered case narrative, aligned device previews                                                 | All honest self-initiated labels, prices, delivery data, demo links retained                 |
| `/demos/cafe`                                          | Small arched hero image; food mainly illustrated; atmosphere weak                           | Four coherent generated photographs, editorial menu, recommended feature, room/food rhythm                                      | Six choices per menu, prices, fictional address/map, disclaimer preserved                    |
| `/demos/inbox`                                         | Explanatory diagram and long introduction delay the workbench                               | Live status summary, compact list/detail panels, collapsible context                                                            | Filtering, status/owner update, local draft/copy, no email sending                           |
| `/demos/admin`                                         | Summary numbers detached from visual hierarchy                                              | Data-derived customer totals and ranked meters, clearer tables                                                                  | CRUD, local persistence, history, dialogs and error states                                   |
| `/demos/booking`                                       | Selected date is only a dropdown                                                            | Keyboard-operable seven-day strip with real sample counts                                                                       | Existing dropdown, create/collision/cancel/reset behavior retained                           |
| Other demos (7)                                        | Product identity exists but framing and spacing are inconsistent                            | Per-demo surfaces: SaaS lavender, commerce sage, Relay mint, QA dossier, creative poster, CSV workbench, improvement comparison | Interactive product behavior stays intact                                                    |
| `/privacy`                                             | Primarily legal reading content                                                             | Shared typography/navigation/focus polish only                                                                                  | No decorative hero added to a page whose purpose is careful reading                          |

## Reference decisions

- [Pentagram](https://www.pentagram.com/work): vary image scale, keep descriptions beside work, let actual outcomes lead. Do not copy its visual identity or client imagery.
- [Kurasu](https://kurasu.kyoto/): use credible material/food/space photography. Do not borrow its shop facts, product photography or people.
- [Cal.com](https://cal.com/): pair a concise task proposition with a visible usable calendar. Implement a simple weekly strip appropriate to the existing demo, not a copied interface.
- [Linear](https://linear.app/): product-first writing and UI details. No code, logo, screenshot or animation is reused.

Public reference capture script: `scripts/premium-reference-capture.mjs`. Its captures stay outside this repo's public assets.
Linear's browser capture did not reveal the main body; it was used only as a textual/product-structure reference, not as visual rendering evidence.
New assets and prompt summaries: `IMAGE_SOURCES.md`.

## Review method

1. Capture all 37 routes at the same desktop/mobile dimensions before and after.
2. Inspect the contact sheets and individual key-page/full-page images, including café menu, access, inbox and booking.
3. Exercise keyboard, hover/press, client navigation, reduced-motion preference changes and new data-driven summaries.
4. Re-run the existing unit/E2E suite and route/overflow/image/link/SEO checks on a local production build.
5. Add a 37-route × 2-size axe sweep rather than relying only on representative pages.
6. Measure Lighthouse separately from browser test load. Retain previous measurements for comparison; these are simulated local values, not field data.

## Remaining human review

Automation cannot certify that a design is the "highest class" or will generate sales.
OWNER reviews TSUDOWA_BRAND_FEEL, photographic believability, voice, mobile rhythm and sales suitability.
TSUKUTTA LAB remains an independent brand in the parent structure. No unverified external product URL is introduced.
Contact delivery and production credentials are not activated here. No domain, DNS, email, hosting or deployment mutation is part of this pass.
