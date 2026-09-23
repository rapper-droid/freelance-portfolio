import { fieldLabel } from "../display";
import { evidenceId } from "../ids";
import type { Evidence, MissingField, Warning } from "../types";
import type {
  ExtractedField,
  Extraction,
  ExtractionRequest,
  Extractor,
} from "./port";

/**
 * The rule-based extractor. Ordinary pattern matching, no model involved.
 *
 * It exists for two reasons. It is what runs in the public sample so that
 * anyone can see the workflow without a credential and without their text
 * leaving the browser's origin; and it is the floor the AI extractor is
 * measured against, because a model that cannot beat regexes on a form is not
 * earning its cost.
 *
 * It is labelled `deterministic` everywhere it surfaces. It is never
 * presented as AI (指示書 §06).
 */
export const DETERMINISTIC_EXTRACTOR_VERSION = "rules-2026.09.22";

type Rule = {
  field: string;
  pattern: RegExp;
  /** Maps the match to a stored value; defaults to the matched text. */
  read?: (m: RegExpMatchArray) => string | string[];
};

/**
 * Ordered: the first rule to match a field wins, so more specific phrasings
 * are listed before looser ones.
 */
const RULES: Rule[] = [
  {
    field: "intent",
    pattern: /予約|日程|スケジュール|空き|撮影(?:の|を)?(?:相談|依頼)/,
    read: () => "booking",
  },
  { field: "intent", pattern: /見積|料金|費用|金額|予算/, read: () => "quote" },
  {
    field: "intent",
    pattern: /不具合|エラー|動かな|障害|停止/,
    read: () => "incident",
  },
  { field: "intent", pattern: /請求|支払|領収/, read: () => "billing" },
  {
    field: "intent",
    pattern: /契約|更新|解約/,
    read: () => "contract",
  },
  {
    field: "currentTools",
    pattern:
      /Google\s*カレンダー|Googleカレンダー|Gmail|Outlook|スプレッドシート|Excel|エクセル|LINE|Slack|Notion/gi,
  },
  {
    field: "cadence",
    pattern: /毎日|毎週|毎月|週次|月次|隔週|定期(?:的)?/,
  },
  {
    field: "volume",
    pattern: /(?:月|週|日)(?:に|間)?\s*(?:約)?\s*\d{1,5}\s*(?:件|通|回|本)/,
  },
  {
    field: "durationMinutes",
    pattern:
      /(\d{1,3})\s*(?:分|時間)(?:程度|ほど|くらい)?(?:の)?(?:撮影|作業|打ち合わせ|面談)?/,
    read: (m) => (/時間/.test(m[0]) ? String(Number(m[1]) * 60) : m[1]),
  },
  {
    field: "bufferMinutes",
    pattern: /前後\s*(\d{1,3})\s*分/,
    read: (m) => m[1],
  },
  {
    field: "staffing",
    pattern: /担当(?:者)?は?\s*(?:一人|1人|ひとり|二人|2人|複数)/,
  },
  {
    field: "availabilityNote",
    pattern:
      /平日(?:だけ|のみ)?|土日(?:祝)?(?:も|は)?(?:対応|休)?|営業時間[^\n。]{0,20}/,
  },
];

/**
 * Instructions inside an inbound message are content, not authority
 * (指示書 §16 / S03). We surface them so a reviewer sees the attempt, and we
 * never act on them.
 */
const INJECTION_PATTERNS: Array<[RegExp, string]> = [
  [
    /(?:ルール|指示|設定)(?:を)?(?:無視|変更|上書き)/,
    "本文がルールの変更を求めています。",
  ],
  [
    /(?:別|他)の(?:宛先|アドレス|メール)(?:に|へ)(?:送|転送)/,
    "本文が宛先の変更を求めています。",
  ],
  [
    /(?:API|APIキー|鍵|パスワード|認証情報)(?:を)?(?:教え|共有|送信)/,
    "本文が認証情報を要求しています。",
  ],
  [
    /(?:今後|以後|全部|すべて)(?:は)?(?:値引き|割引|無料|タダ)/,
    "本文が料金ルールの変更を求めています。",
  ],
  [
    /(?:自動|勝手)(?:で|に)?(?:送信|確定|予約)(?:して|しておいて)/,
    "本文が承認なしの実行を求めています。",
  ],
];

export class DeterministicExtractor implements Extractor {
  readonly id = "deterministic";
  readonly processing = "deterministic" as const;

  async extract(request: ExtractionRequest): Promise<Extraction> {
    const { text, sourceRef, expectedFields } = request;
    const evidence: Evidence[] = [];
    const fields: Record<
      string,
      ExtractedField<string | number | boolean | string[]>
    > = {};
    const warnings: Warning[] = [];
    const missing: MissingField[] = [];

    const record = (start: number, end: number): string => {
      const id = evidenceId(sourceRef, start, end);
      if (!evidence.some((e) => e.id === id))
        evidence.push({
          id,
          sourceRef,
          start,
          end,
          quote: text.slice(start, end),
        });
      return id;
    };

    for (const rule of RULES) {
      if (!expectedFields.includes(rule.field)) continue;
      if (fields[rule.field]) continue;

      if (rule.pattern.flags.includes("g")) {
        // Collecting rules (tools, systems) keep every distinct mention.
        const found: string[] = [];
        const ids: string[] = [];
        for (const m of text.matchAll(rule.pattern)) {
          if (m.index === undefined) continue;
          const label = m[0];
          if (found.some((f) => f.toLowerCase() === label.toLowerCase()))
            continue;
          found.push(label);
          ids.push(record(m.index, m.index + label.length));
        }
        if (found.length)
          fields[rule.field] = { value: found, evidenceIds: ids };
        continue;
      }

      const m = text.match(rule.pattern);
      if (!m || m.index === undefined) continue;
      const id = record(m.index, m.index + m[0].length);
      fields[rule.field] = {
        value: rule.read ? rule.read(m) : m[0],
        evidenceIds: [id],
      };
    }

    for (const [pattern, message] of INJECTION_PATTERNS) {
      const m = text.match(pattern);
      if (!m || m.index === undefined) continue;
      const id = record(m.index, m.index + m[0].length);
      warnings.push({
        code: "instruction_in_content",
        message:
          message + " 指示としては扱いません。担当者が確認してください。",
        severity: "blocking",
        evidenceIds: [id],
      });
    }

    for (const field of expectedFields) {
      if (fields[field]) continue;
      missing.push({
        field,
        label: fieldLabel(field),
        reason: "本文に該当する記述が見つかりませんでした。",
      });
    }

    return {
      processing: "deterministic",
      extractorVersion: DETERMINISTIC_EXTRACTOR_VERSION,
      evidence,
      fields,
      missing,
      warnings,
    };
  }
}

// Field labels live in ../display so the draft and the UI agree.
export { FIELD_LABELS, fieldLabel } from "../display";
