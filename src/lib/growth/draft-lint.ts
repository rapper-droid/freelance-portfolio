/**
 * Checks outbound drafts (marketplace listings, proposals, posts) against the
 * rules recorded in docs/growth/CHANNEL_POLICY.md and the price status in
 * docs/growth/OFFER_REVIEW.md. It reads text only: it never sends anything.
 *
 * A draft starts with a metadata block:
 *
 *   <!-- growth-draft
 *   channel: coconala
 *   status: template | ready_for_owner
 *   -->
 *
 * `template` drafts may keep 【…】 placeholders; `ready_for_owner` drafts may
 * not, because those are the ones a person would paste as-is.
 *
 * Only the text that would actually be sent is checked. Mark it with
 * `<!-- send:start -->` … `<!-- send:end -->`; a draft without markers is
 * checked in full. Notes around the sendable text (for example "do not write
 * 24時間対応") are therefore not mistaken for claims.
 */
export type Channel =
  "coconala" | "lancers" | "crowdworks" | "partner" | "x" | "internal";
export type DraftMeta = {
  channel: Channel;
  status: "template" | "ready_for_owner";
  urlApproved: boolean;
};
export type Finding = { level: "error" | "warn"; rule: string; detail: string };

const channels: Channel[] = [
  "coconala",
  "lancers",
  "crowdworks",
  "partner",
  "x",
  "internal",
];

/** Claims that need evidence we do not have. */
const unbackedClaims = [
  "必ず",
  "保証します",
  "即日納品",
  "24時間対応",
  "24時間以内に納品",
  "実績多数",
  "多数の企業",
  "売上が上がります",
  "AIが分析",
  "完全自動",
];
/** Contact details that must not appear in a marketplace draft. */
const contactPatterns: [string, RegExp][] = [
  ["メールアドレス", /[\w.+-]+@[\w-]+\.[\w.-]+/],
  ["電話番号", /(?:^|\D)0\d{1,4}-\d{1,4}-\d{3,4}(?:\D|$)/],
  [
    "チャットID",
    /(?:LINE|ライン|Chatwork|チャットワーク|Slack)\s*(?:ID|アカウント)/i,
  ],
  ["SNSハンドル", /(?:^|\s)@[A-Za-z0-9_]{3,}/],
];
const offPlatformHints = [
  "直接ご連絡",
  "直接連絡",
  "メールでご連絡ください",
  "サイト外",
  "個別にご連絡先",
];

export function parseDraft(text: string): {
  meta: DraftMeta | null;
  body: string;
  error?: string;
} {
  const match = /^<!--\s*growth-draft\s*\n([\s\S]*?)-->/.exec(text.trim());
  if (!match)
    return {
      meta: null,
      body: text,
      error: "growth-draft メタデータがありません",
    };
  const fields = Object.fromEntries(
    match[1]
      .split("\n")
      .map((line) => line.split(":"))
      .filter((parts) => parts.length >= 2)
      .map(([k, ...v]) => [k.trim(), v.join(":").trim()]),
  );
  const channel = fields.channel as Channel;
  if (!channels.includes(channel))
    return {
      meta: null,
      body: text,
      error: `channel が不正です: ${fields.channel}`,
    };
  if (fields.status !== "template" && fields.status !== "ready_for_owner")
    return {
      meta: null,
      body: text,
      error: `status が不正です: ${fields.status}`,
    };
  return {
    meta: {
      channel,
      status: fields.status,
      urlApproved: fields.url_approved === "true",
    },
    body: text.slice(text.indexOf("-->") + 3),
  };
}

/** Amounts in yen that the site already publishes, plus "0円". */
export function allowedAmounts(publishedPrices: readonly string[]) {
  const amounts = new Set<string>(["0"]);
  for (const price of publishedPrices)
    for (const found of price.matchAll(/([\d,]+)円/g)) amounts.add(found[1]);
  return amounts;
}

/** The parts a person would paste, or the whole body when unmarked. */
export function sendableText(body: string) {
  const regions = [
    ...body.matchAll(/<!--\s*send:start\s*-->([\s\S]*?)<!--\s*send:end\s*-->/g),
  ].map((m) => m[1]);
  return regions.length ? regions.join("\n") : body;
}

export function lintDraft(
  text: string,
  publishedPrices: readonly string[],
): Finding[] {
  const findings: Finding[] = [];
  const { meta, body: whole, error } = parseDraft(text);
  if (!meta) return [{ level: "error", rule: "meta", detail: error! }];
  const body = sendableText(whole);
  const add = (
    rule: string,
    detail: string,
    level: Finding["level"] = "error",
  ) => findings.push({ level, rule, detail });

  if (meta.status === "ready_for_owner") {
    // 【ラベル】値 at the start of a line is the brief format, not a blank to
    // fill; anything else in brackets is a placeholder someone forgot.
    const placeholder = [...body.matchAll(/【[^】\n]*】/g)].filter((m) => {
      const lineStart =
        m.index === 0 ||
        body[m.index - 1] === "\n" ||
        body[m.index - 1] === "\r";
      const next = body[m.index + m[0].length] ?? "";
      const particle = /[をはがにのへでとやも、。]/.test(next);
      return !lineStart || particle;
    });
    if (placeholder.length)
      add(
        "placeholder",
        `未置換の差し込み: ${[...new Set(placeholder.map((m) => m[0]))].join(", ")}`,
      );
    if (/\bTODO\b|要確認/.test(body))
      add("placeholder", "TODO / 要確認 が残っています");
  }

  // `internal` drafts are notes to ourselves — an operating checklist, a spec
  // sheet — that nobody outside reads. The claim and price rules exist to
  // govern what a customer is told, so they do not apply there, for the same
  // reason the contact rules below already skip it. An internal note quoting a
  // platform's own wording, or recording what is left after fees, is correct.
  const customerFacing = meta.channel !== "internal";
  if (customerFacing) {
    for (const claim of unbackedClaims)
      if (body.includes(claim)) add("claim", `根拠のない表現: ${claim}`);

    const amounts = allowedAmounts(publishedPrices);
    for (const found of body.matchAll(/([\d,]+)\s*円/g))
      if (!amounts.has(found[1]))
        add(
          "price",
          `未承認の金額: ${found[0]}（公開済みの価格のみ使用できます）`,
        );
  }

  const marketplace =
    meta.channel === "coconala" ||
    meta.channel === "crowdworks" ||
    meta.channel === "lancers";
  if (marketplace) {
    for (const [label, pattern] of contactPatterns)
      if (pattern.test(body)) add("contact", `連絡先の記載（${label}）`);
    for (const hint of offPlatformHints)
      if (body.includes(hint))
        add("off_platform", `サイト外への誘導と読まれる表現: ${hint}`);
  }

  const urls = [...body.matchAll(/https?:\/\/[^\s)）」]+/g)].map((m) => m[0]);
  if (urls.length) {
    if (meta.channel === "coconala")
      add("url", `ココナラ向け原稿にURL: ${urls.join(", ")}`);
    if (meta.channel === "crowdworks" && !meta.urlApproved)
      add(
        "url",
        `CrowdWorks向け原稿にURL（規約上の可否が未確認）: ${urls.join(", ")}`,
      );
    for (const url of urls)
      if (!/^https:\/\/(tsudowa\.com|tetsuworks\.com)(\/|$)/.test(url))
        add("url", `自社以外のURL: ${url}`, "warn");
  }
  return findings;
}
