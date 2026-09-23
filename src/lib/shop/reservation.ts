import { hash } from "@/lib/runtime/ids";
import {
  formatJst,
  fromJst,
  jstDateKey,
  toJst,
  weekdayOf,
} from "@/lib/runtime/rules/datetime";
import { HOURS, seatById, seats } from "./catalog";
import type { Reservation, ReservationStatus, Seat } from "./types";

/**
 * Table booking for KISSA (指示書 §11).
 *
 * Shares the shop's hours and the runtime's JST arithmetic, but keeps its own
 * seating policy: a cafe joins two tables into one and loses both, which is a
 * different problem from the single studio resource DAYBOOK books. Forcing one
 * policy on both would make neither correct (指示書 §14).
 */

export const SLOT_STEP_MINUTES = 30;
export const HOLD_MINUTES = 10;
export const MAX_PARTY = 6;

const minuteOfDay = (iso: string) => {
  const p = toJst(iso);
  return p.hour * 60 + p.minute;
};

const endMinuteOf = (startIso: string, durationMinutes: number) =>
  minuteOfDay(startIso) + durationMinutes + HOURS.turnaroundMinutes;

/** Seats that cannot be used while `seat` is occupied, including itself. */
export function blockedSeatIds(seat: Seat): string[] {
  const blocked = new Set<string>([seat.id, ...(seat.conflictsWith ?? [])]);
  // Conflicts are mutual: booking table A must also block the joined A+B.
  for (const other of seats)
    if (other.conflictsWith?.includes(seat.id)) blocked.add(other.id);
  return [...blocked];
}

/** A reservation still occupies its table unless it was cancelled or expired. */
export function isOccupying(reservation: Reservation, nowIso: string): boolean {
  if (reservation.status === "cancelled" || reservation.status === "expired")
    return false;
  if (reservation.status === "held" && reservation.holdExpiresAtIso)
    return Date.parse(reservation.holdExpiresAtIso) > Date.parse(nowIso);
  return true;
}

export type SeatOption = {
  seat: Seat;
  available: boolean;
  reason?: string;
};

/**
 * Which tables can take this party at this time.
 *
 * A seat is offered only when it fits the party, is free for the whole sitting
 * plus turnaround, and is not blocked by a joined-table booking. Seats too
 * small are excluded; seats much too large are offered but flagged, because a
 * shop would rather seat two at a four-top than turn them away.
 */
export function seatOptions(
  startIso: string,
  partySize: number,
  durationMinutes: number,
  reservations: readonly Reservation[],
  nowIso: string,
  excludeReservationId?: string,
): SeatOption[] {
  const start = minuteOfDay(startIso);
  const end = endMinuteOf(startIso, durationMinutes);
  const day = jstDateKey(startIso);

  return seats.map((seat) => {
    if (seat.capacity < partySize)
      return {
        seat,
        available: false,
        reason: `${partySize}名には小さい席です。`,
      };

    const blocked = blockedSeatIds(seat);
    const clash = reservations.find((r) => {
      if (r.reservationId === excludeReservationId) return false;
      if (!isOccupying(r, nowIso)) return false;
      if (jstDateKey(r.startIso) !== day) return false;
      if (!blocked.includes(r.seatId)) return false;
      const otherStart = minuteOfDay(r.startIso);
      const otherEnd = endMinuteOf(r.startIso, r.durationMinutes);
      // Half-open: a sitting that ends exactly when the next begins is fine.
      return start < otherEnd && otherStart < end;
    });

    if (clash) {
      const label = seatById(clash.seatId)?.label ?? clash.seatId;
      return {
        seat,
        available: false,
        reason:
          clash.seatId === seat.id
            ? `${formatJst(clash.startIso)} の予約と重なります。`
            : `${label}の予約と連結しているため使えません。`,
      };
    }

    return {
      seat,
      available: true,
      reason:
        seat.capacity - partySize >= 2
          ? `${seat.capacity}名席です。ご相談のうえご案内します。`
          : undefined,
    };
  });
}

export type ReservationSlot = {
  iso: string;
  label: string;
  available: boolean;
  seatCount: number;
};

