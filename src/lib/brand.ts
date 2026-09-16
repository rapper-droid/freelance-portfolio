/**
 * Public brand vocabulary.
 *
 * TSUDOWA is the parent brand. TETSU WORKS is the commissioned design and
 * development arm shown on this site. Product ids, project slugs, routes,
 * prices and delivery history are intentionally outside this module and do
 * not change as part of the brand migration.
 */
export const BRAND_NAME = "TSUDOWA";
export const BRAND_READING = "ツドワ";
export const BRAND_OPERATOR = "TETSU";
export const BRAND_TAGLINE = "GATHER. BUILD. EXPAND.";
export const BRAND_MESSAGE =
  "集まるための輪ではなく、集まり、つくり、次へ広がる輪。";

/** The public service brand responsible for commissioned work. */
export const WORKS_BRAND_NAME = "TETSU WORKS";
export const WORKS_TAGLINE = "BUILD. AUTOMATE. DELIVER.";
export const WORKS_LOCKUP = "CLIENT SERVICES / TETSU WORKS";
export const WORKS_RELATIONSHIP = `${WORKS_BRAND_NAME} は ${BRAND_NAME} の制作・受託部門です。`;

/** Previous public names, retained only to repair already-branded titles. */
export const LEGACY_BRAND_NAMES = ["TANEBI WORKS", "TETSU / WORKS"] as const;

export const BRAND_TITLE_SUFFIX = ` | ${BRAND_NAME}`;
export const LEGACY_TITLE_SUFFIXES = LEGACY_BRAND_NAMES.map(
  (name) => ` | ${name}`,
);

export function displayDomain(origin: string): string {
  return new URL(origin).host;
}

export const BRAND_STRUCTURE = [
  {
    name: WORKS_BRAND_NAME,
    role: "CLIENT SERVICES",
    state: "ACTIVE",
    description: "Web制作・業務自動化・納品支援を担う受託部門。",
  },
  {
    name: "TSUKUTTA LAB",
    role: "PRODUCTS & PLAY",
    state: "INDEPENDENT BRAND",
    description: "プロダクト、ゲーム、実験的な制作を育てる別ブランド。",
  },
] as const;
