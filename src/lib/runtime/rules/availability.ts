import type { Warning } from "../types";
import {
  formatJst,
  fromJst,
  jstDateKey,
  toJst,
  WEEKDAY_LABELS,
  weekdayOf,
} from "./datetime";

/**
 * Availability for one resource at one location (指示書 §08, P2 scope).
 *
 * The scope is deliberately one resource: a single studio, a single
 * photographer. Multi-resource allocation is a different problem and is not
 * pretended here.
 *
 * The rule that shapes this file: a booking occupies more wall-clock time than
 * the service itself. A 60-minute shoot with 15 minutes of setup and 15 of
 * teardown blocks 90 minutes, and two bookings that merely *look* adjacent on
 * a calendar can still collide. Every check below compares blocked intervals,
 * not service intervals.
 */

export type ResourceCalendar = {
  resourceId: string;
  label: string;
  /** Weekdays the resource is open, 0 = Sunday. */
  businessDays: number[];
  openMinute: number;
  closeMinute: number;
  /** "YYYY-MM-DD" days the resource is closed regardless of weekday. */
  closedDates: string[];
  serviceMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  /** Candidate start times are generated on this grid. */
  slotStepMinutes: number;
};

export type Booking = {
  bookingId: string;
  resourceId: string;
  /** Service start; the blocked window is wider by the buffers. */
  startIso: string;
  serviceMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  status: BookingStatus;
  /** Holds expire; a confirmed booking does not. */
  holdExpiresAt?: string;
  /** False for anything this service did not create (指示書 B10). */
  managedByUs: boolean;
};

export const bookingStatuses = [
  "REQUESTED",
  "NEEDS_INFO",
  "PROPOSED",
  "HELD",
  "CONFIRMED",
  "RESCHEDULE_PENDING",
  "CANCELLED",
] as const;
export type BookingStatus = (typeof bookingStatuses)[number];

/** Statuses that occupy the resource. PROPOSED does not: proposing is not holding. */
const OCCUPYING: readonly BookingStatus[] = [
  "HELD",
  "CONFIRMED",
  "RESCHEDULE_PENDING",
];

export type Interval = { startMs: number; endMs: number };

/** The wall-clock window a booking actually blocks, buffers included. */
export function blockedInterval(b: {
  startIso: string;
  serviceMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
}): Interval {
  const start = Date.parse(b.startIso);
  return {
    startMs: start - b.bufferBeforeMinutes * 60_000,
    endMs: start + (b.serviceMinutes + b.bufferAfterMinutes) * 60_000,
  };
}

/** Half-open [start, end): a booking ending exactly when the next begins is fine. */
export const overlaps = (a: Interval, b: Interval) =>
  a.startMs < b.endMs && b.startMs < a.endMs;

/**
 * A hold only occupies the resource while it is still alive. An expired hold
 * is treated as released here and swept by `releaseExpiredHolds`, so the two
 * can never disagree about who owns a slot (指示書 B08).
 */
export function isOccupying(b: Booking, nowIso: string): boolean {
  if (!OCCUPYING.includes(b.status)) return false;
  if (b.status === "HELD" && b.holdExpiresAt)
    return Date.parse(b.holdExpiresAt) > Date.parse(nowIso);
  return true;
}

export type SlotVerdict = {
  ok: boolean;
  startIso: string;
  endIso: string;
  warnings: Warning[];
  /** Ids of the bookings this slot collides with, if any. */
  conflictsWith: string[];
};

/**
 * Checks one candidate start against the calendar and the existing bookings.
 *
 * This is the function a confirmation must pass immediately before writing
 * anywhere external. It is cheap and deterministic on purpose so it can be
 * re-run at the last moment rather than trusted from an earlier page load.
 */
