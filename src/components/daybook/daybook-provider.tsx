"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { runDaybook, planReschedule } from "@/lib/runtime/daybook/workflow";
import {
  checkSlot,
  confirmBooking,
  proposeSlots,
  releaseExpiredHolds,
  type Booking,
  type ResourceCalendar,
  type SlotVerdict,
} from "@/lib/runtime/rules/availability";
import { hash } from "@/lib/runtime/ids";
import { STUDIO, seedBookings } from "@/lib/daybook/seed";
import {
  exportDaybookState,
  importDaybookState,
  loadDaybookState,
  emptyDaybookState,
  resetDaybookState,
  saveDaybookState,
  type DaybookState,
  type RequestRecord,
} from "@/lib/daybook/store";

/**
 * DAYBOOK's state (指示書 §14).
 *
 * The domain underneath — business hours, buffers, conflicts, alternatives,
 * holds that expire, and a confirmation that needs two separate signatures —
 * was already written and tested. It had no way to keep a booking between two
 * page loads, so the demo could only ever show the first half of the story.
 * This is the half it could not show: the slot you want is taken, you take an
 * alternative, and next week you ask to move it.
 *
 * Two rules are load-bearing and are enforced here rather than described:
 *
 *   A booking is confirmed only when the requester has agreed *and* the
 *   operator has approved. Either alone is refused, and the refusal is
 *   recorded, because a greyed-out button does not prove a guard exists.
 *
 *   A change does not release the old slot until the new time is approved.
 *   Somebody who asks to move an appointment and then goes quiet still has
 *   their appointment.
 */

const HOLD_MINUTES = 10;
const MAX_REQUESTS = 30;

export type DaybookContextValue = {
  ready: boolean;
  notice: string;
  state: DaybookState;
  calendar: ResourceCalendar;
  /** Everything on the resource, including entries we do not manage. */
  bookings: Booking[];
  bookingOf: (record: RequestRecord) => Booking | null;
  /** Free slots near a time, for the change form and the admin's view. */
  alternatives: (fromIso: string, exceptBookingId?: string) => SlotVerdict[];

  submit: (input: { name: string; email: string; text: string }) => string;
  hold: (requestId: string, startIso: string) => void;
  agree: (requestId: string) => void;
  approve: (requestId: string) => void;
  askToMove: (requestId: string, newStartIso: string) => void;
  cancel: (requestId: string) => void;
  dismissNotice: () => void;

  exportData: () => string;
  importData: (text: string) => string | null;
  reset: () => void;
};

const DaybookContext = createContext<DaybookContextValue | null>(null);

export function useDaybook() {
  const value = useContext(DaybookContext);
  if (!value)
    throw new Error("useDaybook は DaybookProvider の中でのみ使えます");
  return value;
}

const noted = (
  record: RequestRecord,
  event: string,
  detail: string,
): RequestRecord => ({
  ...record,
  timeline: [
    ...record.timeline,
    { at: new Date().toISOString(), event, detail },
  ],
});

