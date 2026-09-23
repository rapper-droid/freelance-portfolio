import type { ResourceCalendar } from "./rules/availability";

/**
 * The shared fictional studio behind the public sample (指示書 §05).
 *
 * One invented business runs through all three workflows, so the inquiry, the
 * booking and the weekly report belong to the same story rather than three
 * unrelated toys. Everything here is invented and labelled as such; no real
 * customer, address or amount appears.
 *
 * The demo clock is fixed. A sample whose dates drift as the months pass
 * stops matching its own explanation, so the scenario states its reference
 * date on screen instead of using "now" (指示書 §08-4).
 */

/** 2026-09-22 (火) 10:00 JST. Displayed to the visitor, never hidden. */
export const DEMO_NOW_ISO = "2026-09-22T01:00:00.000Z";
export const DEMO_NOW_LABEL = "2026年9月22日（火）10:00（デモ基準日）";

export const DEMO_TENANT = "demo-studio";

export const DEMO_CALENDAR: ResourceCalendar = {
  resourceId: "studio-a",
  label: "スタジオA（架空）",
  businessDays: [1, 2, 3, 4, 5],
  openMinute: 10 * 60,
  closeMinute: 18 * 60,
  closedDates: ["2026-09-23"],
  serviceMinutes: 60,
  bufferBeforeMinutes: 15,
  bufferAfterMinutes: 15,
  slotStepMinutes: 30,
};

export const DEMO_BOOKINGS = [
  {
    bookingId: "BK-0912",
    resourceId: "studio-a",
    startIso: "2026-09-30T05:00:00.000Z", // 2026-09-30 14:00 JST
    serviceMinutes: 60,
    bufferBeforeMinutes: 15,
    bufferAfterMinutes: 15,
    status: "CONFIRMED" as const,
    managedByUs: true,
  },
  {
    bookingId: "EXT-0041",
    resourceId: "studio-a",
    startIso: "2026-09-30T07:30:00.000Z", // 2026-09-30 16:30 JST
    serviceMinutes: 60,
    bufferBeforeMinutes: 0,
    bufferAfterMinutes: 0,
    status: "CONFIRMED" as const,
    // Someone else's entry on the shared calendar. Read, never written.
    managedByUs: false,
  },
];

export type ScenarioId =
  | "relay-quote"
  | "relay-followup"
  | "daybook-request"
  | "daybook-reschedule"
  | "report-week1"
  | "report-week2"
  | "report-week3";

export type Scenario = {
  id: ScenarioId;
  workflow: "relay" | "daybook" | "report";
  /** What arrived. Shown as the trigger, not as a form to fill in. */
  trigger: string;
  label: string;
  body: string;
  /** Why this one is in the sample — the second run and the exception matter. */
  note: string;
};

export const SCENARIOS: Scenario[] = [
  {
    id: "relay-quote",
    workflow: "relay",
    trigger: "問い合わせフォームに、見積の相談が届いた",
    label: "1通目：最初の相談",
    body: "撮影予約のメール対応を減らしたいです。予約表はいまGoogleカレンダー。担当は一人で、平日だけ対応しています。月に80件ほど問い合わせがあります。",
    note: "1通目。書かれていない所要時間・準備時間は、質問として残ります。",
  },
  {
    id: "relay-followup",
    workflow: "relay",
    trigger: "同じ方から、2通目が届いた",
    label: "2通目：追加の情報",
    body: "撮影は60分、前後15分の準備が必要です。",
    note: "2通目。同じ案件に紐づき、1通目で聞いた質問は繰り返しません。",
  },
  {
    id: "daybook-request",
    workflow: "daybook",
    trigger: "予約の相談が届いた",
    label: "予約希望",
    body: "来週の水曜14時ごろに撮影したいです。60分ほどを予定しています。",
    note: "14時は既に埋まっています。準備時間を含めた候補を出します。",
  },
  {
    id: "daybook-reschedule",
    workflow: "daybook",
    trigger: "確定後に、日程変更の依頼が届いた",
    label: "日程変更",
    body: "すみません、同じ日の16時に変更できますか。",
    note: "確定済みの予約の変更。旧リマインドの停止まで含めて扱います。",
  },
  {
    id: "report-week1",
    workflow: "report",
    trigger: "今週の売上ファイルが届いた",
    label: "1週目：レシピを作る",
    body: "",
    note: "初回。列の対応と重複条件を決めて、処理レシピとして保存します。",
  },
  {
    id: "report-week2",
    workflow: "report",
    trigger: "翌週のファイルが届いた（列順だけ違う）",
    label: "2週目：説明し直さない",
    body: "",
    note: "列順が違っても、保存したレシピをそのまま適用します。",
  },
  {
    id: "report-week3",
    workflow: "report",
    trigger: "3週目のファイルに、税区分の列が増えていた",
    label: "3週目：増えた1点だけ確認",
    body: "",
    note: "意味が変わった1点だけを確認し、それ以外は勝手に進めません。",
  },
];

export const scenarioById = (id: string) => SCENARIOS.find((s) => s.id === id);

/**
 * Sample CSVs for the three-week report story (指示書 §09-4).
 *
 * Week 2 reorders the columns; week 3 adds a tax column. They are small enough
 * to read at a glance and carry the edge cases the tests exercise: a repeated
 * order id, a leading-zero identifier and a cell starting with `=`.
 */
export const REPORT_SAMPLES: Record<string, { label: string; csv: string }> = {
  "report-week1": {
    label: "sales-2026-09-w1.csv",
    csv: [
      "注文ID,日付,商品名,数量,金額",
      "ORD-0101,2026-09-01,Webサイト修正,1,5000",
      "ORD-0102,2026-09-02,データ加工,2,12000",
      "ORD-0103,2026-09-03,フォーム制作,1,20000",
      "ORD-0104,2026-09-04,Webサイト修正,1,5000",
      "ORD-0104,2026-09-04,Webサイト修正,1,5000",
      "ORD-0105,2026-09-05,データ加工,1,6000",
    ].join("\n"),
  },
  "report-week2": {
    label: "sales-2026-09-w2.csv（列順が違う）",
    csv: [
      "日付,金額,注文ID,商品名,数量",
      "2026-09-08,7000,ORD-0201,Webサイト修正,1",
      "2026-09-09,12000,ORD-0202,データ加工,2",
      "2026-09-10,25000,ORD-0203,フォーム制作,1",
      "2026-09-11,6000,ORD-0204,バナー制作,1",
      "2026-09-12,5000,ORD-0205,Webサイト修正,1",
    ].join("\n"),
  },
  "report-week3": {
    label: "sales-2026-09-w3.csv（税区分の列が増えた）",
    csv: [
      "注文ID,日付,商品名,数量,金額,税区分",
      "ORD-0301,2026-09-15,Webサイト修正,1,5000,10%",
      "ORD-0302,2026-09-16,データ加工,2,12000,8%",
      "ORD-0303,2026-09-17,フォーム制作,1,20000,10%",
    ].join("\n"),
  },
};
