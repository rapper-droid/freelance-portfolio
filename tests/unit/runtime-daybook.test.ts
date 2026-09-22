import { describe, expect, it } from "vitest";
import { checkBudget, retryDelayMs } from "@/lib/runtime/budget";
import {
  planReschedule,
  runDaybook,
  type BookingRequest,
} from "@/lib/runtime/daybook/workflow";
import type {
  Booking,
  ResourceCalendar,
} from "@/lib/runtime/rules/availability";
import { fromJst } from "@/lib/runtime/rules/datetime";
import { MemoryRunStore } from "@/lib/runtime/store";

/** 受け入れ基準 B01–B10, O01–O08。 */

const CALENDAR: ResourceCalendar = {
  resourceId: "studio-a",
  label: "スタジオA",
  businessDays: [1, 2, 3, 4, 5],
  openMinute: 10 * 60,
  closeMinute: 18 * 60,
  closedDates: [],
  serviceMinutes: 60,
  bufferBeforeMinutes: 15,
  bufferAfterMinutes: 15,
  slotStepMinutes: 30,
};

const RECEIVED = "2026-09-22T01:00:00.000Z"; // 2026-09-22(火) 10:00 JST
const at = (day: number, hour: number, minute = 0) =>
  fromJst({ year: 2026, month: 9, day, hour, minute });

const request = (over: Partial<BookingRequest> = {}): BookingRequest => ({
  requestId: "req-1",
  tenantId: "t1",
  receivedAtIso: RECEIVED,
  requesterName: "佐藤花子",
  requesterEmail: "sato@example.com",
  text: "来週の水曜14時ごろに撮影したいです。",
  ...over,
});

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

const daybook = (
  req = request(),
  bookings: Booking[] = [],
  mode: "sample" | "customer_live" = "sample",
) => runDaybook(req, { mode, calendar: CALENDAR, bookings });

describe("runDaybook — 指示書 §08-4 の必須体験", () => {
  it("offers alternatives when the requested time is taken", () => {
    // 2026-09-30 is next week's Wednesday. 14:00 is already booked.
    const taken = [booking({ bookingId: "b1", startIso: at(30, 14) })];
    const result = daybook(request(), taken);

    expect(result.requested?.ok).toBe(false);
    expect(result.requested?.conflictsWith).toEqual(["b1"]);
    expect(result.proposals.length).toBeGreaterThan(0);
    for (const p of result.proposals) expect(p.ok).toBe(true);
    // Nothing offered may collide with the booking that caused the search.
    expect(result.proposals.map((p) => p.startIso)).not.toContain(at(30, 14));
  });

  it("offers the requested time itself when it is free", () => {
    const result = daybook();
    expect(result.requested?.ok).toBe(true);
    expect(result.proposals[0].startIso).toBe(at(30, 14));
  });

  it("accounts for preparation time when judging a neighbouring slot — B03", () => {
    const taken = [booking({ bookingId: "b1", startIso: at(30, 13) })];
    const result = daybook(request(), taken);
    // 13:00–14:00 plus buffers blocks 12:45–14:15, so 14:00 does not fit.
    expect(result.requested?.ok).toBe(false);
  });

  it("holds only the first candidate, with a deadline — B08", () => {
    const result = daybook();
    const hold = result.payloads.hold as {
      startIso: string;
      holdExpiresAt: string;
    };
    expect(hold.startIso).toBe(result.proposals[0].startIso);
    expect(Date.parse(hold.holdExpiresAt)).toBeGreaterThan(
      Date.parse(RECEIVED),
    );
  });

  it("keeps confirmation separate from proposing — B05", () => {
    const confirm = daybook().plan.actions.find((a) => a.id === "confirm");
    expect(confirm?.kind).toBe("calendar.confirm");
    expect(confirm?.summary).toContain("予約者の日程合意");
  });

  it("releases an expired hold before offering anything — B08", () => {
    const stale = [
      booking({
        bookingId: "h1",
        startIso: at(30, 14),
        status: "HELD",
        holdExpiresAt: "2026-09-21T00:00:00.000Z",
      }),
    ];
    const result = daybook(request(), stale);
    expect(result.releasedHolds).toEqual(["h1"]);
    expect(result.requested?.ok).toBe(true);
  });

  it("waits for confirmation when the time is a range — B01", () => {
    const result = daybook(
      request({ text: "来週の水曜の午後に撮影したいです。" }),
    );
    expect(result.run.status).toBe("needs_info");
    expect(result.warnings.map((w) => w.code)).toContain("time_is_range");
    // Proposals still come back, inside the afternoon window.
    expect(result.proposals.length).toBeGreaterThan(0);
  });

  it("waits for confirmation when the weekday contradicts the date — B04", () => {
    const result = daybook(
      request({ text: "10月2日（水）14時でお願いします" }),
    );
    expect(result.run.status).toBe("needs_info");
    expect(result.warnings.map((w) => w.code)).toContain("weekday_conflict");
  });

  it("waits for confirmation when no date could be read", () => {
    const result = daybook(request({ text: "撮影をお願いしたいです。" }));
    expect(result.run.status).toBe("needs_info");
    expect(result.missing.map((m) => m.field)).toContain("startDate");
  });

  it("does not execute anything by planning — B06", () => {
    expect(daybook().run.effects).toHaveLength(0);
    expect(daybook().run.status).toBe("awaiting_approval");
  });

  it("gives the same run id for a re-delivered request", () => {
    expect(daybook().run.runId).toBe(daybook().run.runId);
  });

  it("records how the requested time was interpreted", () => {
    const resolved = daybook().run.timeline.find((t) => t.event === "resolved");
    expect(resolved?.detail).toContain("2026年9月30日（水）");
  });

  it("reports honestly when nothing is available", () => {
    const closed = { ...CALENDAR, businessDays: [] };
    const result = runDaybook(request(), {
      mode: "sample",
      calendar: closed,
      bookings: [],
    });
    expect(result.proposals).toHaveLength(0);
    expect(result.warnings.map((w) => w.code)).toContain("no_availability");
    expect(result.run.status).toBe("needs_info");
  });
});

