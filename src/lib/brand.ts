/**
 * The brand, in one place.
 *
 * The public name became TANEBI WORKS on 2026-09-16. Before that it was
 * TETSU / WORKS, and that remains true of everything already sent, signed or
 * published — the former name is kept here as a fact, not deleted.
 *
 * WHAT THIS RENAME IS NOT: it is not a change of identity. Category ids,
 * project slugs, every URL, the contact route, quotes, contracts and delivery
 * history all keep the values they had. Only what a reader sees changes.
 */
export const BRAND_NAME = "TANEBI WORKS";

/** The previous public name. Kept for the record; never reused as the title. */
export const BRAND_FORMER_NAME = "TETSU / WORKS";

/** The person behind it. TANEBI is the activity; TETSU is who runs it. */
export const BRAND_OPERATOR = "TETSU";

export const BRAND_TAGLINE = "BUILD. AUTOMATE. DELIVER.";

export const BRAND_TITLE_SUFFIX = ` | ${BRAND_NAME}`;

/** Recognised so an already-suffixed title is never double-suffixed. */
export const LEGACY_TITLE_SUFFIX = ` | ${BRAND_FORMER_NAME}`;

/**
 * The domain shown to a reader, derived from the configured origin.
 *
 * Deliberately not a literal: the site is at tetsuworks.com today and will be
 * at works.tanebi.jp later, and a hard-coded label would go stale silently at
 * exactly the moment it matters most. Changing NEXT_PUBLIC_SITE_URL moves this
 * along with canonical, sitemap and robots.
 *
 * Takes the origin rather than importing it, so this module stays a leaf and
 * seo.ts can depend on it without a cycle.
 */
export function displayDomain(origin: string): string {
  return new URL(origin).host;
}
