import { payloadHashOf } from "../approval";
import { hash, idempotencyKey, runId as makeRunId } from "../ids";
import {
  checkSlot,
  proposeSlots,
  releaseExpiredHolds,
  type Booking,
  type ResourceCalendar,
  type SlotVerdict,
} from "../rules/availability";
import {
  formatJst,
  fromJst,
  resolveJapaneseDateTime,
  type TimeHint,
} from "../rules/datetime";
import type {
  ActionPlan,
  ExecutionMode,
  MissingField,
  PlannedAction,
  Run,
  Warning,
} from "../types";

/**
 * DAYBOOK (指示書 §08).
 *
 * The subject is not "create an event", it is "answer a booking request". The
 * calendar view is a confirmation aid; the work is: read what was asked,
 * resolve it against real business rules, offer times that are actually free,
 * and never treat an offer as an agreement.
 *
 * Scope is one location and one resource on purpose (指示書 P2).
 */

export const DAYBOOK_POLICY_VERSION = "daybook-2026.09.22";

export type BookingRequest = {
  requestId: string;
  tenantId: string;
  receivedAtIso: string;
  requesterName: string;
  requesterEmail: string;
  text: string;
  /** An existing booking this message is about, for reschedules. */
  existingBookingId?: string;
};

export type DaybookResult = {
  run: Run;
  plan: ActionPlan;
  proposals: SlotVerdict[];
  /** The exact slot asked for, when one could be resolved. */
  requested: SlotVerdict | null;
  missing: MissingField[];
  warnings: Warning[];
  payloads: Record<string, unknown>;
  /** Holds released while handling this request, for the timeline. */
  releasedHolds: string[];
};