describe("planReschedule — B09/B10 変更は関連記録まで更新する", () => {
  const confirmed = booking({
    bookingId: "b1",
    startIso: at(30, 14),
    status: "CONFIRMED",
  });

  it("moves a booking and stops the reminder tied to the old time — B09", () => {
    const result = planReschedule(
      confirmed,
      at(30, 16),
      CALENDAR,
      [confirmed],
      RECEIVED,
    );
    expect(result.ok).toBe(true);
    expect(result.remindersToStop).toEqual(["reminder:b1"]);
    expect(result.reason).toContain("元の予約はそれまで残します");
  });

  it("does not let a booking collide with itself", () => {
    const result = planReschedule(
      confirmed,
      at(30, 14, 30),
      CALENDAR,
      [confirmed],
      RECEIVED,
    );
    expect(result.ok).toBe(true);
  });

  it("still refuses a move onto someone else's slot", () => {
    const other = booking({ bookingId: "b2", startIso: at(30, 16) });
    const result = planReschedule(
      confirmed,
      at(30, 16),
      CALENDAR,
      [confirmed, other],
      RECEIVED,
    );
    expect(result.ok).toBe(false);
  });

  it("refuses to touch a booking this service did not create — B10", () => {
    const external = booking({
      bookingId: "ext-1",
      startIso: at(30, 14),
      managedByUs: false,
    });
    const result = planReschedule(
      external,
      at(30, 16),
      CALENDAR,
      [external],
      RECEIVED,
    );
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("管理対象ではありません");
  });

  it("refuses to reschedule a cancelled booking", () => {
    const cancelled = { ...confirmed, status: "CANCELLED" as const };
    expect(
      planReschedule(cancelled, at(30, 16), CALENDAR, [], RECEIVED).ok,
    ).toBe(false);
  });
});

