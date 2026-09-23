"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useShop } from "./shop-provider";
import { HOURS, seatById } from "@/lib/shop/catalog";
import { ORDER_STATUS_LABELS, PAYMENT_LABELS } from "@/lib/shop/order";
import {
  MAX_PARTY,
  RESERVATION_STATUS_LABELS,
  reservationSlots,
  seatOptions,
} from "@/lib/shop/reservation";
import { formatJst, toJst } from "@/lib/runtime/rules/datetime";
import { formatMoney } from "@/lib/runtime/rules/money";
import type { Order, Reservation } from "@/lib/shop/types";

/**
 * What this visitor has going on (指示書 §11, §12, §13).
 *
 * Both halves of the shop in one place, because a guest who booked a table and
 * also ordered a cake to collect should not have to remember which screen each
 * one lives on.
 *
 * Changing a booking here uses the same availability rules the booking form
 * does, so a move that would double-book a table is refused with the reason —
 * and the original booking is kept, not dropped in favour of nothing.
 */

const dayOptions = (nowIso: string, count = 14) => {
  const now = toJst(nowIso);
  const out: Array<{ iso: string; key: string; label: string; open: boolean }> =
    [];
  for (let offset = 0; offset < count; offset++) {
    const date = new Date(
      Date.UTC(now.year, now.month - 1, now.day) + offset * 86_400_000,
    );
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth() + 1;
    const d = date.getUTCDate();
    const key = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const weekday = date.getUTCDay();
    out.push({
      iso: new Date(Date.UTC(y, m - 1, d) - 9 * 3600_000).toISOString(),
      key,
      label: `${m}/${d}（${["日", "月", "火", "水", "木", "金", "土"][weekday]}）`,
      open:
        HOURS.businessDays.includes(weekday) &&
        !HOURS.closedDates.includes(key),
    });
  }
  return out;
};