export function checkSlot(
  startIso: string,
  calendar: ResourceCalendar,
  existing: Booking[],
  nowIso: string,
): SlotVerdict {
  const warnings: Warning[] = [];
  const start = toJst(startIso);
  const startMinute = start.hour * 60 + start.minute;
  const endMinute = startMinute + calendar.serviceMinutes;
  const endIso = new Date(
    Date.parse(startIso) + calendar.serviceMinutes * 60_000,
  ).toISOString();

  if (Date.parse(startIso) < Date.parse(nowIso)) {
    warnings.push({
      code: "slot_in_past",
      message: `${formatJst(startIso)} は現在時刻より前です。`,
      severity: "blocking",
    });
  }

  const weekday = weekdayOf(start.year, start.month, start.day);
  if (!calendar.businessDays.includes(weekday)) {
    warnings.push({
      code: "closed_weekday",
      message: `${WEEKDAY_LABELS[weekday]}曜日は営業日ではありません。`,
      severity: "blocking",
    });
  }
  if (calendar.closedDates.includes(jstDateKey(startIso))) {
    warnings.push({
      code: "closed_date",
      message: `${formatJst(startIso, { withTime: false })} は休業日です。`,
      severity: "blocking",
    });
  }

  // Buffers must fit inside opening hours too: setup before opening is not
  // free time, it is someone arriving at a locked door.
  if (
    startMinute - calendar.bufferBeforeMinutes < calendar.openMinute ||
    endMinute + calendar.bufferAfterMinutes > calendar.closeMinute
  ) {
    warnings.push({
      code: "outside_business_hours",
      message:
        `準備${calendar.bufferBeforeMinutes}分・片付け${calendar.bufferAfterMinutes}分を含めると ` +
        `営業時間（${minuteLabel(calendar.openMinute)}〜${minuteLabel(calendar.closeMinute)}）に収まりません。`,
      severity: "blocking",
    });
  }

  const candidate = blockedInterval({
    startIso,
    serviceMinutes: calendar.serviceMinutes,
    bufferBeforeMinutes: calendar.bufferBeforeMinutes,
    bufferAfterMinutes: calendar.bufferAfterMinutes,
  });
  const conflictsWith: string[] = [];
  for (const b of existing) {
    if (b.resourceId !== calendar.resourceId) continue;
    if (!isOccupying(b, nowIso)) continue;
    if (!overlaps(candidate, blockedInterval(b))) continue;
    conflictsWith.push(b.bookingId);
    warnings.push({
      code: b.managedByUs ? "slot_conflict" : "external_conflict",
      message: b.managedByUs
        ? `${formatJst(b.startIso)} の予約（${b.bookingId}）と重なります。`
        : `外部カレンダー上の予定（${b.bookingId}）と重なります。当サービスの管理対象外のため変更しません。`,
      severity: "blocking",
    });
  }

  return {
    ok: warnings.every((w) => w.severity !== "blocking"),
    startIso,
    endIso,
    warnings,
    conflictsWith,
  };
}

const minuteLabel = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/**
 * Candidate slots near a requested time, nearest first.
 *
 * `preferredMinuteOfDay` is where the sender pointed; candidates are ranked by
 * distance from it so the first option reads as an answer to what they asked
 * rather than the first opening of the day. Scanning is bounded by
 * `daysAhead` and the returned list by `limit`, so an empty calendar cannot
 * produce unbounded work.
 */
