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
export const tickets: Ticket[] = [
  {
    id: 1001,
    name: "サンプル商店",
    subject: "請求書の宛名変更について",
    body: "先月の請求書について、宛名の変更をお願いできますか。確認をお願いします。",
    date: "09/09 10:30",
    status: "未対応",
    owner: "未割当",
  },
  {
    id: 1002,
    name: "デモ制作室",
    subject: "【至急】フォームが動かない",
    body: "本日から送信時にエラーが出ています。業務が停止しているため至急確認をお願いします。",
    date: "09/09 09:45",
    status: "未対応",
    owner: "未割当",
  },
  {
    id: 1003,
    name: "架空デザイン",
    subject: "契約更新の相談",
    body: "来月の契約更新にあたり、プラン変更を相談したいです。",
    date: "09/08 16:20",
    status: "対応中",
    owner: "担当A",
  },
  {
    id: 1004,
    name: "サンプル企画",
    subject: "CSVデータ加工の見積もり",
    body: "顧客データの整形を依頼したいです。対応可能でしょうか。",
    date: "09/08 14:00",
    status: "未対応",
    owner: "未割当",
  },
  {
    id: 1005,
    name: "デモラボ",
    subject: "領収書の発行について",
    body: "支払済みの料金について領収書を発行いただけますか。",
    date: "09/07 11:15",
    status: "完了",
    owner: "担当B",
  },
  {
    id: 1006,
    name: "架空ストア",
    subject: "スマートフォン表示の不具合",
    body: "商品一覧の表示が崩れています。確認をお願いします。",
    date: "09/07 10:10",
    status: "対応中",
    owner: "担当A",
  },
];
