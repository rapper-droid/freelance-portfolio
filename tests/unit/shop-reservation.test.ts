import { describe, expect, it } from "vitest";
import { HOURS, seatById } from "@/lib/shop/catalog";
import {
  blockedSeatIds,
  cancelReservation,
  confirmReservation,
  holdTable,
  proposeChange,
  releaseExpired,
  reservationSlots,
  seatOptions,
} from "@/lib/shop/reservation";
import { migrate, SHOP_SCHEMA_VERSION } from "@/lib/shop/store";
import { emptyState } from "@/lib/shop/store";
import type { Reservation } from "@/lib/shop/types";

/** 受け入れ基準 Q15, Q16, Q18, Q35（指示書 §11, §18）。 */

// 2026-09-24 (木) 09:00 JST. Thursday is a trading day.
const NOW = "2026-09-24T00:00:00.000Z";
const at = (hour: number, minute = 0) =>
  `2026-09-24T${String(hour - 9).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00.000Z`;

const reservation = (over: Partial<Reservation> = {}): Reservation => ({
  reservationId: "r1",
  reference: "R-AAAAAA",
  seatId: "table-a",
  partySize: 2,
  startIso: at(12),
  durationMinutes: HOURS.defaultStayMinutes,
  status: "confirmed",
  name: "テスト",
  note: "",
  createdAtIso: NOW,
  updatedAtIso: NOW,
  history: [],
  ...over,
});

describe("seat policy — 連結テーブルは両方を塞ぐ", () => {
  it("blocks both halves when the joined table is used", () => {
    const blocked = blockedSeatIds(seatById("table-ab")!);
    expect(blocked).toContain("table-a");
    expect(blocked).toContain("table-b");
  });

  it("blocks the joined table when one half is used — 相互に効く", () => {
    const blocked = blockedSeatIds(seatById("table-a")!);
    expect(blocked).toContain("table-ab");
    // Booking A alone must not block B.
    expect(blocked).not.toContain("table-b");
  });
});

describe("seatOptions — Q15 人数・時間・席が連動する", () => {
  it("hides seats too small for the party", () => {
    const options = seatOptions(at(12), 4, 90, [], NOW);
    expect(options.find((o) => o.seat.id === "counter-1")?.available).toBe(
      false,
    );
    expect(options.find((o) => o.seat.id === "table-ab")?.available).toBe(true);
  });

  it("marks an overlapping booking as taken", () => {
    const options = seatOptions(at(12, 30), 2, 90, [reservation()], NOW);
    const tableA = options.find((o) => o.seat.id === "table-a");
    expect(tableA?.available).toBe(false);
    expect(tableA?.reason).toContain("重なります");
  });

  it("frees the table once the sitting plus turnaround has passed", () => {
    // 12:00 + 90 minutes + 15 turnaround = free from 13:45.
    expect(
      seatOptions(at(13, 45), 2, 90, [reservation()], NOW).find(
        (o) => o.seat.id === "table-a",
      )?.available,
    ).toBe(true);
    expect(
      seatOptions(at(13, 30), 2, 90, [reservation()], NOW).find(
        (o) => o.seat.id === "table-a",
      )?.available,
    ).toBe(false);
  });

  it("blocks the joined table when one half is booked", () => {
    const options = seatOptions(at(12), 4, 90, [reservation()], NOW);
    const joined = options.find((o) => o.seat.id === "table-ab");
    expect(joined?.available).toBe(false);
    expect(joined?.reason).toContain("連結");
  });

  it("ignores a cancelled booking", () => {
    const options = seatOptions(
      at(12),
      2,
      90,
      [reservation({ status: "cancelled" })],
      NOW,
    );
    expect(options.find((o) => o.seat.id === "table-a")?.available).toBe(true);
  });

  it("notes when a table is much larger than the party", () => {
    const window = seatOptions(at(12), 1, 90, [], NOW).find(
      (o) => o.seat.id === "window",
    );
    expect(window?.available).toBe(true);
    expect(window?.reason).toContain("ご相談");
  });
});

describe("reservationSlots — 営業日・休業日・過去を扱う", () => {
  it("offers slots on a trading day", () => {
    const slots = reservationSlots(at(9), 2, 90, [], NOW);
    expect(slots.length).toBeGreaterThan(0);
    for (const slot of slots) expect(slot.available).toBe(true);
  });

  it("offers nothing on the closing weekday", () => {
    // 2026-09-23 is a Wednesday, the shop's closing day.
    expect(
      reservationSlots("2026-09-22T23:00:00.000Z", 2, 90, [], NOW),
    ).toHaveLength(0);
  });

  it("offers nothing on a listed closed date", () => {
    // 2026-09-30 is in closedDates.
    expect(
      reservationSlots("2026-09-30T00:00:00.000Z", 2, 90, [], NOW),
    ).toHaveLength(0);
  });

  it("never offers a start already in the past", () => {
    for (const slot of reservationSlots(at(9), 2, 90, [], NOW))
      expect(Date.parse(slot.iso)).toBeGreaterThan(Date.parse(NOW));
  });

  it("reports how many tables a slot still has", () => {
    const before = reservationSlots(at(9), 2, 90, [], NOW).find(
      (s) => s.label === "12:00",
    );
    const after = reservationSlots(at(9), 2, 90, [reservation()], NOW).find(
      (s) => s.label === "12:00",
    );
    expect(after!.seatCount).toBeLessThan(before!.seatCount);
  });

  it("leaves a slot selectable while any table remains", () => {
    const slot = reservationSlots(at(9), 2, 90, [reservation()], NOW).find(
      (s) => s.label === "12:00",
    );
    expect(slot?.available).toBe(true);
  });
});

