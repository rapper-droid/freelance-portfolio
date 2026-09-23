import { toJst } from "@/lib/runtime/rules/datetime";

export type Ticket = {
  id: number;
  name: string;
  subject: string;
  body: string;
  date: string;
  status: "未対応" | "対応中" | "完了";
  owner: string;
};
export function classify(body: string) {
  const category = /請求|支払|領収/.test(body)
    ? "請求"
    : /不具合|エラー|動か|障害/.test(body)
      ? "不具合"
      : /契約|更新|解約/.test(body)
        ? "契約"
        : "お問い合わせ";
  return {
    category,
    urgency: /至急|緊急|停止|本日中/.test(body)
      ? "高"
      : /確認|期限/.test(body)
        ? "中"
        : "通常",
  };
}
export function replyDraft(ticket: Ticket) {
  const { category } = classify(ticket.subject + ticket.body);
  const message: Record<string, string> = {
    請求: "請求内容を確認いたします。対象の請求番号とご希望の内容をお知らせいただけますでしょうか。",
    不具合:
      "ご不便をおかけしております。状況の確認のため、発生時刻・操作手順・表示されたエラーをご共有いただけますでしょうか。",
    契約: "ご契約について確認いたします。対象のプランとご希望の変更内容をお知らせください。",
    お問い合わせ:
      "お問い合わせ内容を確認いたします。ご希望の内容や時期について、詳しくお聞かせください。",
  };
  return `${ticket.name} 様\n\nお問い合わせありがとうございます。\n${message[category]}\n\n確認のうえ、改めてご案内いたします。\nどうぞよろしくお願いいたします。`;
}
/**
 * The sample inbox (指示書 §17).
 *
 * Each ticket carries how long ago it arrived rather than a written date. A
 * fixed date makes the demo read as abandoned within weeks, and one of these
 * says "as of today" in its body — which a two-week-old stamp contradicts on
 * the same screen.
 */
type TicketSeed = Omit<Ticket, "date"> & {
  /** Days before today, in JST. */
  daysAgo: number;
  /** HH:MM, JST. */
  at: string;
};

const ticketSeed: TicketSeed[] = [
  {
    id: 1001,
    name: "サンプル商店",
    subject: "請求書の宛名変更について",
    body: "先月の請求書について、宛名の変更をお願いできますか。確認をお願いします。",
    daysAgo: 0,
    at: "10:30",
    status: "未対応",
    owner: "未割当",
  },
  {
    id: 1002,
    name: "デモ制作室",
    subject: "【至急】フォームが動かない",
    body: "本日から送信時にエラーが出ています。業務が停止しているため至急確認をお願いします。",
    daysAgo: 0,
    at: "09:45",
    status: "未対応",
    owner: "未割当",
  },
  {
    id: 1003,
    name: "架空デザイン",
    subject: "契約更新の相談",
    body: "来月の契約更新にあたり、プラン変更を相談したいです。",
    daysAgo: 1,
    at: "16:20",
    status: "対応中",
    owner: "担当A",
  },
  {
    id: 1004,
    name: "サンプル企画",
    subject: "CSVデータ加工の見積もり",
    body: "顧客データの整形を依頼したいです。対応可能でしょうか。",
    daysAgo: 1,
    at: "14:00",
    status: "未対応",
    owner: "未割当",
  },
  {
    id: 1005,
    name: "デモラボ",
    subject: "領収書の発行について",
    body: "支払済みの料金について領収書を発行いただけますか。",
    daysAgo: 2,
    at: "11:15",
    status: "完了",
    owner: "担当B",
  },
  {
    id: 1006,
    name: "架空ストア",
    subject: "スマートフォン表示の不具合",
    body: "商品一覧の表示が崩れています。確認をお願いします。",
    daysAgo: 2,
    at: "10:10",
    status: "対応中",
    owner: "担当A",
  },
];

/** The sample inbox as of a given moment, newest first. */
export function ticketsFor(nowIso: string): Ticket[] {
  const today = toJst(nowIso);
  const start = Date.UTC(today.year, today.month - 1, today.day);
  return ticketSeed.map((seed) => {
    const d = new Date(start - seed.daysAgo * 86_400_000);
    const stamp = `${String(d.getUTCMonth() + 1).padStart(2, "0")}/${String(
      d.getUTCDate(),
    ).padStart(2, "0")} ${seed.at}`;
    return {
      id: seed.id,
      name: seed.name,
      subject: seed.subject,
      body: seed.body,
      status: seed.status,
      owner: seed.owner,
      date: stamp,
    };
  });
}

/**
 * A fixed rendering for anything that needs the list without a clock —
 * server components, tests, and the exhibit index.
 */
export const tickets: Ticket[] = ticketsFor("2026-09-23T01:00:00.000Z");
