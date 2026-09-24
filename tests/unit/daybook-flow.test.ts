import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  checkSlot,
  confirmBooking,
  proposeSlots,
  releaseExpiredHolds,
  type Booking,
} from "../../src/lib/runtime/rules/availability";
import {
  runDaybook,
  planReschedule,
} from "../../src/lib/runtime/daybook/workflow";
import {
  STUDIO,
  seedBookings,
  sampleRequests,
} from "../../src/lib/daybook/seed";
import {
  DAYBOOK_SCHEMA_VERSION,
  DAYBOOK_STORAGE_KEY,
  emptyDaybookState,
  exportDaybookState,
  importDaybookState,
  loadDaybookState,
  migrateDaybook,
  saveDaybookState,
  type DaybookState,
  type RequestRecord,
} from "../../src/lib/daybook/store";
import { readBackup } from "../../src/lib/runtime/sandbox";
import { toJst } from "../../src/lib/runtime/rules/datetime";

/**
 * DAYBOOK end to end (指示書 §14).
 *
 * The flow the spec calls mandatory is one test, run in order, because the
 * interesting part is not any single step — it is that the state survives
 * between them: 希望が埋まっている → 代替候補 → 確定 → 後から変更依頼 →
 * 差分だけ → 関連記録更新.
 */

const NOW = "2026-09-24T02:00:00.000Z";

const record = (over: Partial<RequestRecord> = {}): RequestRecord => ({
  requestId: "REQ-TEST",
  requesterName: "山田太郎",
  requesterEmail: "sample@example.com",
  text: "撮影をお願いします。",
  receivedAtIso: NOW,
  requestedIso: null,
  proposals: [],
  bookingId: null,
  requesterAgreedAt: null,
  adminApprovedAt: null,
  moveToIso: null,
  timeline: [],
  ...over,
});

describe("the seed places its conflicts relative to now", () => {
  it("puts both appointments on a future business day", () => {
    for (const nowIso of [
      "2026-09-21T01:00:00.000Z", // Monday
      "2026-09-25T09:30:00.000Z", // Friday evening JST
      "2026-09-26T12:00:00.000Z", // Saturday
    ]) {
      const bookings = seedBookings(nowIso);
      expect(bookings).toHaveLength(2);
      for (const booking of bookings) {
        expect(Date.parse(booking.startIso)).toBeGreaterThan(
          Date.parse(nowIso),
        );
        const jst = toJst(booking.startIso);
        expect(STUDIO.businessDays).toContain(jst.weekday);
      }
    }
  });

  it("keeps one entry that is not ours, because that is the one we must not move", () => {
    const external = seedBookings(NOW).find((b) => !b.managedByUs)!;
    expect(external.bookingId).toBe("EXT-0041");
    const plan = planReschedule(
      external,
      seedBookings(NOW)[0].startIso,
      STUDIO,
      seedBookings(NOW),
      NOW,
    );
    expect(plan.ok).toBe(false);
    expect(plan.reason).toMatch(/管理対象ではありません/);
  });

  it("writes the sample text against the day it will be read on", () => {
    const taken = sampleRequests.find((s) => s.id === "taken")!;
    const bookings = seedBookings(NOW);
    const result = runDaybook(
      {
        requestId: "REQ-1",
        tenantId: "demo",
        receivedAtIso: NOW,
        requesterName: taken.name,
        requesterEmail: taken.email,
        text: taken.text(NOW),
      },
      { mode: "sample", calendar: STUDIO, bookings, nowIso: NOW },
    );
    // The sample that exists to collide, collides.
    expect(result.requested?.ok).toBe(false);
    expect(result.requested?.conflictsWith).toContain("BK-0912");
    expect(result.proposals.length).toBeGreaterThan(0);
  });

  it("offers alternatives for a request with no date at all", () => {
    const vague = sampleRequests.find((s) => s.id === "vague")!;
    const result = runDaybook(
      {
        requestId: "REQ-2",
        tenantId: "demo",
        receivedAtIso: NOW,
        requesterName: vague.name,
        requesterEmail: vague.email,
        text: vague.text(NOW),
      },
      {
        mode: "sample",
        calendar: STUDIO,
        bookings: seedBookings(NOW),
        nowIso: NOW,
      },
    );
    expect(result.requested).toBeNull();
    expect(result.missing.length).toBeGreaterThan(0);
    expect(result.proposals.length).toBeGreaterThan(0);
  });

  it("refuses a time outside business hours with the reason, not a shrug", () => {
    const closed = sampleRequests.find((s) => s.id === "closed")!;
    const result = runDaybook(
      {
        requestId: "REQ-3",
        tenantId: "demo",
        receivedAtIso: NOW,
        requesterName: closed.name,
        requesterEmail: closed.email,
        text: closed.text(NOW),
      },
      {
        mode: "sample",
        calendar: STUDIO,
        bookings: seedBookings(NOW),
        nowIso: NOW,
      },
    );
    expect(result.requested?.ok).toBe(false);
    expect(result.requested?.warnings.some((w) => /営業/.test(w.message))).toBe(
      true,
    );
    // And it still offers somewhere to go.
    expect(result.proposals.length).toBeGreaterThan(0);
  });
});

