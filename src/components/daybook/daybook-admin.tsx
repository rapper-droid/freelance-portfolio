"use client";

import { formatJst } from "@/lib/runtime/rules/datetime";
import {
  blockedInterval,
  type Booking,
} from "@/lib/runtime/rules/availability";
import { DAYBOOK_POLICY_VERSION } from "@/lib/runtime/daybook/workflow";
import { STUDIO } from "@/lib/daybook/seed";
import type { RequestRecord } from "@/lib/daybook/store";
import { useDaybook } from "./daybook-provider";
import { RequestTimeline } from "./request-timeline";

/**
 * The operator's side (指示書 §14, B05 / B09 / B10).
 *
 * Three things an operator needs that a calendar grid does not give them:
 *
 *   What am I being asked to decide, and what is still missing before I can.
 *   The two signatures are shown as two facts with times, not as one enabled
 *   button, and approving without the requester's agreement is refused *and
 *   recorded* rather than prevented by greying it out.
 *
 *   What exactly changes if I approve. For a move that is the old time and
 *   the new one side by side — not the whole booking again.
 *
 *   What is on this resource that is not mine. The entries this service did
 *   not create are listed, block time like any other, and carry no buttons.
 */

const span = (booking: Booking) => {
  const { startMs, endMs } = blockedInterval(booking);
  return `${formatJst(new Date(startMs).toISOString()).slice(-5)}–${formatJst(
    new Date(endMs).toISOString(),
  ).slice(-5)}`;
};

const OPEN_STATES = new Set(["HELD", "CONFIRMED", "RESCHEDULE_PENDING"]);

function Signature({ label, at }: { label: string; at: string | null }) {
  return (
    <li className={at ? "is-signed" : "is-missing"}>
      <span className="daybook-sig-label">{label}</span>
      <span className="daybook-sig-value">
        {at ? formatJst(at) : "まだ記録されていません"}
      </span>
    </li>
  );
}