export function runDaybook(
  request: BookingRequest,
  options: {
    mode: ExecutionMode;
    calendar: ResourceCalendar;
    bookings: readonly Booking[];
    holdMinutes?: number;
    nowIso?: string;
  },
): DaybookResult {
  const nowIso = options.nowIso ?? request.receivedAtIso;
  const warnings: Warning[] = [];

  // Expired holds are released before anything is offered, so a slot someone
  // abandoned is offered again rather than kept hostage (指示書 B08).
  const swept = releaseExpiredHolds([...options.bookings], nowIso);
  const bookings = swept.bookings;

  const resolution = resolveJapaneseDateTime(
    request.text,
    request.receivedAtIso,
  );
  warnings.push(...resolution.warnings);
  const missing: MissingField[] = [...resolution.missing];

  let requested: SlotVerdict | null = null;
  let preferredMinute: number | null = null;
  let window: [number, number] | null = null;

  if (resolution.time.kind === "point")
    preferredMinute = resolution.time.minuteOfDay;
  else if (resolution.time.kind === "range") {
    window = [resolution.time.fromMinute, resolution.time.toMinute];
    preferredMinute = resolution.time.fromMinute;
    warnings.push({
      code: "time_is_range",
      message: `「${resolution.time.label}」は時間帯の指定です。確定の前に開始時刻の合意が必要です。`,
      severity: "blocking",
    });
  }

  const blocking = warnings.some((w) => w.severity === "blocking");

  if (resolution.date && resolution.time.kind === "point") {
    const startIso = fromJst({
      year: resolution.date.year,
      month: resolution.date.month,
      day: resolution.date.day,
      hour: Math.floor(resolution.time.minuteOfDay / 60),
      minute: resolution.time.minuteOfDay % 60,
    });
    requested = checkSlot(startIso, options.calendar, bookings, nowIso);
    // The requested slot being unavailable is normal, not an error: it is the
    // reason alternatives exist. These warnings explain the proposal, so they
    // travel with it as advisory and do not by themselves hold the run.
    warnings.push(
      ...requested.warnings.map((w) => ({
        ...w,
        severity: "advisory" as const,
      })),
    );
  }

  const searchFrom = resolution.date
    ? fromJst({
        year: resolution.date.year,
        month: resolution.date.month,
        day: resolution.date.day,
      })
    : nowIso;

  const proposals =
    requested?.ok === true
      ? [requested]
      : proposeSlots(
          {
            fromDateIso: searchFrom,
            preferredMinuteOfDay: preferredMinute,
            windowMinutes: window,
          },
          options.calendar,
          bookings,
          nowIso,
        );

  if (!proposals.length)
    warnings.push({
      code: "no_availability",
      message:
        "営業日・準備時間・既存予定を踏まえた空き枠が見つかりませんでした。",
      severity: "blocking",
    });

  const runIdValue = makeRunId("daybook", {
    tenantId: request.tenantId,
    requestId: request.requestId,
  });

  const proposalPayload = {
    requesterEmail: request.requesterEmail,
    options: proposals.map((p) => ({
      startIso: p.startIso,
      endIso: p.endIso,
      label: formatJst(p.startIso),
    })),
    serviceMinutes: options.calendar.serviceMinutes,
    bufferBeforeMinutes: options.calendar.bufferBeforeMinutes,
    bufferAfterMinutes: options.calendar.bufferAfterMinutes,
  };

  const holdMinutes = options.holdMinutes ?? 60;
  const holdPayload = {
    resourceId: options.calendar.resourceId,
    // Only the first proposal is held. Holding every option would block the
    // whole day for one undecided request (指示書 §08-3).
    startIso: proposals[0]?.startIso ?? null,
    holdExpiresAt: proposals[0]
      ? new Date(Date.parse(nowIso) + holdMinutes * 60_000).toISOString()
      : null,
  };

  const actions: PlannedAction[] = [
    action({
      tenantId: request.tenantId,
      runId: runIdValue,
      id: "propose",
      kind: "reply.draft",
      targetRef: `internal:draft/${request.requestId}`,
      payload: proposalPayload,
      summary: `候補 ${proposals.length} 件のご案内文を作成します（送信しません）。`,
    }),
    action({
      tenantId: request.tenantId,
      runId: runIdValue,
      id: "hold",
      kind: "calendar.hold",
      targetRef: `calendar:${options.calendar.resourceId}`,
      payload: holdPayload,
      summary: holdPayload.startIso
        ? `第一候補を ${holdMinutes} 分間だけ仮保持します。`
        : "候補がないため仮保持しません。",
    }),
    action({
      tenantId: request.tenantId,
      runId: runIdValue,
      id: "confirm",
      kind: "calendar.confirm",
      targetRef: `calendar:${options.calendar.resourceId}`,
      payload: holdPayload,
      summary:
        "予約者の日程合意と管理者の承認が揃った後に確定します。提案の承認だけでは確定しません。",
    }),
  ];

  const plan: ActionPlan = {
    tenantId: request.tenantId,
    runId: runIdValue,
    version: 1,
    inputHash: hash({ text: request.text, receivedAt: request.receivedAtIso }),
    policyVersion: DAYBOOK_POLICY_VERSION,
    mode: options.mode,
    evidence: resolution.spans.map((s, i) => ({
      id: `ev-dt-${i}`,
      sourceRef: `booking:${request.requestId}`,
      start: s.start,
      end: s.end,
      quote: s.quote,
    })),
    missingFields: missing,
    warnings,
    actions,
  };

  const run: Run = {
    tenantId: request.tenantId,
    runId: runIdValue,
    mode: options.mode,
    workflow: "daybook",
    status:
      blocking || missing.length || !proposals.length
        ? "needs_info"
        : "awaiting_approval",
    inputSource: options.mode === "sample" ? "sample" : "approved_web_form",
    createdAt: request.receivedAtIso,
    updatedAt: nowIso,
    plan,
    approvals: [],
    effects: [],
    timeline: [
      {
        at: request.receivedAtIso,
        event: "received",
        detail: `予約希望を受け付けました（${request.requestId}）。`,
      },
      ...(swept.released.length
        ? [
            {
              at: nowIso,
              event: "holds_released",
              detail: `期限切れの仮保持 ${swept.released.length} 件を解放しました。`,
            },
          ]
        : []),
      {
        at: nowIso,
        event: "resolved",
        detail: resolution.date
          ? `希望日時を ${formatJst(searchFrom, { withTime: false })} と解釈しました（${describeTime(resolution.time)}）。`
          : "本文から希望日を特定できませんでした。",
      },
      {
        at: nowIso,
        event: "proposed",
        detail: `候補 ${proposals.length} 件を用意しました。`,
      },
    ],
  };

  return {
    run,
    plan,
    proposals,
    requested,
    missing,
    warnings,
    payloads: {
      propose: proposalPayload,
      hold: holdPayload,
      confirm: holdPayload,
    },
    releasedHolds: swept.released,
  };
}

const describeTime = (time: TimeHint) =>
  time.kind === "point"
    ? `${String(Math.floor(time.minuteOfDay / 60)).padStart(2, "0")}:${String(time.minuteOfDay % 60).padStart(2, "0")}${time.approximate ? " ごろ" : ""}`
    : time.kind === "range"
      ? `${time.label}（時間帯）`
      : time.kind === "same_as_previous"
        ? "前回と同じ時間（要特定）"
        : "時刻の記載なし";

function action(opts: {
  tenantId: string;
  runId: string;
  id: string;
  kind: PlannedAction["kind"];
  targetRef: string;
  payload: unknown;
  summary: string;
}): PlannedAction {
  const payloadHash = payloadHashOf(opts.payload);
  return {
    id: opts.id,
    kind: opts.kind,
    targetRef: opts.targetRef,
    payloadHash,
    requiresApproval: opts.kind !== "reply.draft",
    idempotencyKey: idempotencyKey({
      tenantId: opts.tenantId,
      runId: opts.runId,
      actionId: opts.id,
      payloadHash,
    }),
    summary: opts.summary,
  };
}