describe("the mandatory flow, in order", () => {
  it("runs taken → alternative → held → confirmed → moved → approved", () => {
    let bookings = seedBookings(NOW);
    const taken = bookings.find((b) => b.bookingId === "BK-0912")!;

    // 1. The time they asked for is taken.
    const wanted = checkSlot(taken.startIso, STUDIO, bookings, NOW);
    expect(wanted.ok).toBe(false);
    expect(wanted.conflictsWith).toContain("BK-0912");

    // 2. So they are offered times that are actually free.
    const proposals = proposeSlots(
      { fromDateIso: taken.startIso, preferredMinuteOfDay: 14 * 60 },
      STUDIO,
      bookings,
      NOW,
    );
    expect(proposals.length).toBeGreaterThan(0);
    for (const slot of proposals) expect(slot.ok).toBe(true);
    // None of them collide with the buffers around the existing bookings.
    for (const slot of proposals)
      expect(checkSlot(slot.startIso, STUDIO, bookings, NOW).ok).toBe(true);

    // 3. Taking one holds it. A hold is not a booking.
    const chosen = proposals[0].startIso;
    const held: Booking = {
      bookingId: "BK-NEW",
      resourceId: STUDIO.resourceId,
      startIso: chosen,
      serviceMinutes: STUDIO.serviceMinutes,
      bufferBeforeMinutes: STUDIO.bufferBeforeMinutes,
      bufferAfterMinutes: STUDIO.bufferAfterMinutes,
      status: "HELD",
      holdExpiresAt: new Date(Date.parse(NOW) + 10 * 60_000).toISOString(),
      managedByUs: true,
    };
    bookings = [...bookings, held];
    // Held time is occupied: somebody else asking for it is refused.
    expect(checkSlot(chosen, STUDIO, bookings, NOW).ok).toBe(false);

    // 4. One signature is not enough. Either one alone.
    expect(confirmBooking(held, { adminApprovedAt: NOW }).ok).toBe(false);
    expect(confirmBooking(held, { adminApprovedAt: NOW }).reason).toMatch(
      /予約者の日程合意/,
    );
    expect(confirmBooking(held, { requesterAgreedAt: NOW }).ok).toBe(false);

    // 5. Both signatures confirm it.
    const confirmed = confirmBooking(held, {
      requesterAgreedAt: NOW,
      adminApprovedAt: NOW,
    });
    expect(confirmed.ok).toBe(true);
    expect(confirmed.booking.status).toBe("CONFIRMED");
    bookings = bookings.map((b) =>
      b.bookingId === "BK-NEW" ? confirmed.booking : b,
    );

    // 6. Later they ask to move it.
    const later = proposeSlots(
      { fromDateIso: chosen, preferredMinuteOfDay: null, limit: 8 },
      STUDIO,
      bookings.filter((b) => b.bookingId !== "BK-NEW"),
      NOW,
    ).find((s) => s.startIso !== chosen)!;
    const plan = planReschedule(
      confirmed.booking,
      later.startIso,
      STUDIO,
      bookings,
      NOW,
    );
    expect(plan.ok).toBe(true);
    expect(plan.remindersToStop).toContain("reminder:BK-NEW");

    // 7. Until that move is approved, the ORIGINAL slot is still theirs.
    const pending = {
      ...confirmed.booking,
      status: "RESCHEDULE_PENDING" as const,
    };
    bookings = bookings.map((b) => (b.bookingId === "BK-NEW" ? pending : b));
    expect(checkSlot(chosen, STUDIO, bookings, NOW).conflictsWith).toContain(
      "BK-NEW",
    );

    // 8. Approving moves it, and only then is the old time free.
    const moved = confirmBooking(pending, {
      requesterAgreedAt: NOW,
      adminApprovedAt: NOW,
    });
    expect(moved.ok).toBe(true);
    bookings = bookings.map((b) =>
      b.bookingId === "BK-NEW"
        ? { ...moved.booking, startIso: later.startIso }
        : b,
    );
    expect(checkSlot(chosen, STUDIO, bookings, NOW).ok).toBe(true);
    expect(
      checkSlot(later.startIso, STUDIO, bookings, NOW).conflictsWith,
    ).toContain("BK-NEW");
  });

  it("releases a hold nobody confirmed, and keeps a confirmed booking", () => {
    const base = seedBookings(NOW);
    const stale: Booking = {
      ...base[0],
      bookingId: "BK-STALE",
      status: "HELD",
      holdExpiresAt: new Date(Date.parse(NOW) - 60_000).toISOString(),
    };
    const swept = releaseExpiredHolds([...base, stale], NOW);
    expect(swept.released).toEqual(["BK-STALE"]);
    expect(swept.bookings.find((b) => b.bookingId === "BK-STALE")!.status).toBe(
      "CANCELLED",
    );
    expect(swept.bookings.find((b) => b.bookingId === "BK-0912")!.status).toBe(
      "CONFIRMED",
    );
  });

  it("will not confirm a cancelled booking back into existence", () => {
    const cancelled: Booking = {
      ...seedBookings(NOW)[0],
      status: "CANCELLED",
    };
    const result = confirmBooking(cancelled, {
      requesterAgreedAt: NOW,
      adminApprovedAt: NOW,
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/確定はできません/);
  });
});

describe("the daybook sandbox", () => {
  /** A storage that behaves, so the store's fallbacks are what is tested. */
  function fakeStorage() {
    const map = new Map<string, string>();
    return {
      map,
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => void map.set(k, v),
      removeItem: (k: string) => void map.delete(k),
      clear: () => map.clear(),
      key: (i: number) => [...map.keys()][i] ?? null,
      get length() {
        return map.size;
      },
    };
  }
  let store: ReturnType<typeof fakeStorage>;
  beforeEach(() => {
    store = fakeStorage();
    vi.stubGlobal("localStorage", store);
  });

  const filled = (): DaybookState => ({
    ...emptyDaybookState(NOW, "test"),
    bookings: seedBookings(NOW),
    requests: [record({ bookingId: "BK-0912" })],
  });

  it("keeps bookings and requests across a reload", () => {
    expect(saveDaybookState(filled())).toBe(true);
    const loaded = loadDaybookState(NOW);
    expect(loaded.state.bookings).toHaveLength(2);
    expect(loaded.state.requests[0].requestId).toBe("REQ-TEST");
    expect(loaded.note).toBeUndefined();
  });

  it("starts empty rather than failing when nothing is stored", () => {
    const loaded = loadDaybookState(NOW);
    expect(loaded.state.bookings).toEqual([]);
    expect(loaded.state.requests).toEqual([]);
    expect(loaded.state.schemaVersion).toBe(DAYBOOK_SCHEMA_VERSION);
  });

  it("keeps a copy of data it cannot read, instead of destroying it", () => {
    store.map.set(DAYBOOK_STORAGE_KEY, "{ this is not json");
    const loaded = loadDaybookState(NOW);
    expect(loaded.state.requests).toEqual([]);
    expect(loaded.note).toMatch(/読み込めませんでした/);
    expect(readBackup(DAYBOOK_STORAGE_KEY)?.text).toContain("not json");
  });

  it("refuses data written by a newer version, and backs it up", () => {
    saveDaybookState({
      ...filled(),
      schemaVersion: DAYBOOK_SCHEMA_VERSION + 5,
    });
    const loaded = loadDaybookState(NOW);
    expect(loaded.state.requests).toEqual([]);
    expect(loaded.note).toMatch(/新しい版/);
    expect(readBackup(DAYBOOK_STORAGE_KEY)).toBeTruthy();
  });

  it("drops entries it cannot read and says how many, rather than all of them", () => {
    const migrated = migrateDaybook(
      {
        schemaVersion: DAYBOOK_SCHEMA_VERSION,
        bookings: [seedBookings(NOW)[0], { nonsense: true }],
        requests: [record(), { alsoNonsense: true }],
      },
      NOW,
    );
    expect(migrated.state.bookings).toHaveLength(1);
    expect(migrated.state.requests).toHaveLength(1);
    expect(migrated.note).toMatch(/2 件を除いて/);
  });

  it("carries an older version forward without losing the bookings", () => {
    const migrated = migrateDaybook(
      { schemaVersion: 0, bookings: seedBookings(NOW), requests: [record()] },
      NOW,
    );
    expect(migrated.state.schemaVersion).toBe(DAYBOOK_SCHEMA_VERSION);
    expect(migrated.state.bookings).toHaveLength(2);
    expect(migrated.note).toMatch(/引き継/);
  });

  it("round-trips an export", () => {
    const text = exportDaybookState(filled());
    const imported = importDaybookState(text, NOW);
    expect(imported.ok).toBe(true);
    if (imported.ok)
      expect(imported.state.requests[0].requestId).toBe("REQ-TEST");
  });

  it("refuses a file from another experience", () => {
    const foreign = importDaybookState(
      JSON.stringify({ schemaVersion: 1, orders: [], cart: [] }),
      NOW,
    );
    expect(foreign.ok).toBe(false);
    if (!foreign.ok) expect(foreign.reason).toMatch(/この体験の保存データ/);

    const broken = importDaybookState("not json at all", NOW);
    expect(broken.ok).toBe(false);
  });
});
