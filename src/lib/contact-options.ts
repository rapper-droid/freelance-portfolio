// Intake ranges only. Product prices remain unchanged.
export const contactKinds = [
  "Webサイト / LP",
  "UI / 業務ツール",
  "AI / 自動化",
  "API / システム連携",
  "改修 / レスポンシブ",
  "QA / 不具合修正",
  "その他",
  "まだ決まっていない",
] as const;
export const contactBudgets = [
  "〜3万円",
  "3〜5万円",
  "5〜10万円",
  "10〜30万円",
  "30万円〜",
  "未定",
] as const;
export const contactStages = [
  "アイデア段階",
  "仕様あり",
  "デザインあり",
  "既存サイト・システムあり",
  "他社制作物を改修",
  "相談しながら決めたい",
] as const;
export const contactTimings = [
  "できるだけ早く",
  "1〜2週間",
  "1か月以内",
  "1〜3か月",
  "未定",
] as const;
export const kindCodes = [
  "WEB",
  "UI",
  "AUTOMATION",
  "API",
  "IMPROVEMENT",
  "QA",
  "OTHER",
  "CONSULT",
];
export const categoryKinds: Record<string, string> = {
  web: contactKinds[0],
  lp: contactKinds[0],
  coding: contactKinds[0],
  nextjs: contactKinds[1],
  responsive: contactKinds[4],
  improvement: contactKinds[4],
  ec: contactKinds[0],
  apps: contactKinds[1],
  api: contactKinds[3],
  automation: contactKinds[2],
  design: contactKinds[6],
  qa: contactKinds[5],
};
export const demoCategories: Record<string, string> = {
  cafe: "web",
  saas: "lp",
  ec: "ec",
  inbox: "apps",
  admin: "apps",
  csv: "automation",
  automation: "automation",
  booking: "api",
  improvement: "improvement",
  creative: "design",
  qa: "qa",
};
export function contactContext(page: string) {
  const match = /^\/(works|projects|demos|experience)\/([a-z-]+)$/.exec(page);
  if (match) {
    const [, scope, slug] = match;
    const category =
      scope === "works"
        ? Object.hasOwn(categoryKinds, slug)
          ? slug
          : ""
        : Object.hasOwn(demoCategories, slug)
          ? demoCategories[slug]
          : "";
    if (!category) return null;
    return {
      page,
      category,
      project: scope === "projects" ? slug : "",
      demo: scope === "demos" || scope === "experience" ? slug : "",
    };
  }
  return ["/", "/works", "/contact"].includes(page)
    ? { page, category: "", project: "", demo: "" }
    : null;
}
export function contactHref(page: string) {
  return (
    "/contact?from=" + encodeURIComponent(contactContext(page)?.page || "/")
  );
}
export function safeReference(value: string) {
  if (!value) return true;
  if (value.length > 2000 || /[\s\u0000-\u001f\u007f]/.test(value))
    return false;
  try {
    const url = new URL(value);
    return (
      ["http:", "https:"].includes(url.protocol) &&
      !!url.hostname &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}