export function DaybookAdmin() {
  const daybook = useDaybook();

  if (!daybook.ready)
    return (
      <div className="daybook-panel daybook-placeholder" aria-busy="true">
        <p>予約台帳を読み込んでいます。</p>
      </div>
    );

  const live = daybook.bookings
    .filter((b) => OPEN_STATES.has(b.status))
    .slice()
    .sort((a, b) => Date.parse(a.startIso) - Date.parse(b.startIso));

  const days: Array<{ key: string; bookings: Booking[] }> = [];
  for (const booking of live) {
    const key = formatJst(booking.startIso, { withTime: false });
    const found = days.find((d) => d.key === key);
    if (found) found.bookings.push(booking);
    else days.push({ key, bookings: [booking] });
  }

  // Anything held or waiting on a move. A confirmed booking with nothing
  // pending needs no decision, and a cancelled one never will again.
  const waiting = daybook.state.requests.filter((record) => {
    const booking = daybook.bookingOf(record);
    return (
      booking &&
      booking.status !== "CANCELLED" &&
      booking.status !== "CONFIRMED"
    );
  });
  // Changes first: somebody is already holding a slot they want to give up.
  const decisions: RequestRecord[] = [
    ...waiting.filter((r) => r.moveToIso),
    ...waiting.filter((r) => !r.moveToIso),
  ];

  return (
    <div className="daybook-desk">
      {daybook.notice ? (
        <p className="daybook-notice" role="status">
          {daybook.notice}{" "}
          <button
            type="button"
            className="daybook-link"
            onClick={daybook.dismissNotice}
          >
            閉じる
          </button>
        </p>
      ) : null}

      <section className="daybook-panel" aria-labelledby="daybook-decide">
        <h2 id="daybook-decide">承認が要るもの</h2>
        {decisions.length === 0 ? (
          <p className="daybook-empty">
            {
              "いま判断が要るものはありません。お客さま側の画面から相談を送ると、ここに届きます。"
            }
          </p>
        ) : (
          <ul className="daybook-records">
            {decisions.map((record) => {
              const booking = daybook.bookingOf(record);
              if (!booking) return null;
              const ready = Boolean(record.requesterAgreedAt);
              return (
                <li key={record.requestId} className="daybook-record">
                  <div className="daybook-record-head">
                    <div>
                      <p className="daybook-record-id">
                        {record.requestId} ・ {record.requesterName}
                      </p>
                      <p className="daybook-record-when">
                        {record.moveToIso ? (
                          <>
                            <s>{formatJst(booking.startIso)}</s>{" "}
                            <span aria-hidden="true">→</span>{" "}
                            <strong>{formatJst(record.moveToIso)}</strong>
                          </>
                        ) : (
                          formatJst(booking.startIso)
                        )}
                      </p>
                    </div>
                    <span
                      className={`daybook-badge is-${record.moveToIso ? "wait" : ready ? "wait" : "hold"}`}
                    >
                      {record.moveToIso
                        ? "変更の承認待ち"
                        : ready
                          ? "承認待ち"
                          : "合意待ち"}
                    </span>
                  </div>

                  {record.moveToIso ? (
                    <p className="daybook-fineprint">
                      {
                        "変わるのは日時だけです。承認するまで元の枠は押さえたままなので、承認しなければ予約は元のまま残ります。"
                      }
                    </p>
                  ) : null}

                  <ul className="daybook-signatures">
                    <Signature
                      label="予約者の合意"
                      at={record.requesterAgreedAt}
                    />
                    <Signature label="お店の承認" at={record.adminApprovedAt} />
                  </ul>

                  <div className="daybook-actions">
                    <button
                      type="button"
                      className="daybook-button"
                      onClick={() => daybook.approve(record.requestId)}
                    >
                      {record.moveToIso
                        ? "変更を承認して確定する"
                        : "承認して確定する"}
                    </button>
                    <button
                      type="button"
                      className="daybook-link"
                      onClick={() => daybook.cancel(record.requestId)}
                    >
                      この予約を取り消す
                    </button>
                  </div>
                  {!ready ? (
                    <p className="daybook-fineprint">
                      {
                        "予約者の合意がまだ記録されていないため、いま承認しても確定しません。押すと、確定できなかった理由が記録に残ります。"
                      }
                    </p>
                  ) : null}

                  <RequestTimeline record={record} />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="daybook-panel" aria-labelledby="daybook-calendar">
        <h2 id="daybook-calendar">{STUDIO.label}の予定</h2>
        <p className="daybook-lede">
          {
            "表示しているのは、前後の準備・片付けを含めて実際に埋まる時間です。1件60分の予約でも、台帳では90分が埋まります。"
          }
        </p>
        {days.length === 0 ? (
          <p className="daybook-empty">先の予定はありません。</p>
        ) : (
          <div className="daybook-calendar">
            {days.map((day) => (
              <div key={day.key} className="daybook-day">
                <h3>{day.key}</h3>
                <ul>
                  {day.bookings.map((booking) => (
                    <li
                      key={booking.bookingId}
                      className={
                        booking.managedByUs
                          ? "daybook-entry"
                          : "daybook-entry is-external"
                      }
                    >
                      <span className="daybook-entry-time">
                        {span(booking)}
                      </span>
                      <span className="daybook-entry-id">
                        {booking.bookingId}
                      </span>
                      <span className="daybook-entry-note">
                        {booking.managedByUs
                          ? booking.status === "HELD"
                            ? "仮押さえ"
                            : booking.status === "RESCHEDULE_PENDING"
                              ? "変更の承認待ち（この枠は押さえたまま）"
                              : "確定"
                          : "他システムの予定 — 読むだけで、変更も削除もしません"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="daybook-panel" aria-labelledby="daybook-rules">
        <h2 id="daybook-rules">この画面が守っている決まり</h2>
        <ul className="daybook-rules">
          <li>
            <strong>確定には2つの記録が要る。</strong>
            {
              "予約者の合意とお店の承認は別の事実として保存します。片方だけでは確定せず、断られた理由が記録に残ります。"
            }
          </li>
          <li>
            <strong>変更は、合意するまで元を消さない。</strong>
            {
              "変更の承認待ちの間も元の枠は押さえたままです。返事が来なければ、予約は元のまま残ります。"
            }
          </li>
          <li>
            <strong>仮押さえは期限で解放される。</strong>
            {
              "合意のないまま期限が過ぎた枠は、次に画面を開いたときに自動で空きに戻ります。"
            }
          </li>
          <li>
            <strong>自分が作っていない予定は触らない。</strong>
            {
              "他システムから来た予定は空き判定には使いますが、変更・削除の対象にしません。"
            }
          </li>
        </ul>
        <p className="daybook-fineprint">
          判定に使っている規則の版：<code>{DAYBOOK_POLICY_VERSION}</code>
        </p>
      </section>
    </div>
  );
}