describe("run store — O01/O02 ブラウザを閉じてもジョブが残る", () => {
  it("restores a run after it was stored", async () => {
    const store = new MemoryRunStore();
    const { run } = daybook();
    await store.put(run);
    const restored = await store.get("t1", run.runId);
    expect(restored?.runId).toBe(run.runId);
    expect(restored?.plan?.actions).toHaveLength(3);
  });

  it("keeps runs of different tenants apart — S06", async () => {
    const store = new MemoryRunStore();
    const { run } = daybook();
    await store.put(run);
    expect(await store.get("t2", run.runId)).toBeNull();
    expect(await store.list("t2")).toHaveLength(0);
  });

  it("appends effects and recomputes the status", async () => {
    const store = new MemoryRunStore();
    const { run } = daybook();
    await store.put(run);
    const updated = await store.appendEffects(
      "t1",
      run.runId,
      [
        {
          actionId: "propose",
          kind: "reply.draft",
          idempotencyKey: "k1",
          status: "succeeded",
          detail: "下書きを作成しました。",
          at: RECEIVED,
        },
      ],
      "completed",
      RECEIVED,
    );
    expect(updated?.effects).toHaveLength(1);
    expect(updated?.status).toBe("completed");
    expect(updated?.timeline.at(-1)?.detail).toContain("実行済み 1 件");
  });

  it("does not duplicate an effect when the same round is replayed — O03", async () => {
    const store = new MemoryRunStore();
    const { run } = daybook();
    await store.put(run);
    const effect = {
      actionId: "propose",
      kind: "reply.draft" as const,
      idempotencyKey: "k1",
      status: "succeeded" as const,
      detail: "下書きを作成しました。",
      at: RECEIVED,
    };
    await store.appendEffects("t1", run.runId, [effect], "completed", RECEIVED);
    const again = await store.appendEffects(
      "t1",
      run.runId,
      [effect],
      "completed",
      RECEIVED,
    );
    expect(again?.effects).toHaveLength(1);
  });
});

describe("budget — O05/O06/O08 上限と緊急停止", () => {
  const always = async () => true;
  const never = async () => false;
  const scope = { tenantId: "t1", runId: "r1" };

  it("allows a call inside every ceiling", async () => {
    expect((await checkBudget(scope, { quota: always })).allowed).toBe(true);
  });

  it("stops immediately when the kill switch is on — O08", async () => {
    const decision = await checkBudget(scope, {
      quota: always,
      killSwitch: true,
    });
    expect(decision.allowed).toBe(false);
    expect(decision.code).toBe("KILL_SWITCH");
  });

  it("names the per-run ceiling that stopped it — O06", async () => {
    const decision = await checkBudget(scope, {
      quota: async (key) => !key.startsWith("ai-run:"),
    });
    expect(decision.code).toBe("BUDGET_EXHAUSTED");
    expect(decision.limit).toBe("perRun");
  });

  it("reports a monthly ceiling separately from a daily one", async () => {
    const decision = await checkBudget(scope, {
      quota: async (key) => !key.startsWith("ai-month:"),
    });
    expect(decision.limit).toBe("perMonth");
    expect(decision.message).toContain("今月");
  });

  it("refuses to spend when the counter cannot be read", async () => {
    const decision = await checkBudget(scope, {
      quota: async () => {
        throw new Error("unavailable");
      },
    });
    expect(decision.allowed).toBe(false);
    expect(decision.code).toBe("RATE_LIMITED");
  });

  it("reports exhaustion rather than looping", async () => {
    expect((await checkBudget(scope, { quota: never })).allowed).toBe(false);
  });

  it("bounds retries — O05", () => {
    expect(retryDelayMs(0)).toBeGreaterThan(0);
    expect(retryDelayMs(1)).toBeGreaterThan(0);
    expect(retryDelayMs(2)).toBeNull();
  });
});

describe("要確認の扱い — 候補が出せる場合は保留にしない", () => {
  it("keeps a conflicting request open for approval when alternatives exist", () => {
    const taken = [booking({ bookingId: "b1", startIso: at(30, 14) })];
    const result = daybook(request(), taken);
    // The conflict is shown, but it explains the proposal rather than blocking.
    expect(result.run.status).toBe("awaiting_approval");
    expect(
      result.warnings.find((w) => w.code === "slot_conflict")?.severity,
    ).toBe("advisory");
  });

  it("still holds the run when the message itself is ambiguous", () => {
    const result = daybook(request({ text: "水曜の14時でお願いします" }));
    expect(result.run.status).toBe("needs_info");
    expect(
      result.warnings.find((w) => w.code === "weekday_only")?.severity,
    ).toBe("blocking");
  });
});