/** Start times on a given day, with how many tables each one still has. */
export function reservationSlots(
  dayIso: string,
  partySize: number,
  durationMinutes: number,
  reservations: readonly Reservation[],
  nowIso: string,
): ReservationSlot[] {
  const day = toJst(dayIso);
  const weekday = weekdayOf(day.year, day.month, day.day);
  if (!HOURS.businessDays.includes(weekday)) return [];
  if (HOURS.closedDates.includes(jstDateKey(dayIso))) return [];

  const slots: ReservationSlot[] = [];
  const latestStart = HOURS.closeMinute - durationMinutes;

  for (
    let minute = HOURS.openMinute;
    minute <= latestStart;
    minute += SLOT_STEP_MINUTES
  ) {
    const iso = fromJst({
      year: day.year,
      month: day.month,
      day: day.day,
      hour: Math.floor(minute / 60),
      minute: minute % 60,
    });
    if (Date.parse(iso) <= Date.parse(nowIso)) continue;
    const options = seatOptions(
      iso,
      partySize,
      durationMinutes,
      reservations,
      nowIso,
    );
    const seatCount = options.filter((o) => o.available).length;
    slots.push({
      iso,
      label: `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`,
      available: seatCount > 0,
      seatCount,
    });
  }

  return slots;
}

export type HoldResult =
  { ok: true; reservation: Reservation } | { ok: false; reason: string };

/**
 * Takes a short hold so the table is not lost while the form is filled in.
 *
 * The hold expires on its own; nothing needs to remember to release it, and
 * `isOccupying` stops counting it the moment it lapses.
 */
export function holdTable(input: {
  seatId: string;
  startIso: string;
  partySize: number;
  durationMinutes: number;
  reservations: readonly Reservation[];
  nowIso: string;
}): HoldResult {
  const seat = seatById(input.seatId);
  if (!seat) return { ok: false, reason: "その席は選べません。" };
  if (input.partySize < 1 || input.partySize > MAX_PARTY)
    return { ok: false, reason: `ご予約は1〜${MAX_PARTY}名で承っています。` };

  const option = seatOptions(
    input.startIso,
    input.partySize,
    input.durationMinutes,
    input.reservations,
    input.nowIso,
  ).find((o) => o.seat.id === input.seatId);

  if (!option?.available)
    return { ok: false, reason: option?.reason ?? "その席は空いていません。" };

  const reservationId =
    "resv-" +
    hash({
      seatId: input.seatId,
      startIso: input.startIso,
      nowIso: input.nowIso,
    }).slice(0, 14);

  return {
    ok: true,
    reservation: {
      reservationId,
      reference: "R-" + hash(reservationId).slice(0, 6).toUpperCase(),
      seatId: input.seatId,
      partySize: input.partySize,
      startIso: input.startIso,
      durationMinutes: input.durationMinutes,
      status: "held",
      name: "",
      note: "",
      createdAtIso: input.nowIso,
      updatedAtIso: input.nowIso,
      holdExpiresAtIso: new Date(
        Date.parse(input.nowIso) + HOLD_MINUTES * 60_000,
      ).toISOString(),
      history: [
        {
          at: input.nowIso,
          event: "held",
          detail: `${seat.label}を${HOLD_MINUTES}分間お取り置きしました。`,
        },
      ],
    },
  };
}

const TRANSITIONS: Record<ReservationStatus, readonly ReservationStatus[]> = {
  requested: ["held", "cancelled"],
  held: ["confirmed", "cancelled", "expired"],
  confirmed: ["change_pending", "cancelled"],
  change_pending: ["confirmed", "cancelled"],
  cancelled: [],
  expired: [],
};

export const canTransition = (from: ReservationStatus, to: ReservationStatus) =>
  TRANSITIONS[from].includes(to);

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  requested: "希望受付",
  held: "仮押さえ",
  confirmed: "確定",
  change_pending: "変更手続き中",
  cancelled: "取消",
  expired: "期限切れ",
};

