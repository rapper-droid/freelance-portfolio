import { contactKinds } from "@/lib/contact-options";

/**
 * Carrying what the sample already established into the consultation form
 * (指示書 §11, 受け入れ基準 A10).
 *
 * The visitor has just watched a workflow run and answered three short
 * questions about their own situation. Making them retype that on the next
 * page is the re-entry this whole project exists to remove.
 *
 * What travels, and what does not:
 *
 * - **Only these four structured values travel.** The sample's message box
 *   holds fictional text by default, and anything the visitor edited into it
 *   is theirs, about their own business — neither belongs in an inquiry they
 *   did not choose to send.
 * - **Nothing travels in the URL.** The draft goes through session storage on
 *   the same origin, so a shared or logged link carries no answers
 *   (指示書 §11: 問い合わせ原文や機密データをURLパラメータへ入れない).
 */

export type HandoffWorkflow = "relay" | "daybook" | "report";

export type HandoffAnswers = {
  workflow: HandoffWorkflow;
  /** Tools they use today. Free text, short. */
  tools: string;
  /** How often the work happens. Free text, short. */
  cadence: string;
  /** What a good outcome looks like to them. Free text, short. */
  outcome: string;
};

/** Per-answer ceiling. The composed detail is capped again by the draft writer. */
export const MAX_ANSWER = 300;

const TROUBLES: Record<
  HandoffWorkflow,
  { label: string; kind: string; opening: string }
> = {
  relay: {
    label: "問い合わせ対応（返信の準備）",
    // Matches demoCategories.automation → categoryKinds.automation.
    kind: contactKinds[2],
    opening:
      "問い合わせが届いてから返信するまでの手作業を減らしたいと考えています。",
  },
  daybook: {
    label: "日程調整",
    // Matches demoCategories.booking → "api" → categoryKinds.api.
    kind: contactKinds[3],
    opening:
      "予約希望への対応（候補出し・空き確認・変更対応）を減らしたいと考えています。",
  },
  report: {
    label: "定期報告（集計）",
    kind: contactKinds[2],
    opening: "毎回の集計と報告の作成にかかる手作業を減らしたいと考えています。",
  },
};

export const troubleLabel = (workflow: HandoffWorkflow) =>
  TROUBLES[workflow].label;

/**
 * Trims to one line and drops control characters.
 *
 * The contact form and the server both reject control characters, so cleaning
 * here means a visitor never meets a validation error for something they
 * cannot see in the box they typed into.
 */
export function cleanAnswer(value: string): string {
  let out = "";
  for (const character of value) {
    const code = character.codePointAt(0)!;
    if (code < 0x20 || code === 0x7f) {
      // Newlines and tabs become spaces: these answers are single lines.
      out += code === 0x0a || code === 0x09 || code === 0x0d ? " " : "";
      continue;
    }
    out += character;
  }
  return out.replace(/\s+/g, " ").trim().slice(0, MAX_ANSWER);
}

export type Handoff = { kind: string; detail: string; answered: number };

/**
 * Builds the inquiry text.
 *
 * Unanswered questions are left out rather than carried as empty headings: a
 * form arriving with three blank labels reads as a bug, and an inquiry that
 * states only what the visitor actually said is easier to reply to.
 */
export function composeHandoff(answers: HandoffAnswers): Handoff {
  const trouble = TROUBLES[answers.workflow];
  const rows: Array<[string, string]> = [
    ["いま使っている道具", cleanAnswer(answers.tools)],
    ["頻度・件数", cleanAnswer(answers.cadence)],
    ["こうなったら助かること", cleanAnswer(answers.outcome)],
  ];
  const answered = rows.filter(([, value]) => value).length;

  const lines = [
    `【相談したいこと】${trouble.label}`,
    trouble.opening,
    "",
    ...rows
      .filter(([, value]) => value)
      .map(([label, value]) => `【${label}】${value}`),
  ];

  if (answered)
    lines.push(
      "",
      "※ tsudowa.com/flow の体験から引き継ぎました。内容は送信前に編集できます。",
    );
  else
    lines.push(
      "※ tsudowa.com/flow の体験から引き継ぎました。詳しい状況をこの下に書き足してください。",
    );

  return { kind: trouble.kind, detail: lines.join("\n"), answered };
}

export const HANDOFF_QUESTIONS: Array<{
  key: "tools" | "cadence" | "outcome";
  label: string;
  placeholder: string;
}> = [
  {
    key: "tools",
    label: "いま使っている道具",
    placeholder: "例：Gmail、Googleカレンダー、スプレッドシート",
  },
  {
    key: "cadence",
    label: "頻度・件数",
    placeholder: "例：月に80件ほど / 毎週月曜に1回",
  },
  {
    key: "outcome",
    label: "こうなったら助かること",
    placeholder: "例：返信の下書きまで用意されていてほしい",
  },
];