/**
 * A reschedule (指示書 §08-3).
 *
 * The old booking is kept until the new time is agreed, and the reminders tied
 * to it are stopped as part of the same change rather than left to fire for a
 * time nobody is coming (B09). Bookings this service did not create are never
 * touched (B10).
 */
export function planReschedule(
  booking: Booking,
  newStartIso: string,
  calendar: ResourceCalendar,
  bookings: readonly Booking[],
  nowIso: string,
): {
  ok: boolean;
  reason: string;
  verdict: SlotVerdict | null;
  remindersToStop: string[];
} {
  if (!booking.managedByUs)
    return {
      ok: false,
      reason:
        "この予定は当サービスの管理対象ではありません。変更・削除は行いません。",
      verdict: null,
      remindersToStop: [],
    };
  if (booking.status !== "CONFIRMED" && booking.status !== "RESCHEDULE_PENDING")
    return {
      ok: false,
      reason: `${booking.status} の予約は変更の対象になりません。`,
      verdict: null,
      remindersToStop: [],
    };

  // The booking being moved is excluded from the conflict check: it cannot
  // collide with itself.
  const others = bookings.filter((b) => b.bookingId !== booking.bookingId);
  const verdict = checkSlot(newStartIso, calendar, others, nowIso);

  return {
    ok: verdict.ok,
    reason: verdict.ok
      ? "変更候補を作成しました。予約者の合意後に確定します。元の予約はそれまで残します。"
      : verdict.warnings.map((w) => w.message).join(" "),
    verdict,
    remindersToStop: [`reminder:${booking.bookingId}`],
  };
}

/**
 * Wraps a reschedule as a run so it carries the same four state labels as
 * every other step (指示書 §06). A change request that displayed no input
 * source or external-effect status would be the one screen where "what
 * actually happened" went unstated.
 */
export function rescheduleRun(opts: {
  tenantId: string;
  requestId: string;
  atIso: string;
  mode: ExecutionMode;
  bookingId: string;
  fromIso: string;
  toIso: string;
  ok: boolean;
  reason: string;
  remindersToStop: readonly string[];
  warnings: readonly Warning[];
}): { run: Run; plan: ActionPlan } {
  const runIdValue = makeRunId("daybook", {
    tenantId: opts.tenantId,
    requestId: opts.requestId,
  });

  const payload = {
    bookingId: opts.bookingId,
    fromIso: opts.fromIso,
    toIso: opts.toIso,
    remindersToStop: [...opts.remindersToStop],
  };

  const actions: PlannedAction[] = opts.ok
    ? [
        action({
          tenantId: opts.tenantId,
          runId: runIdValue,
          id: "reschedule-propose",
          kind: "reply.draft",
          targetRef: `internal:draft/${opts.requestId}`,
          payload,
          summary: "変更候補のご案内文を作成します（送信しません）。",
        }),
        action({
          tenantId: opts.tenantId,
          runId: runIdValue,
          id: "reschedule-apply",
          kind: "calendar.update",
          targetRef: `calendar:${opts.bookingId}`,
          payload,
          summary:
            "予約者の合意後に、予定と旧リマインドをまとめて更新します。合意前に元の予約は消しません。",
        }),
      ]
    : [];

  const plan: ActionPlan = {
    tenantId: opts.tenantId,
    runId: runIdValue,
    version: 1,
    inputHash: hash(payload),
    policyVersion: DAYBOOK_POLICY_VERSION,
    mode: opts.mode,
    evidence: [],
    missingFields: [],
    warnings: [...opts.warnings],
    actions,
  };

  return {
    run: {
      tenantId: opts.tenantId,
      runId: runIdValue,
      mode: opts.mode,
      workflow: "daybook",
      status: opts.ok ? "awaiting_approval" : "needs_info",
      inputSource: opts.mode === "sample" ? "sample" : "approved_web_form",
      createdAt: opts.atIso,
      updatedAt: opts.atIso,
      plan,
      approvals: [],
      effects: [],
      timeline: [
        {
          at: opts.atIso,
          event: "received",
          detail: `確定済み予約 ${opts.bookingId} の変更依頼を受け付けました。`,
        },
        {
          at: opts.atIso,
          event: "checked",
          detail: `${formatJst(opts.fromIso)} → ${formatJst(opts.toIso)}：${opts.reason}`,
        },
        ...(opts.remindersToStop.length
          ? [
              {
                at: opts.atIso,
                event: "reminders",
                detail: `変更に伴い停止する旧リマインド：${opts.remindersToStop.join("、")}`,
              },
            ]
          : []),
      ],
    },
    plan,
  };
}