export function confirmReservation(
  reservation: Reservation,
  input: { name: string; note?: string; nowIso: string },
): { ok: boolean; reason?: string; reservation: Reservation } {
  if (!canTransition(reservation.status, "confirmed"))
    return {
      ok: false,
      reason: `${RESERVATION_STATUS_LABELS[reservation.status]}からは確定できません。`,
      reservation,
    };
  if (
    reservation.holdExpiresAtIso &&
    Date.parse(reservation.holdExpiresAtIso) <= Date.parse(input.nowIso)
  )
    return {
      ok: false,
      reason: "お取り置きの期限が切れました。時間を選び直してください。",
      reservation,
    };
  const name = input.name.trim();
  if (!name)
    return { ok: false, reason: "お名前を入力してください。", reservation };

  return {
    ok: true,
    reservation: {
      ...reservation,
      status: "confirmed",
      name: name.slice(0, 40),
      note: (input.note ?? "").slice(0, 200),
      holdExpiresAtIso: undefined,
      updatedAtIso: input.nowIso,
      history: [
        ...reservation.history,
        {
          at: input.nowIso,
          event: "confirmed",
          detail: "ご予約を確定しました。",
        },
      ],
    },
  };
}

/**
 * Moving a confirmed booking.
 *
 * The original is kept until the new time is actually taken, so a failed move
 * does not leave the guest with nothing (指示書 §11).
 */
export function proposeChange(
  reservation: Reservation,
  next: { seatId: string; startIso: string; partySize: number },
  reservations: readonly Reservation[],
  nowIso: string,
): { ok: boolean; reason?: string; reservation: Reservation } {
  if (!canTransition(reservation.status, "change_pending"))
    return {
      ok: false,
      reason: "確定済みの予約のみ変更できます。",
      reservation,
    };

  const option = seatOptions(
    next.startIso,
    next.partySize,
    reservation.durationMinutes,
    reservations,
    nowIso,
    reservation.reservationId,
  ).find((o) => o.seat.id === next.seatId);

  if (!option?.available)
    return {
      ok: false,
      reason:
        option?.reason ?? "その時間は空いていません。元の予約はそのままです。",
      reservation,
    };

  return {
    ok: true,
    reservation: {
      ...reservation,
      seatId: next.seatId,
      startIso: next.startIso,
      partySize: next.partySize,
      status: "confirmed",
      updatedAtIso: nowIso,
      history: [
        ...reservation.history,
        {
          at: nowIso,
          event: "changed",
          detail: `${formatJst(reservation.startIso)} から ${formatJst(next.startIso)} へ変更しました。`,
        },
      ],
    },
  };
}

export function cancelReservation(
  reservation: Reservation,
  nowIso: string,
): { ok: boolean; reason?: string; reservation: Reservation } {
  if (!canTransition(reservation.status, "cancelled"))
    return {
      ok: false,
      reason: "この予約は取り消せません。",
      reservation,
    };
  return {
    ok: true,
    reservation: {
      ...reservation,
      status: "cancelled",
      holdExpiresAtIso: undefined,
      updatedAtIso: nowIso,
      history: [
        ...reservation.history,
        {
          at: nowIso,
          event: "cancelled",
          detail: "ご予約を取り消しました。席は空き枠に戻ります。",
        },
      ],
    },
  };
}

/** Sweeps lapsed holds so the tables are offered again. */
export function releaseExpired(
  reservations: readonly Reservation[],
  nowIso: string,
): { reservations: Reservation[]; released: string[] } {
  const released: string[] = [];
  const next = reservations.map((r) => {
    if (
      r.status === "held" &&
      r.holdExpiresAtIso &&
      Date.parse(r.holdExpiresAtIso) <= Date.parse(nowIso)
    ) {
      released.push(r.reservationId);
      return {
        ...r,
        status: "expired" as ReservationStatus,
        updatedAtIso: nowIso,
        history: [
          ...r.history,
          {
            at: nowIso,
            event: "expired",
            detail: "お取り置きの期限が切れ、席を空き枠へ戻しました。",
          },
        ],
      };
    }
    return r;
  });
  return { reservations: next, released };
}
