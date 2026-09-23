import type { MissingField, Warning } from "../types";

/**
 * The reply draft (指示書 §07-2).
 *
 * A draft is allowed to acknowledge, restate what was understood, and ask the
 * questions that are actually open. It is not allowed to commit: no price, no
 * deadline, no acceptance of the work. Those are the owner's to give, and a
 * draft that offers them on their behalf is the failure this workflow exists
 * to avoid (指示書 R08).
 *
 * The composition is deterministic. There is no value in a model here — the
 * sentences are fixed and the variable parts come from fields that were
 * already extracted with evidence.
 */

export const REPLY_POLICY_VERSION = "reply-2026.09.22";

export type ReplyInput = {
  recipientName: string;
  /** Restated understanding, each line traceable to an evidence id. */
  understood: Array<{ label: string; value: string; evidenceIds: string[] }>;
  missing: MissingField[];
  warnings: Warning[];
  /** Optional rough figure, only when a price list actually covers it. */
  estimate?: {
    label: string;
    amountYen: number;
    assumptions: string[];
  };
  signature: string;
};

export type ReplyDraft = {
  subject: string;
  body: string;
  /** Questions the draft asks, so answers can be matched back later. */
  asks: string[];
  /** Phrases a reviewer should look at before approving. */
  reviewNotes: string[];
  policyVersion: string;
};

/**
 * Phrases that would turn a draft into a commitment. Checked after
 * composition, so a future edit to the templates cannot quietly reintroduce
 * one, and surfaced as a review note rather than silently stripped.
 */
const COMMITMENT_PATTERNS: Array<[RegExp, string]> = [
  [/お約束(?:し|いた)/, "納期や結果を約束する表現"],
  [/確定(?:金額|料金|価格)/, "金額を確定と読める表現"],
  [/必ず(?:間に合|対応|完了)/, "無条件の保証"],
  [/(?:無料|値引き|割引)(?:に)?(?:します|いたします)/, "値引きの確約"],
  [/(?:契約|受注)(?:を)?(?:承(?:り|諾)|確定)(?:し|いた)/, "受注の確約"],
];

export function composeReply(input: ReplyInput): ReplyDraft {
  const asks = input.missing.map((m) => questionFor(m));
  const lines: string[] = [];

  lines.push(`${input.recipientName} 様`, "");
  lines.push("お問い合わせいただき、ありがとうございます。", "");

  if (input.understood.length) {
    lines.push("いただいた内容を、次のように理解しました。");
    for (const u of input.understood) lines.push(`・${u.label}：${u.value}`);
    lines.push("");
  }

  if (asks.length) {
    lines.push(
      asks.length === 1
        ? "確認させていただきたい点が1点ございます。"
        : `確認させていただきたい点が${asks.length}点ございます。`,
    );
    for (const a of asks) lines.push(`・${a}`);
    lines.push("");
  }

  if (input.estimate) {
    lines.push(
      `${input.estimate.label}は、現時点の情報では ${input.estimate.amountYen.toLocaleString("ja-JP")}円（税込）が目安です。`,
      "次の前提で計算しています。",
    );
    for (const a of input.estimate.assumptions) lines.push(`・${a}`);
    lines.push(
      "前提が変わる場合は金額も変わります。正式なお見積りは、上記の確認後に改めてお出しします。",
      "",
    );
  }

  lines.push(
    asks.length
      ? "お手数ですが、上記についてお聞かせいただけますでしょうか。"
      : "内容を確認のうえ、改めてご連絡いたします。",
    "",
    "どうぞよろしくお願いいたします。",
    input.signature,
  );

  const body = lines.join("\n");
  const reviewNotes: string[] = [];
  for (const [pattern, label] of COMMITMENT_PATTERNS)
    if (pattern.test(body))
      reviewNotes.push(`${label}が含まれています。承認前に確認してください。`);
  for (const w of input.warnings)
    if (w.severity === "blocking") reviewNotes.push(w.message);

  return {
    subject: `Re: お問い合わせの件${asks.length ? "（確認のお願い）" : ""}`,
    body,
    asks,
    reviewNotes,
    policyVersion: REPLY_POLICY_VERSION,
  };
}

const QUESTIONS: Record<string, string> = {
  durationMinutes: "1件あたりの所要時間をお教えいただけますか。",
  bufferMinutes: "前後に必要な準備・片付けの時間はどのくらいでしょうか。",
  startDate: "ご希望の日付をお教えいただけますか。",
  startTime: "ご希望の時間帯をお教えいただけますか。",
  currentTools: "現在お使いのツール（カレンダー・メール等）をお教えください。",
  cadence: "どのくらいの頻度で発生するお仕事でしょうか。",
  volume: "1か月あたりのおおよその件数をお教えください。",
  availabilityNote: "対応可能な曜日・時間帯をお教えください。",
  staffing: "対応される方は何名でしょうか。",
};

const questionFor = (m: MissingField) =>
  QUESTIONS[m.field] ?? `${m.label}についてお教えいただけますか。`;

/**
 * A rough figure, only when the selected items are all in the price list.
 * An unknown item stops the estimate rather than being priced at zero — a
 * quote that silently omits work is worse than no quote (指示書 §07-2).
 */
export function roughEstimate(
  selectedItemIds: readonly string[],
  priceList: ReadonlyArray<{ id: string; label: string; amountYen: number }>,
): { amountYen: number; assumptions: string[]; unknown: string[] } | null {
  if (!selectedItemIds.length) return null;
  const unknown = selectedItemIds.filter(
    (id) => !priceList.some((p) => p.id === id),
  );
  if (unknown.length) return null;
  const items = selectedItemIds.map((id) =>
    priceList.find((p) => p.id === id)!,
  );
  return {
    amountYen: items.reduce((sum, i) => sum + i.amountYen, 0),
    assumptions: items.map(
      (i) => `${i.label}：${i.amountYen.toLocaleString("ja-JP")}円`,
    ),
    unknown: [],
  };
}
