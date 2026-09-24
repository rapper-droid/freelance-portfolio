import type { Booking, ResourceCalendar } from "../runtime/rules/availability";

/**
 * The studio's calendar and the appointments already on it (指示書 §14).
 *
 * The bookings are placed **relative to now**, not on fixed dates. A seed
 * pinned to a calendar day works until that day passes, and then the demo
 * quietly loses the thing it exists to show: the slot you want is taken, so
 * here are the alternatives. The booking walk in KISSA taught that lesson
 * three times in one afternoon; this does not repeat it.
 */

export const STUDIO: ResourceCalendar = {
  resourceId: "studio-a",
  label: "スタジオA（架空）",
  businessDays: [1, 2, 3, 4, 5],
  openMinute: 10 * 60,
  closeMinute: 18 * 60,
  closedDates: [],
  serviceMinutes: 60,
  bufferBeforeMinutes: 15,
  bufferAfterMinutes: 15,
  slotStepMinutes: 30,
};

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** Midnight JST of the day `offset` days after the one containing `nowIso`. */
function jstDay(nowIso: string, offset: number): Date {
  const jst = new Date(new Date(nowIso).getTime() + JST_OFFSET_MS);
  const midnightJst = Date.UTC(
    jst.getUTCFullYear(),
    jst.getUTCMonth(),
    jst.getUTCDate() + offset,
  );
  return new Date(midnightJst - JST_OFFSET_MS);
}

/** The next weekday at least `minDays` away, so the seed is always bookable. */
function nextBusinessDay(nowIso: string, minDays = 2): Date {
  for (let offset = minDays; offset < minDays + 7; offset++) {
    const day = jstDay(nowIso, offset);
    const weekday = new Date(day.getTime() + JST_OFFSET_MS).getUTCDay();
    if (STUDIO.businessDays.includes(weekday)) return day;
  }
  return jstDay(nowIso, minDays);
}

const at = (day: Date, minuteOfDay: number) =>
  new Date(day.getTime() + minuteOfDay * 60_000).toISOString();

/**
 * Two appointments on the same day: one of ours, and one somebody else put on
 * the shared calendar. The second matters — it is read and respected, and the
 * tool will not move or delete it (指示書 B10).
 */
export function seedBookings(nowIso: string): Booking[] {
  const day = nextBusinessDay(nowIso);
  return [
    {
      bookingId: "BK-0912",
      resourceId: STUDIO.resourceId,
      startIso: at(day, 14 * 60),
      serviceMinutes: 60,
      bufferBeforeMinutes: 15,
      bufferAfterMinutes: 15,
      status: "CONFIRMED",
      managedByUs: true,
    },
    {
      bookingId: "EXT-0041",
      resourceId: STUDIO.resourceId,
      startIso: at(day, 16 * 60 + 30),
      serviceMinutes: 60,
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 0,
      status: "CONFIRMED",
      managedByUs: false,
    },
  ];
}

export type SampleRequest = {
  id: string;
  label: string;
  note: string;
  name: string;
  email: string;
  /** Built at read time so "the day after tomorrow at 14:00" stays true. */
  text: (nowIso: string) => string;
};

const label = (day: Date) => {
  const jst = new Date(day.getTime() + JST_OFFSET_MS);
  return `${jst.getUTCMonth() + 1}月${jst.getUTCDate()}日`;
};

export const sampleRequests: SampleRequest[] = [
  {
    id: "taken",
    label: "希望の枠が埋まっている",
    note: "ちょうど先約のある時間を希望する文面です。代替候補が出ます。",
    name: "山田太郎",
    email: "sample-client@example.com",
    text: (nowIso) =>
      `撮影をお願いしたいです。${label(nextBusinessDay(nowIso))}の14時からで空いていますか。1時間ほどを想定しています。`,
  },
  {
    id: "open",
    label: "希望の枠が空いている",
    note: "そのまま仮押さえまで進みます。",
    name: "佐藤花子",
    email: "sample-client2@example.com",
    text: (nowIso) =>
      `${label(nextBusinessDay(nowIso))}の11時に1時間お願いできますか。難しければ近い時間でも構いません。`,
  },
  {
    id: "vague",
    label: "日時が書かれていない",
    note: "決めつけずに候補を出し、足りない情報を明示します。",
    name: "鈴木一郎",
    email: "sample-client3@example.com",
    text: () =>
      "来週あたりで撮影をお願いしたいのですが、空いている日はありますか。午後だと助かります。",
  },
  {
    id: "closed",
    label: "営業時間外を希望している",
    note: "断る理由を、営業条件として説明します。",
    name: "高橋次郎",
    email: "sample-client4@example.com",
    text: (nowIso) =>
      `${label(nextBusinessDay(nowIso))}の朝7時からお願いできますか。早い時間だと助かります。`,
  },
];