export function proposeSlots(
  opts: {
    fromDateIso: string;
    preferredMinuteOfDay: number | null;
    windowMinutes?: [number, number] | null;
    daysAhead?: number;
    limit?: number;
  },
  calendar: ResourceCalendar,
  existing: Booking[],
  nowIso: string,
): SlotVerdict[] {
  const daysAhead = opts.daysAhead ?? 14;
  const limit = opts.limit ?? 3;
  const base = toJst(opts.fromDateIso);
  const found: Array<{ verdict: SlotVerdict; distance: number }> = [];

  for (let dayOffset = 0; dayOffset <= daysAhead; dayOffset++) {
    const dayStart = new Date(
      Date.UTC(base.year, base.month - 1, base.day) + dayOffset * 86_400_000,
    );
    const y = dayStart.getUTCFullYear();
    const mo = dayStart.getUTCMonth() + 1;
    const d = dayStart.getUTCDate();
    if (!calendar.businessDays.includes(weekdayOf(y, mo, d))) continue;
    const key = `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (calendar.closedDates.includes(key)) continue;

    const earliest = calendar.openMinute + calendar.bufferBeforeMinutes;
    const latest =
      calendar.closeMinute -
      calendar.bufferAfterMinutes -
      calendar.serviceMinutes;
    const [windowFrom, windowTo] = opts.windowMinutes ?? [earliest, latest];

    for (
      let minute = Math.max(earliest, windowFrom);
      minute <= Math.min(latest, windowTo);
      minute += calendar.slotStepMinutes
    ) {
      const startIso = fromJst({
        year: y,
        month: mo,
        day: d,
        hour: Math.floor(minute / 60),
        minute: minute % 60,
      });
      const verdict = checkSlot(startIso, calendar, existing, nowIso);
      if (!verdict.ok) continue;
      const distance =
        dayOffset * 10_000 +
        (opts.preferredMinuteOfDay === null
          ? minute
          : Math.abs(minute - opts.preferredMinuteOfDay));
      found.push({ verdict, distance });
    }
  }

  return found
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map((f) => f.verdict);
}

/**
 * Releases holds whose deadline has passed. Returns the affected bookings so
 * the caller can record why each one changed rather than silently mutating
 * the ledger.
 */
export function releaseExpiredHolds(
  bookings: Booking[],
  nowIso: string,
): { bookings: Booking[]; released: string[] } {
  const released: string[] = [];
  const next = bookings.map((b) => {
    if (
      b.status === "HELD" &&
      b.holdExpiresAt &&
      Date.parse(b.holdExpiresAt) <= Date.parse(nowIso)
    ) {
      released.push(b.bookingId);
      return { ...b, status: "CANCELLED" as BookingStatus };
    }
    return b;
  });
  return { bookings: next, released };
}

/**
 * The state machine (指示書 §08-3). Transitions not listed here are refused,
 * which is what stops "confirm" being reachable from a cancelled booking or a
 * proposal the requester never answered.
 */
const TRANSITIONS: Record<BookingStatus, readonly BookingStatus[]> = {
  REQUESTED: ["NEEDS_INFO", "PROPOSED", "CANCELLED"],
  NEEDS_INFO: ["PROPOSED", "REQUESTED", "CANCELLED"],
  PROPOSED: ["HELD", "NEEDS_INFO", "CANCELLED"],
  HELD: ["CONFIRMED", "PROPOSED", "CANCELLED"],
  CONFIRMED: ["RESCHEDULE_PENDING", "CANCELLED"],
  RESCHEDULE_PENDING: ["CONFIRMED", "CANCELLED"],
  CANCELLED: [],
};

export const canTransition = (from: BookingStatus, to: BookingStatus) =>
  TRANSITIONS[from].includes(to);

/**
 * A requester's agreement is a separate fact from an administrator's approval
 * (指示書 §08-1 / B05). Confirming without it is refused here rather than
 * discouraged in a comment.
 */
export function confirmBooking(
  booking: Booking,
  opts: { requesterAgreedAt?: string; adminApprovedAt?: string },
): { ok: boolean; reason?: string; booking: Booking } {
  if (!canTransition(booking.status, "CONFIRMED"))
    return {
      ok: false,
      reason: `${booking.status} から確定はできません。`,
      booking,
    };
  if (!opts.requesterAgreedAt)
    return {
      ok: false,
      reason:
        "予約者の日程合意が記録されていません。管理者の承認だけでは確定しません。",
      booking,
    };
  if (!opts.adminApprovedAt)
    return { ok: false, reason: "管理者の承認が記録されていません。", booking };
  return { ok: true, booking: { ...booking, status: "CONFIRMED" } };
}