function OrderCard({ order }: { order: Order }) {
  const { advance } = useShop();
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const cancellable = order.status === "placed" || order.status === "preparing";

  return (
    <li className="kissa-record" data-status={order.status}>
      <div className="kissa-record-head">
        <div>
          <span className="kissa-reference">{order.reference}</span>
          <p>{formatJst(order.pickupAtIso)} お受け取り</p>
        </div>
        <span className="kissa-badge" data-state={order.status}>
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </div>

      <ul className="kissa-confirm-lines">
        {order.lines.map((line) => (
          <li key={line.lineId}>
            {line.productName}
            {line.variantLabels.length > 0 && (
              <small>（{line.variantLabels.join("・")}）</small>
            )}
            <span>× {line.quantity}</span>
          </li>
        ))}
      </ul>

      <dl className="kissa-summary">
        <div>
          <dt>合計</dt>
          <dd>{formatMoney(order.total)}</dd>
        </div>
        <div>
          <dt>支払</dt>
          <dd>{PAYMENT_LABELS[order.payment]}</dd>
        </div>
      </dl>

      {order.note && <p className="kissa-fineprint">ご要望：{order.note}</p>}

      {error && (
        <p className="kissa-error" role="alert">
          {error}
        </p>
      )}

      <div className="kissa-detail-actions">
        <button
          type="button"
          className="kissa-button quiet"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "経過を隠す" : "経過を見る"}
        </button>
        {cancellable && (
          <button
            type="button"
            className="kissa-button secondary"
            onClick={() => {
              const result = advance(order.orderId, "cancelled");
              setError(result.ok ? "" : (result.reason ?? ""));
            }}
          >
            この注文を取り消す
          </button>
        )}
      </div>

      {open && (
        <ul className="kissa-history">
          {order.history.map((entry, index) => (
            <li key={`${entry.event}-${index}`}>
              <b>{entry.event}</b>
              <span>{entry.detail}</span>
              <time dateTime={entry.at}>{formatJst(entry.at)}</time>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function ReservationCard({ reservation }: { reservation: Reservation }) {
  const { state, nowIso, changeReservation, cancelReservation } = useShop();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [partySize, setPartySize] = useState(reservation.partySize);
  const [day, setDay] = useState("");
  const [startIso, setStartIso] = useState("");
  const [seatId, setSeatId] = useState("");

  const days = useMemo(() => dayOptions(nowIso), [nowIso]);
  const activeDay = day || days.find((d) => d.open)?.iso || "";

  const slots = useMemo(
    () =>
      editing && activeDay
        ? reservationSlots(
            activeDay,
            partySize,
            reservation.durationMinutes,
            state.reservations,
            nowIso,
            reservation.reservationId,
          )
        : [],
    [
      editing,
      activeDay,
      partySize,
      reservation.durationMinutes,
      reservation.reservationId,
      state.reservations,
      nowIso,
    ],
  );

  const seatsForSlot = useMemo(
    () =>
      startIso
        ? seatOptions(
            startIso,
            partySize,
            reservation.durationMinutes,
            state.reservations,
            nowIso,
            reservation.reservationId,
          )
        : [],
    [
      startIso,
      partySize,
      reservation.durationMinutes,
      state.reservations,
      nowIso,
      reservation.reservationId,
    ],
  );

  const changeable = reservation.status === "confirmed";

  return (
    <li className="kissa-record" data-status={reservation.status}>
      <div className="kissa-record-head">
        <div>
          <span className="kissa-reference">{reservation.reference}</span>
          <p>
            {formatJst(reservation.startIso)} から {reservation.partySize} 名
            <br />
            {seatById(reservation.seatId)?.label}
          </p>
        </div>
        <span className="kissa-badge" data-state={reservation.status}>
          {RESERVATION_STATUS_LABELS[reservation.status]}
        </span>
      </div>

      {reservation.name && (
        <p className="kissa-fineprint">お名前：{reservation.name}</p>
      )}
      {reservation.note && (
        <p className="kissa-fineprint">ご要望：{reservation.note}</p>
      )}

      {error && (
        <p className="kissa-error" role="alert">
          {error}
        </p>
      )}

      {!editing && (
        <div className="kissa-detail-actions">
          <button
            type="button"
            className="kissa-button quiet"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "経過を隠す" : "経過を見る"}
          </button>
          {changeable && (
            <>
              <button
                type="button"
                className="kissa-button secondary"
                onClick={() => {
                  setEditing(true);
                  setError("");
                  setStartIso("");
                  setSeatId("");
                }}
              >
                日時を変更する
              </button>
              <button
                type="button"
                className="kissa-button secondary"
                onClick={() => {
                  const result = cancelReservation(reservation.reservationId);
                  setError(result.ok ? "" : (result.reason ?? ""));
                }}
              >
                取り消す
              </button>
            </>
          )}
        </div>
      )}

      {editing && (
        <div className="kissa-change">
          <p className="kissa-note">
            新しい日時が取れたときだけ移ります。取れなければ
            {formatJst(reservation.startIso)} のご予約はそのままです。
          </p>

          <fieldset className="kissa-axis">
            <legend>人数</legend>
            <div className="kissa-axis-options">
              {Array.from({ length: MAX_PARTY }, (_, i) => i + 1).map((n) => (
                <label key={n} className="kissa-option">
                  <input
                    type="radio"
                    name={`party-${reservation.reservationId}`}
                    checked={partySize === n}
                    onChange={() => {
                      setPartySize(n);
                      setStartIso("");
                      setSeatId("");
                    }}
                  />
                  <span>{n} 名</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="kissa-field">
            <span>日</span>
            <select
              value={activeDay}
              onChange={(e) => {
                setDay(e.target.value);
                setStartIso("");
                setSeatId("");
              }}
            >
              {days.map((d) => (
                <option key={d.key} value={d.iso} disabled={!d.open}>
                  {d.label}
                  {d.open ? "" : "（定休日）"}
                </option>
              ))}
            </select>
          </label>

          {slots.length === 0 ? (
            <p className="kissa-fineprint">この日に空き枠がありません。</p>
          ) : (
            <fieldset className="kissa-slots">
              <legend className="sr-only">新しい開始時間</legend>
              <div className="kissa-slot-grid">
                {slots.map((slot) => (
                  <label key={slot.iso} className="kissa-slot">
                    <input
                      type="radio"
                      // Scoped to this booking: two cards open at once must
                      // not share one radio group.
                      name={`start-${reservation.reservationId}`}
                      value={slot.iso}
                      checked={startIso === slot.iso}
                      disabled={!slot.available}
                      onChange={() => {
                        setStartIso(slot.iso);
                        setSeatId("");
                      }}
                    />
                    <span>{slot.label}</span>
                    <small>
                      {slot.available ? `空${slot.seatCount}` : "満"}
                    </small>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {startIso && (
            <ul className="kissa-seat-list">
              {seatsForSlot.map((option) => (
                <li key={option.seat.id}>
                  <div>
                    <strong>{option.seat.label}</strong>
                    <small>最大 {option.seat.capacity} 名</small>
                    {option.reason && <p>{option.reason}</p>}
                  </div>
                  <button
                    type="button"
                    className="kissa-button"
                    aria-pressed={seatId === option.seat.id}
                    disabled={!option.available}
                    onClick={() => setSeatId(option.seat.id)}
                  >
                    {option.available
                      ? seatId === option.seat.id
                        ? "選択中"
                        : "この席にする"
                      : "選べません"}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="kissa-detail-actions">
            <button
              type="button"
              className="kissa-button secondary"
              onClick={() => {
                setEditing(false);
                setError("");
              }}
            >
              変更をやめる
            </button>
            <button
              type="button"
              className="kissa-button"
              disabled={!seatId || !startIso}
              onClick={() => {
                const result = changeReservation(reservation.reservationId, {
                  seatId,
                  startIso,
                  partySize,
                });
                if (!result.ok) {
                  setError(result.reason ?? "変更できませんでした。");
                  return;
                }
                setError("");
                setEditing(false);
              }}
            >
              この内容に変更する
            </button>
          </div>
        </div>
      )}

      {open && (
        <ul className="kissa-history">
          {reservation.history.map((entry, index) => (
            <li key={`${entry.event}-${index}`}>
              <b>{entry.event}</b>
              <span>{entry.detail}</span>
              <time dateTime={entry.at}>{formatJst(entry.at)}</time>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export function MyPage() {
  const { state, ready, notice, reset } = useShop();
  const [tab, setTab] = useState<"orders" | "reservations">("orders");

  if (!ready) return <p className="kissa-empty">読み込んでいます…</p>;

  const orders = [...state.orders].sort(
    (a, b) => Date.parse(b.placedAtIso) - Date.parse(a.placedAtIso),
  );
  const reservations = [...state.reservations]
    // A lapsed hold is noise here; it is still in the operator's list.
    .filter((r) => r.status !== "expired")
    .sort((a, b) => Date.parse(a.startIso) - Date.parse(b.startIso));

  return (
    <>
      {notice && (
        <p className="kissa-note" role="status">
          {notice}
        </p>
      )}

      <div className="kissa-tabs" role="tablist" aria-label="表示の切り替え">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "orders"}
          onClick={() => setTab("orders")}
        >
          注文<span>{orders.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "reservations"}
          onClick={() => setTab("reservations")}
        >
          予約<span>{reservations.length}</span>
        </button>
      </div>

      {tab === "orders" &&
        (orders.length === 0 ? (
          <div className="kissa-empty">
            <p>この端末からのご注文はまだありません。</p>
            <Link href="/kissa/menu" className="kissa-button">
              メニューを見る
            </Link>
          </div>
        ) : (
          <ul className="kissa-records">
            {orders.map((order) => (
              <OrderCard key={order.orderId} order={order} />
            ))}
          </ul>
        ))}

      {tab === "reservations" &&
        (reservations.length === 0 ? (
          <div className="kissa-empty">
            <p>この端末からのご予約はまだありません。</p>
            <Link href="/kissa/reserve" className="kissa-button">
              席を予約する
            </Link>
          </div>
        ) : (
          <ul className="kissa-records">
            {reservations.map((reservation) => (
              <ReservationCard
                key={reservation.reservationId}
                reservation={reservation}
              />
            ))}
          </ul>
        ))}

      <section className="kissa-section kissa-reset">
        <h2>この端末のデータ</h2>
        <p className="kissa-fineprint">
          注文と予約は、このブラウザの中だけに保存されています。サーバーには送信されず、
          他の方には見えません。
        </p>
        <button type="button" className="kissa-button quiet" onClick={reset}>
          この端末の体験データを初期化する
        </button>
      </section>
    </>
  );
}