describe("hold and confirm — Q16 期限・確定・競合", () => {
  const held = (() => {
    const result = holdTable({
      seatId: "table-a",
      startIso: at(12),
      partySize: 2,
      durationMinutes: 90,
      reservations: [],
      nowIso: NOW,
    });
    if (!result.ok) throw new Error(result.reason);
    return result.reservation;
  })();

  it("holds a table with a deadline", () => {
    expect(held.status).toBe("held");
    expect(Date.parse(held.holdExpiresAtIso!)).toBeGreaterThan(Date.parse(NOW));
  });

  it("refuses to hold a table that is taken", () => {
    const result = holdTable({
      seatId: "table-a",
      startIso: at(12),
      partySize: 2,
      durationMinutes: 90,
      reservations: [reservation()],
      nowIso: NOW,
    });
    expect(result.ok).toBe(false);
  });

  it("refuses a party larger than the shop takes", () => {
    const result = holdTable({
      seatId: "window",
      startIso: at(12),
      partySize: 99,
      durationMinutes: 90,
      reservations: [],
      nowIso: NOW,
    });
    expect(result.ok).toBe(false);
  });

  it("confirms with a name and drops the hold deadline", () => {
    const result = confirmReservation(held, { name: "山田", nowIso: NOW });
    expect(result.ok).toBe(true);
    expect(result.reservation.status).toBe("confirmed");
    expect(result.reservation.holdExpiresAtIso).toBeUndefined();
  });

  it("refuses to confirm without a name", () => {
    expect(confirmReservation(held, { name: "   ", nowIso: NOW }).ok).toBe(
      false,
    );
  });

  it("refuses to confirm after the hold lapsed — Q16", () => {
    const late = "2026-09-24T01:00:00.000Z";
    const result = confirmReservation(held, { name: "山田", nowIso: late });
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("期限");
  });

  it("releases lapsed holds and returns the table to the slots", () => {
    const late = "2026-09-24T01:00:00.000Z";
    const { reservations, released } = releaseExpired([held], late);
    expect(released).toEqual([held.reservationId]);
    expect(reservations[0].status).toBe("expired");
    expect(
      seatOptions(at(12), 2, 90, reservations, late).find(
        (o) => o.seat.id === "table-a",
      )?.available,
    ).toBe(true);
  });
});

describe("change and cancel — Q16 旧予約を先に消さない", () => {
  it("keeps the original when the new time is unavailable", () => {
    const other = reservation({
      reservationId: "r2",
      seatId: "table-b",
      startIso: at(15),
    });
    const result = proposeChange(
      reservation(),
      { seatId: "table-b", startIso: at(15), partySize: 2 },
      [reservation(), other],
      NOW,
    );
    expect(result.ok).toBe(false);
    // Unchanged: still the original seat and time.
    expect(result.reservation.startIso).toBe(at(12));
    expect(result.reservation.seatId).toBe("table-a");
  });

  it("moves the booking and records the change", () => {
    const result = proposeChange(
      reservation(),
      { seatId: "table-b", startIso: at(15), partySize: 2 },
      [reservation()],
      NOW,
    );
    expect(result.ok).toBe(true);
    expect(result.reservation.startIso).toBe(at(15));
    expect(result.reservation.history.at(-1)?.detail).toContain("変更");
  });

  it("does not treat the booking as blocking its own move", () => {
    // Moving 12:00 to 12:30 on the same table must not clash with itself.
    const result = proposeChange(
      reservation(),
      { seatId: "table-a", startIso: at(12, 30), partySize: 2 },
      [reservation()],
      NOW,
    );
    expect(result.ok).toBe(true);
  });

  it("returns the table to the slots after a cancellation", () => {
    const cancelled = cancelReservation(reservation(), NOW);
    expect(cancelled.ok).toBe(true);
    expect(
      seatOptions(at(12), 2, 90, [cancelled.reservation], NOW).find(
        (o) => o.seat.id === "table-a",
      )?.available,
    ).toBe(true);
  });

  it("refuses to cancel twice", () => {
    const once = cancelReservation(reservation(), NOW).reservation;
    expect(cancelReservation(once, NOW).ok).toBe(false);
  });
});

describe("sandbox storage — Q35 更新で保存を消さない", () => {
  it("migrates an older sandbox instead of discarding it", () => {
    const old = {
      schemaVersion: 0,
      sandboxId: "abc",
      orders: [{ orderId: "o1" }],
      reservations: [],
      cart: { lines: [], updatedAt: NOW },
    };
    const { state, note } = migrate(old, NOW);
    expect(state.schemaVersion).toBe(SHOP_SCHEMA_VERSION);
    expect(state.orders).toHaveLength(1);
    expect(state.sandboxId).toBe("abc");
    expect(note ?? "").toContain("更新");
  });

  it("refuses to downgrade data written by a newer build", () => {
    const { state, note } = migrate(
      { schemaVersion: SHOP_SCHEMA_VERSION + 1, orders: [{ orderId: "x" }] },
      NOW,
    );
    expect(state.orders).toHaveLength(0);
    expect(note).toContain("新しい版");
  });

  it("starts fresh for unreadable data rather than throwing", () => {
    expect(migrate(null, NOW).state.orders).toEqual([]);
    expect(migrate("nonsense", NOW).state.orders).toEqual([]);
  });

  it("gives each sandbox its own id", () => {
    expect(emptyState(NOW, "a").sandboxId).not.toBe(
      emptyState(NOW, "b").sandboxId,
    );
  });
});
