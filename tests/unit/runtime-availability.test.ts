import { describe, expect, it } from "vitest";
import {
  blockedInterval,
  canTransition,
  checkSlot,
  confirmBooking,
  overlaps,
  proposeSlots,
  releaseExpiredHolds,
  type Booking,
  type ResourceCalendar,
} from "@/lib/runtime/rules/availability";
import { fromJst } from "@/lib/runtime/rules/datetime";

/** 受け入れ基準 B03, B05, B06, B07, B08, B10。 */

// One studio: weekdays 10:00–18:00, 60-minute shoots, 15 minutes either side.
const CALENDAR: ResourceCalendar = {
  resourceId: "studio-a",
  label: "スタジオA",
  businessDays: [1, 2, 3, 4, 5],
  openMinute: 10 * 60,
  closeMinute: 18 * 60,
  closedDates: ["2026-09-23"],
  serviceMinutes: 60,
  bufferBeforeMinutes: 15,
  bufferAfterMinutes: 15,
  slotStepMinutes: 30,
};

const NOW = "2026-09-22T01:00:00.000Z"; // 2026-09-22(火) 10:00 JST

const at = (day: number, hour: number, minute = 0) =>
  fromJst({ year: 2026, month: 9, day, hour, minute });

const booking = (
  over: Partial<Booking> & { bookingId: string; startIso: string },
): Booking => ({
  resourceId: "studio-a",
  serviceMinutes: 60,
  bufferBeforeMinutes: 15,
  bufferAfterMinutes: 15,
  status: "CONFIRMED",
  managedByUs: true,
  ...over,
});

describe("blocked intervals include the buffers", () => {
  it("blocks more wall clock than the service itself", () => {
    const i = blockedInterval({
      startIso: at(24, 14),
      serviceMinutes: 60,
      bufferBeforeMinutes: 15,
      bufferAfterMinutes: 15,
    });
    expect((i.endMs - i.startMs) / 60_000).toBe(90);
  });

  it("treats touching intervals as free, overlapping ones as busy", () => {
    const a = { startMs: 0, endMs: 100 };
    expect(overlaps(a, { startMs: 100, endMs: 200 })).toBe(false);
    expect(overlaps(a, { startMs: 99, endMs: 200 })).toBe(true);
  });
});

describe("checkSlot — B03 営業日・休業日・準備時間・既存予定", () => {
  it("accepts a slot that fits", () => {
    expect(checkSlot(at(24, 14), CALENDAR, [], NOW).ok).toBe(true);
  });

  it("refuses a Saturday", () => {
    const v = checkSlot(at(26, 14), CALENDAR, [], NOW); // 2026-09-26 is Saturday
    expect(v.ok).toBe(false);
    expect(v.warnings.map((w) => w.code)).toContain("closed_weekday");
  });

  it("refuses a listed closed date", () => {
    const v = checkSlot(at(23, 14), CALENDAR, [], NOW);
    expect(v.warnings.map((w) => w.code)).toContain("closed_date");
  });

  it("refuses 10:00 because setup would start before opening", () => {
    // Service fits 10:00–11:00, but 15 minutes of setup starts at 09:45.
    const v = checkSlot(at(24, 10), CALENDAR, [], NOW);
    expect(v.ok).toBe(false);
    expect(v.warnings.map((w) => w.code)).toContain("outside_business_hours");
  });

  it("accepts 10:15, the first start whose setup fits", () => {
    expect(checkSlot(at(24, 10, 15), CALENDAR, [], NOW).ok).toBe(true);
  });

  it("refuses 17:00 because teardown would run past closing", () => {
    const v = checkSlot(at(24, 17), CALENDAR, [], NOW);
    expect(v.warnings.map((w) => w.code)).toContain("outside_business_hours");
  });

  it("refuses a slot in the past", () => {
    const v = checkSlot(at(21, 14), CALENDAR, [], NOW);
    expect(v.warnings.map((w) => w.code)).toContain("slot_in_past");
  });

  it("refuses a slot whose buffer collides with a neighbour — B06", () => {
    // 14:00–15:00 booked; 15:00 looks adjacent but the buffers overlap.
    const existing = [booking({ bookingId: "b1", startIso: at(24, 14) })];
    const v = checkSlot(at(24, 15), CALENDAR, existing, NOW);
    expect(v.ok).toBe(false);
    expect(v.conflictsWith).toEqual(["b1"]);
    expect(v.warnings.map((w) => w.code)).toContain("slot_conflict");
  });

  it("accepts the first start clear of both buffers", () => {
    const existing = [booking({ bookingId: "b1", startIso: at(24, 14) })];
    expect(checkSlot(at(24, 15, 30), CALENDAR, existing, NOW).ok).toBe(true);
  });

  it("reports an external conflict as external and does not claim it — B07/B10", () => {
    const existing = [
      booking({
        bookingId: "ext-1",
        startIso: at(24, 14),
        managedByUs: false,
      }),
    ];
    const v = checkSlot(at(24, 14), CALENDAR, existing, NOW);
    expect(v.ok).toBe(false);
    expect(v.warnings.map((w) => w.code)).toContain("external_conflict");
    expect(v.warnings[0].message).toContain("管理対象外");
  });

  it("ignores a proposal that was never held", () => {
    const existing = [
      booking({ bookingId: "p1", startIso: at(24, 14), status: "PROPOSED" }),
    ];
    expect(checkSlot(at(24, 14), CALENDAR, existing, NOW).ok).toBe(true);
  });

  it("ignores a hold whose deadline has passed — B08", () => {
    const existing = [
      booking({
        bookingId: "h1",
        startIso: at(24, 14),
        status: "HELD",
        holdExpiresAt: "2026-09-22T00:00:00.000Z", // before NOW
      }),
    ];
    expect(checkSlot(at(24, 14), CALENDAR, existing, NOW).ok).toBe(true);
  });

  it("respects a hold that is still alive", () => {
    const existing = [
      booking({
        bookingId: "h2",
        startIso: at(24, 14),
        status: "HELD",
        holdExpiresAt: "2026-09-22T05:00:00.000Z", // after NOW
      }),
    ];
    expect(checkSlot(at(24, 14), CALENDAR, existing, NOW).ok).toBe(false);
  });
});

