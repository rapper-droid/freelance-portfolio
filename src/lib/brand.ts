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

/** The parent brand. TANEBI WORKS is the part of it that takes commissions. */
export const BRAND_PARENT = "TANEBI";

/** Latin lockup, for the header where there is room for three words. */
export const BRAND_PARENT_LOCKUP = `A ${BRAND_PARENT} SERVICE`;

/** Plain Japanese, for the footer where the relationship deserves a sentence. */
export const BRAND_PARENT_SENTENCE = `${BRAND_NAME} は ${BRAND_PARENT} の制作・受託部門です。`;

/**
 * TANEBI HQ's address.
 *
 * Deliberately not linked yet. tanebi.jp is not published, and a site that
 * takes real enquiries must not ship an outbound link to a domain that does
 * not answer — a dead link next to the brand name reads as a dead business.
 * The name is shown as text until HQ is live; flip this one flag then and the
 * footer becomes a link.
 */
export const PARENT_SITE = "https://tanebi.jp";
export const PARENT_SITE_IS_LIVE = false;
