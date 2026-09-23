import { toJst } from "@/lib/runtime/rules/datetime";

export type Booking = {
  id: string;
  date: string;
  time: string;
  name: string;
  service: string;
};
/**
 * The week DAYBOOK shows (指示書 §17).
 *
 * Derived from today rather than written down. A booking demo pinned to a
 * fixed week is usable for as long as that week lasts and then shows a
 * visitor a past calendar they cannot book into — which reads as abandoned,
 * not as a demo.
 */
export const BOOKING_DAYS = 7;

/**
 * The instant the server renders from.
 *
 * Fixed, so the server and the client agree on first paint; the client then
 * re-derives from the real clock in an effect. Without one, the demo would be
 * blank until JavaScript ran.
 */
export const BOOKING_REFERENCE_ISO = "2026-09-23T01:00:00.000Z";

export function bookingWeek(nowIso: string): string[] {
  const today = toJst(nowIso);
  const start = Date.UTC(today.year, today.month - 1, today.day);
  return Array.from({ length: BOOKING_DAYS }, (_, offset) => {
    const d = new Date(start + offset * 86_400_000);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  });
}

const WEEKDAY_EN = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

/** The three-letter weekday for a `YYYY-MM-DD` key, read as a JST date. */
export function bookingWeekday(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return WEEKDAY_EN[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

export const bookingLabel = (dateKey: string) => {
  const [, m, d] = dateKey.split("-").map(Number);
  return `${m}月${d}日`;
};

/** Sample bookings, placed relative to the week rather than on fixed dates. */
export function bookingSeedFor(nowIso: string): Booking[] {
  const week = bookingWeek(nowIso);
  return [
    {
      id: "B001",
      date: week[0],
      time: "10:00",
      name: "サンプルA",
      service: "スタジオ利用",
    },
    {
      id: "B002",
      date: week[0],
      time: "14:00",
      name: "サンプルB",
      service: "撮影プラン",
    },
    {
      id: "B003",
      date: week[1],
      time: "11:00",
      name: "サンプルC",
      service: "スタジオ利用",
    },
  ];
}

export const bookingTimes = [
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];
export function validateBooking(
  rows: Booking[],
  value: Omit<Booking, "id">,
  nowIso: string,
) {
  if (!value.name.trim() || value.name.trim().length > 40)
    return "予約名は1〜40文字で入力してください。";
  if (
    !bookingWeek(nowIso).includes(value.date) ||
    !bookingTimes.includes(value.time)
  )
    return "表示中の1週間から、日付と時間を選んでください。";
  if (rows.some((r) => r.date === value.date && r.time === value.time))
    return "この時間枠には予約があります。別の時間を選んでください。";
  return "";
}
export const qaItems = [
  "仕様と実装範囲の照合",
  "PC・タブレット・スマホ表示",
  "入力・エラー・空状態",
  "キーボード操作・フォーカス",
  "リンク・metadata・404",
  "ソース・設定ファイル整理",
  "README・起動手順",
  "納品形式・受入条件確認",
];
export function deliveryManifest(checked: string[]) {
  if (!qaItems.every((item) => checked.includes(item)))
    throw new Error("未確認項目があります");
  return {
    kind: "SELF-INITIATED DEMO",
    note: "手動チェック操作のサンプル。自動検証の証明ではありません。",
    files: [
      "src/",
      "public/",
      "package.json",
      "package-lock.json",
      ".env.example",
      "README.md",
      "docs/QA.md",
    ],
    checklist: qaItems.map((item) => ({
      item,
      status: "manually-confirmed-demo",
    })),
  };
}
export function creativeSvg(style: number, ratio: string) {
  const sizes: Record<string, [number, number]> = {
    square: [1080, 1080],
    portrait: [1080, 1920],
    landscape: [1200, 630],
  };
  const [w, h] = sizes[ratio] ?? sizes.square;
  const palettes = [
    ["#263baf", "#d6ec97", "MAKE ROOM."],
    ["#e8dcc5", "#4d4939", "SLOW DAYS."],
    ["#263f35", "#e9efd4", "LESS. BETTER."],
  ];
  const [bg, fg, title] = palettes[style] ?? palettes[0];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${bg}"/><circle cx="${w * 0.78}" cy="${h * 0.65}" r="${w * 0.3}" fill="none" stroke="${fg}" stroke-width="${w * 0.12}"/><text x="${w * 0.08}" y="${h * 0.12}" fill="${fg}" font-family="Arial" font-size="${w * 0.025}">STILL / STUDIO — SELF-INITIATED DEMO</text><text x="${w * 0.08}" y="${h * 0.4}" fill="${fg}" font-family="Arial" font-weight="bold" font-size="${w * 0.09}">${title}</text><text x="${w * 0.08}" y="${h * 0.92}" fill="${fg}" font-family="Arial" font-size="${w * 0.025}">A NEW PERSPECTIVE / ORIGINAL CREATIVE</text></svg>`;
}
