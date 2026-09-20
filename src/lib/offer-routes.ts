/**
 * Published offer slugs and the category each one files under, kept apart
 * from the offer copy so the contact form (a client component) can accept
 * `/services/<slug>` without shipping every offer to the browser. A unit
 * test keeps this list equal to the published offers in offers.ts.
 */
export const offerRoutes = {
  "web-fix": { category: "improvement", title: "表示崩れの修正 1か所" },
  "csv-routine": { category: "automation", title: "CSV整形ルーチン 1本" },
} as const;
export type OfferSlug = keyof typeof offerRoutes;
