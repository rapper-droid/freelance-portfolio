"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useShop } from "./shop-provider";
import { HOURS, seatById } from "@/lib/shop/catalog";
import {
  HOLD_MINUTES,
  MAX_PARTY,
  reservationSlots,
  seatOptions,
} from "@/lib/shop/reservation";
import { formatJst, toJst } from "@/lib/runtime/rules/datetime";
import type { Reservation } from "@/lib/shop/types";

/**
 * Booking a table (指示書 §11).
 *
 * Party size and time first, then only the tables that can actually take it.
 * Choosing one holds it for a few minutes so the details can be typed without
 * losing it to someone else — and the hold expires on its own rather than
 * keeping a table forever.
 *
 * Nothing asks for a real name or phone number: this is a demo, and the form
 * says so rather than collecting what it does not need.
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
      // Midnight JST for that day.
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

export function ReserveFlow() {
  const { state, ready, nowIso, holdTable, confirmReservation } = useShop();
  const [partySize, setPartySize] = useState(2);
  const [day, setDay] = useState("");
  const [startIso, setStartIso] = useState("");
  const [held, setHeld] = useState<Reservation | null>(null);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState<Reservation | null>(null);

  const days = useMemo(() => dayOptions(nowIso), [nowIso]);
  const activeDay = day || days.find((d) => d.open)?.iso || days[0]?.iso || "";

  const slots = useMemo(
    () =>
      activeDay
        ? reservationSlots(
            activeDay,
            partySize,
            HOURS.defaultStayMinutes,
            state.reservations,
            nowIso,
          )
        : [],
    [activeDay, partySize, state.reservations, nowIso],
  );

  const seatsForSlot = useMemo(
    () =>
      startIso
        ? seatOptions(
            startIso,
            partySize,
            HOURS.defaultStayMinutes,
            state.reservations,
            nowIso,
          )
        : [],
    [startIso, partySize, state.reservations, nowIso],
  );

  if (!ready) return <p className="kissa-empty">読み込んでいます…</p>;

  if (done)
    return (
      <div className="kissa-done">
        <p className="kissa-eyebrow">ご予約を承りました</p>
        <p className="kissa-reference">{done.reference}</p>
        <p>
          {formatJst(done.startIso)} から {done.partySize} 名さま
          <br />
          {seatById(done.seatId)?.label}
        </p>
        <div
          className="kissa-detail-actions"
          style={{ justifyContent: "center" }}
        >
          <Link href="/kissa/my" className="kissa-button">
            予約を確認・変更する
          </Link>
          <Link href="/kissa/menu" className="kissa-button secondary">
            メニューを見る
          </Link>
        </div>
      </div>
    );

  const take = (seatId: string) => {
    setError("");
    const result = holdTable({
      seatId,
      startIso,
      partySize,
      durationMinutes: HOURS.defaultStayMinutes,
    });
    if (!result.ok || !result.reservation) {
      setError(result.reason ?? "お取り置きできませんでした。");
      return;
    }
    setHeld(result.reservation);
  };

  const confirm = () => {
    if (!held) return;
    setError("");
    const result = confirmReservation(held.reservationId, name, note);
    if (!result.ok) {
      setError(result.reason ?? "確定できませんでした。");
      return;
    }
    setDone(result.reservation ?? { ...held, status: "confirmed", name });
  };

  return (
    <>
      {error && (
        <p className="kissa-error" role="alert">
          {error}
        </p>
      )}

      {!held && (
        <>
          <fieldset className="kissa-axis">
            <legend>ご利用人数</legend>
            <div className="kissa-axis-options">
              {Array.from({ length: MAX_PARTY }, (_, i) => i + 1).map((n) => (
                <label key={n} className="kissa-option">
                  <input
                    type="radio"
                    name="party"
                    checked={partySize === n}
                    onChange={() => {
                      setPartySize(n);
                      setStartIso("");
                    }}
                  />
                  <span>{n} 名</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="kissa-field">
            <span>ご利用日</span>
            <select
              value={activeDay}
              onChange={(e) => {
                setDay(e.target.value);
                setStartIso("");
              }}
            >
              {days.map((d) => (
                <option key={d.key} value={d.iso} disabled={!d.open}>
                  {d.label}
                  {d.open ? "" : "（定休日）"}
                </option>
              ))}
            </select>
            <small>
              滞在は {HOURS.defaultStayMinutes} 分、片付けに{" "}
              {HOURS.turnaroundMinutes} 分を見込んでいます。
            </small>
          </label>

          <h2>時間を選ぶ</h2>
          {slots.length === 0 ? (
            <div className="kissa-empty">
              <p>この日はご予約を承れません。別の日をお選びください。</p>
            </div>
          ) : (
            <fieldset className="kissa-slots">
              <legend className="sr-only">開始時間</legend>
              <div className="kissa-slot-grid">
                {slots.map((slot) => (
                  <label key={slot.iso} className="kissa-slot">
                    <input
                      type="radio"
                      name="start"
                      value={slot.iso}
                      checked={startIso === slot.iso}
                      disabled={!slot.available}
                      onChange={() => setStartIso(slot.iso)}
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
            <>
              <h2>席を選ぶ</h2>
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
                      disabled={!option.available}
                      onClick={() => take(option.seat.id)}
                    >
                      {option.available ? "この席で進む" : "選べません"}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      {held && (
        <>
          <div className="kissa-note" role="status">
            <strong>{seatById(held.seatId)?.label}</strong> を {HOLD_MINUTES}{" "}
            分間お取り置きしています。
            <br />
            {formatJst(held.startIso)} から {held.partySize} 名さま。
            期限を過ぎると自動で解放され、他のお客さまがお選びいただけます。
          </div>

          <label className="kissa-field">
            <span>お名前（デモ用の仮名で構いません）</span>
            <input
              type="text"
              value={name}
              maxLength={40}
              placeholder="例：テスト太郎"
              onChange={(e) => setName(e.target.value)}
            />
            <small>
              このデモでは実在の氏名・電話番号を入力しないでください。
            </small>
          </label>

          <label className="kissa-field">
            <span>ご要望（任意）</span>
            <textarea
              value={note}
              maxLength={200}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>

          <div className="kissa-detail-actions">
            <button
              type="button"
              className="kissa-button secondary"
              onClick={() => {
                setHeld(null);
                setStartIso("");
              }}
            >
              選び直す
            </button>
            <button
              type="button"
              className="kissa-button"
              disabled={!name.trim()}
              onClick={confirm}
            >
              この内容で予約する
            </button>
          </div>
        </>
      )}
    </>
  );
}
