/**
 * The small sales ledger. It lives outside this repository (the repo is
 * public): the scripts read and write `GROWTH_DATA_DIR`, default
 * `~/.tsudowa-growth/`. Nothing here sends anything; a lead only ever moves
 * forward because a person did something.
 *
 * CrowdWorks jobs are NOT managed here — they go to CW APPLY OS, which
 * already scores and gates them. `toCwApplyOsImport` produces the text that
 * tool accepts, so the same lead is not tracked in two places.
 */
export const leadStates = [
  "NEW",
  "SCREENED",
  "DRAFT_READY",
  "OWNER_APPROVED",
  "SENT",
  "REPLIED",
  "QUALIFIED",
  "QUOTED",
  "WON",
  "LOST",
  "PAUSED",
] as const;
export type LeadState = (typeof leadStates)[number];

export const sourceTypes = [
  "open_request", // 公開されている募集
  "partner_call", // 協業・パートナー募集
  "inbound", // 自分に届いた相談
  "referral", // 紹介（相手の同意あり）
] as const;
export type SourceType = (typeof sourceTypes)[number];

/** Three-valued on purpose: not knowing is different from knowing it is false. */
export type Tri = "TRUE" | "FALSE" | "UNKNOWN";

export type Lead = {
  id: string;
  sourceType: SourceType;
  sourceUrl: string;
  platform?: "crowdworks" | "lancers" | "coconala" | "web" | "other";
  title: string;
  fetchedAt: string;
  publishedAt?: string;
  observedFacts: string[];
  unknowns: string[];
  offerIds: string[];
  gates: {
    stillOpen: Tri;
    contactAllowed: Tri; // 募集が連絡を受け付けているか
    withinCapability: Tri;
    messageFirstOk: Tri; // 会議・常駐が必須でないか
    noDuplicate: Tri;
    notOptedOut: Tri;
  };
  score?: LeadScore;
  state: LeadState;
  nextAction?: string;
  dueAt?: string;
  notes?: string;
  history?: { at: string; from: LeadState; to: LeadState; note?: string }[];
};

export type LeadScore = {
  version: 1;
  fit: number; // 30 商品・実装能力との一致
  clarity: number; // 20 成果物・作業範囲の明確さ
  budget: number; // 15 費用対効果
  messageFirst: number; // 15 メッセージ中心で進められるか
  schedule: number; // 10 納期・稼働余力
  freshness: number; // 10 実在性と鮮度
  reasons: Record<string, string>;
};
export const scoreWeights = {
  fit: 30,
  clarity: 20,
  budget: 15,
  messageFirst: 15,
  schedule: 10,
  freshness: 10,
} as const;

export function scoreTotal(score: LeadScore) {
  return (
    score.fit +
    score.clarity +
    score.budget +
    score.messageFirst +
    score.schedule +
    score.freshness
  );
}

/** Which gates a lead fails. UNKNOWN never passes a gate on its own. */
export function failedGates(lead: Lead): string[] {
  const labels: Record<keyof Lead["gates"], string> = {
    stillOpen: "募集が現在も受付中か不明・終了",
    contactAllowed: "連絡してよい根拠がない",
    withinCapability: "対応できる範囲か確認できない",
    messageFirstOk: "会議・常駐が必須、または不明",
    noDuplicate: "重複提案の可能性",
    notOptedOut: "辞退・配信停止の記録がある、または不明",
  };
  return (Object.keys(labels) as (keyof Lead["gates"])[])
    .filter((key) => lead.gates[key] !== "TRUE")
    .map((key) => labels[key]);
}

export type Verdict =
  | { decision: "blocked"; reasons: string[] }
  | { decision: "needs_review"; total: number }
  | { decision: "priority"; total: number }
  | { decision: "drop"; total: number }
  | { decision: "unscored"; reasons: string[] };

/**
 * A lead may only be drafted for the owner when every gate is TRUE. The score
 * then sorts what survives; it is not a probability of winning the job.
 */
export function verdict(lead: Lead): Verdict {
  const reasons = failedGates(lead);
  if (reasons.length) return { decision: "blocked", reasons };
  if (!lead.score) return { decision: "unscored", reasons: ["採点がない"] };
  const total = scoreTotal(lead.score);
  if (total >= 80) return { decision: "priority", total };
  if (total >= 65) return { decision: "needs_review", total };
  return { decision: "drop", total };
}

export function validateLead(value: unknown): string[] {
  const problems: string[] = [];
  const lead = value as Partial<Lead>;
  if (!lead || typeof lead !== "object") return ["レコードが不正"];
  if (!lead.id) problems.push("id がない");
  if (!lead.title) problems.push("title がない");
  if (!lead.sourceUrl || !/^https:\/\//.test(lead.sourceUrl))
    problems.push("sourceUrl が https の一次情報でない");
  if (!lead.fetchedAt || Number.isNaN(Date.parse(lead.fetchedAt)))
    problems.push("fetchedAt が日時でない");
  if (!Array.isArray(lead.observedFacts) || !lead.observedFacts.length)
    problems.push("observedFacts（確認した事実）が空");
  if (!lead.state || !leadStates.includes(lead.state))
    problems.push("state が不正");
  if (lead.score) {
    for (const [key, max] of Object.entries(scoreWeights)) {
      const points = lead.score[key as keyof typeof scoreWeights];
      if (typeof points !== "number" || points < 0 || points > max)
        problems.push(`score.${key} が 0〜${max} の範囲にない`);
      else if (points > 0 && !lead.score.reasons?.[key])
        problems.push(`score.${key} に根拠がない`);
    }
  }
  if (lead.state === "SENT" && !lead.history?.some((h) => h.to === "SENT"))
    problems.push("SENT なのに送信の記録がない");
  return problems;
}

export type Counts = {
  total: number;
  byState: Record<string, number>;
  blocked: number;
  priority: number;
  needsReview: number;
  dropped: number;
  unscored: number;
};
export function counts(leads: Lead[]): Counts {
  const byState: Record<string, number> = {};
  let blocked = 0,
    priority = 0,
    needsReview = 0,
    dropped = 0,
    unscored = 0;
  for (const lead of leads) {
    byState[lead.state] = (byState[lead.state] ?? 0) + 1;
    const v = verdict(lead);
    if (v.decision === "blocked") blocked++;
    else if (v.decision === "priority") priority++;
    else if (v.decision === "needs_review") needsReview++;
    else if (v.decision === "drop") dropped++;
    else unscored++;
  }
  return {
    total: leads.length,
    byState,
    blocked,
    priority,
    needsReview,
    dropped,
    unscored,
  };
}

/**
 * CrowdWorks jobs are handed to CW APPLY OS in its paste format: the job URL
 * and the posting text, separated by `---`. Only leads that carry a
 * crowdworks.jp job URL are included.
 */
export function toCwApplyOsImport(leads: Lead[]) {
  return leads
    .filter((l) =>
      /^https:\/\/crowdworks\.jp\/public\/jobs\/\d+/.test(l.sourceUrl),
    )
    .map((l) => [l.sourceUrl, l.title, ...(l.observedFacts ?? [])].join("\n"))
    .join("\n---\n");
}