describe("proposeSlots — 候補提示", () => {
  it("offers the nearest free times to what was asked for", () => {
    // 14:00 is taken; the offer should sit close to 14:00 on the same day.
    const existing = [booking({ bookingId: "b1", startIso: at(24, 14) })];
    const slots = proposeSlots(
      { fromDateIso: at(24, 0), preferredMinuteOfDay: 14 * 60 },
      CALENDAR,
      existing,
      NOW,
    );
    expect(slots.length).toBe(3);
    for (const s of slots) expect(s.ok).toBe(true);
    // Nothing offered may collide with the existing booking.
    expect(slots.map((s) => s.startIso)).not.toContain(at(24, 14));
    expect(slots[0].startIso.startsWith("2026-09-24")).toBe(true);
  });

  it("skips closed days entirely", () => {
    const slots = proposeSlots(
      { fromDateIso: at(23, 0), preferredMinuteOfDay: 14 * 60, limit: 5 },
      CALENDAR,
      [],
      NOW,
    );
    // 2026-09-23 is a listed closure, 09-26/27 are the weekend.
    for (const s of slots)
      expect(["2026-09-23", "2026-09-26", "2026-09-27"]).not.toContain(
        s.startIso.slice(0, 10),
      );
  });

  it("stays inside a requested window such as 午後", () => {
    const slots = proposeSlots(
      {
        fromDateIso: at(24, 0),
        preferredMinuteOfDay: 12 * 60,
        windowMinutes: [12 * 60, 18 * 60],
        limit: 5,
      },
      CALENDAR,
      [],
      NOW,
    );
    for (const s of slots) {
      const hour = Number(s.startIso.slice(11, 13)) + 9; // UTC → JST
      expect(hour).toBeGreaterThanOrEqual(12);
    }
  });

  it("returns nothing rather than inventing a slot when the calendar is closed", () => {
    const closed: ResourceCalendar = { ...CALENDAR, businessDays: [] };
    expect(
      proposeSlots(
        { fromDateIso: at(24, 0), preferredMinuteOfDay: null },
        closed,
        [],
        NOW,
      ),
    ).toHaveLength(0);
  });
});

describe("holds and the state machine — B05, B08", () => {
  it("releases expired holds and names them", () => {
    const { bookings, released } = releaseExpiredHolds(
      [
        booking({
          bookingId: "h1",
          startIso: at(24, 14),
          status: "HELD",
          holdExpiresAt: "2026-09-22T00:00:00.000Z",
        }),
        booking({
          bookingId: "h2",
          startIso: at(24, 16),
          status: "HELD",
          holdExpiresAt: "2026-09-22T05:00:00.000Z",
        }),
      ],
      NOW,
    );
    expect(released).toEqual(["h1"]);
    expect(bookings.find((b) => b.bookingId === "h1")?.status).toBe(
      "CANCELLED",
    );
    expect(bookings.find((b) => b.bookingId === "h2")?.status).toBe("HELD");
  });

  it("allows only the transitions the workflow defines", () => {
    expect(canTransition("REQUESTED", "PROPOSED")).toBe(true);
    expect(canTransition("PROPOSED", "HELD")).toBe(true);
    expect(canTransition("HELD", "CONFIRMED")).toBe(true);
    expect(canTransition("REQUESTED", "CONFIRMED")).toBe(false);
    expect(canTransition("CANCELLED", "CONFIRMED")).toBe(false);
  });

  it("refuses to confirm on the administrator's approval alone — B05", () => {
    const held = booking({
      bookingId: "h1",
      startIso: at(24, 14),
      status: "HELD",
    });
    const result = confirmBooking(held, { adminApprovedAt: NOW });
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("予約者の日程合意");
    expect(result.booking.status).toBe("HELD");
  });

  it("confirms when both the requester and the administrator agreed", () => {
    const held = booking({
      bookingId: "h1",
      startIso: at(24, 14),
      status: "HELD",
    });
    const result = confirmBooking(held, {
      adminApprovedAt: NOW,
      requesterAgreedAt: NOW,
    });
    expect(result.ok).toBe(true);
    expect(result.booking.status).toBe("CONFIRMED");
  });

  it("refuses to confirm a cancelled booking even with both agreements", () => {
    const cancelled = booking({
      bookingId: "c1",
      startIso: at(24, 14),
      status: "CANCELLED",
    });
    expect(
      confirmBooking(cancelled, {
        adminApprovedAt: NOW,
        requesterAgreedAt: NOW,
      }).ok,
    ).toBe(false);
  });
});