export function DaybookProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DaybookState>(() =>
    emptyDaybookState("1970-01-01T00:00:00.000Z", "pending"),
  );
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const loadedOnce = useRef(false);
  // Sequential mutations in one interaction must see each other, which a
  // state variable captured by a closure would not.
  const live = useRef(state);

  const commit = useCallback((next: DaybookState) => {
    const stamped = { ...next, updatedAtIso: new Date().toISOString() };
    live.current = stamped;
    setState(stamped);
    if (!saveDaybookState(stamped))
      setNotice(
        "このブラウザでは保存できないため、タブを閉じると内容は消えます。操作そのものは続けられます。",
      );
    return stamped;
  }, []);

  useEffect(() => {
    if (loadedOnce.current) return;
    loadedOnce.current = true;
    const now = new Date().toISOString();
    const { state: stored, note } = loadDaybookState(now);
    // A first visit starts where a real calendar does: partly taken. The
    // seed is placed relative to today, never on a fixed date.
    const seeded =
      stored.bookings.length === 0 && stored.requests.length === 0
        ? { ...stored, bookings: seedBookings(now) }
        : stored;
    // Abandoned holds are released on read, so a slot nobody confirmed is
    // offered again instead of being kept hostage.
    const swept = releaseExpiredHolds([...seeded.bookings], now);
    const next = { ...seeded, bookings: swept.bookings };
    live.current = next;
    setState(next);
    setNotice(
      note ??
        (swept.released.length
          ? `期限切れの仮押さえ ${swept.released.length} 件を解放しました。`
          : ""),
    );
    setReady(true);
  }, []);

  const value = useMemo<DaybookContextValue>(() => {
    const now = () => new Date().toISOString();

    /** Replaces one request and, when given, one booking, in a single write. */
    const put = (record: RequestRecord, booking?: Booking) => {
      const current = live.current;
      const requests = [
        record,
        ...current.requests.filter((r) => r.requestId !== record.requestId),
      ].slice(0, MAX_REQUESTS);
      commit({
        ...current,
        requests,
        bookings: booking
          ? [
              booking,
              ...current.bookings.filter(
                (b) => b.bookingId !== booking.bookingId,
              ),
            ]
          : current.bookings,
      });
    };

    const find = (requestId: string) => {
      const record = live.current.requests.find(
        (r) => r.requestId === requestId,
      );
      if (!record) return null;
      const booking =
        live.current.bookings.find((b) => b.bookingId === record.bookingId) ??
        null;
      return { record, booking };
    };

    return {
      ready,
      notice,
      state,
      calendar: STUDIO,
      bookings: state.bookings,
      bookingOf: (record) =>
        state.bookings.find((b) => b.bookingId === record.bookingId) ?? null,
      alternatives: (fromIso, exceptBookingId) =>
        proposeSlots(
          { fromDateIso: fromIso, preferredMinuteOfDay: null, limit: 8 },
          STUDIO,
          exceptBookingId
            ? state.bookings.filter((b) => b.bookingId !== exceptBookingId)
            : state.bookings,
          new Date().toISOString(),
        ),

      submit: ({ name, email, text }) => {
        const at = now();
        const requestId =
          "REQ-" +
          hash({ text, at, n: live.current.requests.length })
            .slice(0, 6)
            .toUpperCase();
        const result = runDaybook(
          {
            requestId,
            tenantId: "demo-studio",
            receivedAtIso: at,
            requesterName: name,
            requesterEmail: email,
            text,
          },
          {
            mode: "sample",
            calendar: STUDIO,
            bookings: live.current.bookings,
            holdMinutes: HOLD_MINUTES,
            nowIso: at,
          },
        );

        const detail = !result.requested
          ? `文面から日時を特定できませんでした（${result.missing.map((m) => m.label).join("・") || "日付と時刻"}）。近い候補を出しています。`
          : result.requested.ok
            ? "希望の日時は空いています。仮押さえに進めます。"
            : `希望の日時は取れません：${result.requested.warnings[0]?.message ?? "先約があります。"}`;

        put({
          requestId,
          requesterName: name,
          requesterEmail: email,
          text,
          receivedAtIso: at,
          requestedIso: result.requested?.startIso ?? null,
          proposals: result.proposals,
          bookingId: null,
          requesterAgreedAt: null,
          adminApprovedAt: null,
          moveToIso: null,
          timeline: [{ at, event: "受付", detail }],
        });
        setNotice("");
        return requestId;
      },

      hold: (requestId, startIso) => {
        const found = find(requestId);
        if (!found) return;
        const { record } = found;
        // Re-checked at the last moment rather than trusted from the page
        // that offered it: something may have been taken in between.
        const verdict = checkSlot(
          startIso,
          STUDIO,
          live.current.bookings.filter((b) => b.bookingId !== record.bookingId),
          now(),
        );
        if (!verdict.ok) {
          put(
            noted(
              record,
              "仮押さえできず",
              verdict.warnings[0]?.message ?? "この枠はいま取れません。",
            ),
          );
          setNotice(
            "選んだ枠は、いま取れなくなっていました。別の候補を選んでください。",
          );
          return;
        }

        const bookingId =
          record.bookingId ??
          "BK-" + hash({ requestId, startIso }).slice(0, 4).toUpperCase();
        const booking: Booking = {
          bookingId,
          resourceId: STUDIO.resourceId,
          startIso,
          serviceMinutes: STUDIO.serviceMinutes,
          bufferBeforeMinutes: STUDIO.bufferBeforeMinutes,
          bufferAfterMinutes: STUDIO.bufferAfterMinutes,
          status: "HELD",
          holdExpiresAt: new Date(
            Date.now() + HOLD_MINUTES * 60_000,
          ).toISOString(),
          managedByUs: true,
        };
        put(
          noted(
            {
              ...record,
              bookingId,
              requesterAgreedAt: null,
              adminApprovedAt: null,
              moveToIso: null,
            },
            "仮押さえ",
            `${HOLD_MINUTES} 分間お取り置きしました。合意がないまま期限が過ぎると自動で解放されます。`,
          ),
          booking,
        );
        setNotice("");
      },

      agree: (requestId) => {
        const found = find(requestId);
        if (!found) return;
        put(
          noted(
            { ...found.record, requesterAgreedAt: now() },
            "予約者が合意",
            "この日時で進めることに同意しました。確定にはお店の承認が要ります。",
          ),
        );
        setNotice("");
      },

      approve: (requestId) => {
        const found = find(requestId);
        if (!found?.booking) return;
        const { record, booking } = found;
        const at = now();

        // A move is approved against the *new* time, and that time is
        // re-checked now — the slot was only proposed, never held.
        const target = record.moveToIso ?? booking.startIso;
        if (record.moveToIso) {
          const verdict = checkSlot(
            record.moveToIso,
            STUDIO,
            live.current.bookings.filter(
              (b) => b.bookingId !== booking.bookingId,
            ),
            at,
          );
          if (!verdict.ok) {
            put(
              noted(
                record,
                "変更を確定できず",
                `${verdict.warnings[0]?.message ?? "移動先が埋まりました。"} 元の予約はそのまま残っています。`,
              ),
            );
            setNotice(
              "移動先の枠が埋まったため確定できませんでした。元の予約は残っています。",
            );
            return;
          }
        }

        const result = confirmBooking(booking, {
          requesterAgreedAt: record.requesterAgreedAt ?? undefined,
          adminApprovedAt: at,
        });
        if (!result.ok) {
          // Recorded, not hidden: the refusal is the proof the rule is real.
          put(noted(record, "確定できず", result.reason ?? ""));
          setNotice(result.reason ?? "確定できませんでした。");
          return;
        }

        // Only now does the old slot go. Until this line ran, it was blocked.
        const from = record.moveToIso ? booking.startIso : null;
        put(
          noted(
            { ...record, adminApprovedAt: at, moveToIso: null },
            "確定",
            from
              ? "変更を承認しました。元の枠はこの時点で解放されました。"
              : "予約者の合意とお店の承認がそろったため確定しました。",
          ),
          {
            ...result.booking,
            startIso: target,
            holdExpiresAt: undefined,
          },
        );
        setNotice("");
      },

      askToMove: (requestId, newStartIso) => {
        const found = find(requestId);
        if (!found?.booking) return;
        const { record, booking } = found;
        const plan = planReschedule(
          booking,
          newStartIso,
          STUDIO,
          live.current.bookings,
          now(),
        );
        if (!plan.ok) {
          put(noted(record, "変更できず", plan.reason));
          setNotice(plan.reason);
          return;
        }

        // The booking keeps its original start. RESCHEDULE_PENDING still
        // occupies the resource, so the old slot stays blocked.
        put(
          noted(
            {
              ...record,
              moveToIso: newStartIso,
              requesterAgreedAt: now(),
              adminApprovedAt: null,
            },
            "変更を希望",
            `${plan.reason} 停止する通知：${plan.remindersToStop.join("・")}`,
          ),
          { ...booking, status: "RESCHEDULE_PENDING" },
        );
        setNotice("");
      },

      cancel: (requestId) => {
        const found = find(requestId);
        if (!found?.booking) return;
        put(
          noted(
            { ...found.record, moveToIso: null },
            "取消",
            "予約を取り消しました。枠は解放されました。",
          ),
          { ...found.booking, status: "CANCELLED" },
        );
        setNotice("");
      },

      dismissNotice: () => setNotice(""),

      exportData: () => exportDaybookState(live.current),
      importData: (text) => {
        const result = importDaybookState(text, now());
        if (!result.ok) return result.reason;
        commit(result.state);
        setNotice(result.note ?? "保存していた予約データを読み込みました。");
        return null;
      },
      reset: () => {
        const at = now();
        const fresh = { ...resetDaybookState(at), bookings: seedBookings(at) };
        commit(fresh);
        setNotice("この端末の予約データを初期状態に戻しました。");
      },
    };
  }, [ready, notice, state, commit]);

  return (
    <DaybookContext.Provider value={value}>{children}</DaybookContext.Provider>
  );
}
