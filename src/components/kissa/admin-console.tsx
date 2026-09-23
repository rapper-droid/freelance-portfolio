"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useShop } from "./shop-provider";
import { HOURS, products, seatById } from "@/lib/shop/catalog";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_LABELS,
  canAdvance,
  orderTotals,
} from "@/lib/shop/order";
import { RESERVATION_STATUS_LABELS, isOccupying } from "@/lib/shop/reservation";
import { formatJst, jstDateKey } from "@/lib/runtime/rules/datetime";
import { formatMoney } from "@/lib/runtime/rules/money";
import type { OrderStatus, SaleState } from "@/lib/shop/types";

/**
 * The counter's screen (指示書 §13).
 *
 * Every control here writes to the same record the customer's screens read, so
 * marking the pudding sold out removes it from the menu and moving an order to
 * 受取待ち is what the customer's status page then shows. A console that only
 * displayed numbers would be a picture of a console.
 *
 * Steps the state machine forbids are not rendered as dead buttons: an order
 * already handed over simply has nothing left to press.
 */

const SALE_STATES: Array<[SaleState, string]> = [
  ["on_sale", "販売中"],
  ["sold_out", "売り切れ"],
  ["closed_for_now", "時間外"],
  ["ended", "販売終了"],
];

const NEXT_STEPS: Array<[OrderStatus, string]> = [
  ["preparing", "調理を始める"],
  ["ready", "受取待ちにする"],
  ["handed_over", "受け渡した"],
  ["cancelled", "取り消す"],
];

export function AdminConsole() {
  const { state, ready, nowIso, advance, setSaleState } = useShop();
  const [tab, setTab] = useState<"queue" | "tables" | "menu" | "takings">(
    "queue",
  );
  const [error, setError] = useState("");

  const openOrders = useMemo(
    () =>
      [...state.orders]
        .filter((o) => o.status !== "handed_over" && o.status !== "cancelled")
        .sort((a, b) => Date.parse(a.pickupAtIso) - Date.parse(b.pickupAtIso)),
    [state.orders],
  );
  const closedOrders = useMemo(
    () =>
      [...state.orders]
        .filter((o) => o.status === "handed_over" || o.status === "cancelled")
        .sort(
          (a, b) => Date.parse(b.updatedAtIso) - Date.parse(a.updatedAtIso),
        ),
    [state.orders],
  );
  const totals = useMemo(() => orderTotals(state.orders), [state.orders]);

  const today = jstDateKey(nowIso);
  const todaysTables = useMemo(
    () =>
      [...state.reservations]
        .filter((r) => jstDateKey(r.startIso) === today)
        .sort((a, b) => Date.parse(a.startIso) - Date.parse(b.startIso)),
    [state.reservations, today],
  );
  const laterTables = useMemo(
    () =>
      [...state.reservations]
        .filter((r) => jstDateKey(r.startIso) !== today)
        .sort((a, b) => Date.parse(a.startIso) - Date.parse(b.startIso)),
    [state.reservations, today],
  );

  // Today's list being empty means two different things, and the console
  // should not present a closing day as a quiet day.
  const jstWeekday = new Date(Date.parse(nowIso) + 9 * 3600_000).getUTCDay();
  const openToday =
    HOURS.businessDays.includes(jstWeekday) &&
    !HOURS.closedDates.includes(today);

  if (!ready) return <p className="kissa-empty">読み込んでいます…</p>;

  const move = (orderId: string, to: OrderStatus) => {
    const result = advance(orderId, to);
    setError(result.ok ? "" : (result.reason ?? ""));
  };

  return (
    <>
      <p className="kissa-note">
        この画面は、同じ端末で行われた注文と予約だけを扱います。実店舗の運営端末ではなく、
        運営側の操作がお客さま側の画面にどう反映されるかを見るためのものです。
      </p>

      {error && (
        <p className="kissa-error" role="alert">
          {error}
        </p>
      )}

      <div className="kissa-tabs" role="tablist" aria-label="運営メニュー">
        {(
          [
            ["queue", "注文", openOrders.length],
            ["tables", "席", todaysTables.length + laterTables.length],
            ["menu", "販売状態", products.length],
            ["takings", "売上", totals.count],
          ] as Array<[typeof tab, string, number]>
        ).map(([id, label, count]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
          >
            {label}
            <span>{count}</span>
          </button>
        ))}
      </div>

      {tab === "queue" && (
        <>
          <h2>いま動いている注文</h2>
          {openOrders.length === 0 ? (
            <div className="kissa-empty">
              <p>進行中の注文はありません。</p>
              <Link href="/kissa/menu" className="kissa-button secondary">
                客側の画面から注文してみる
              </Link>
            </div>
          ) : (
            <ul className="kissa-records">
              {openOrders.map((order) => (
                <li
                  key={order.orderId}
                  className="kissa-record"
                  data-status={order.status}
                >
                  <div className="kissa-record-head">
                    <div>
                      <span className="kissa-reference">{order.reference}</span>
                      <p>{formatJst(order.pickupAtIso)} 受け渡し</p>
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

                  {order.note && (
                    <p className="kissa-fineprint">ご要望：{order.note}</p>
                  )}

                  {order.status === "ready" && order.payment !== "paid" && (
                    <p className="kissa-note">
                      未払いです。受け渡しは記録に残りますが、レジでの精算をご確認ください。
                    </p>
                  )}

                  <div className="kissa-detail-actions">
                    {NEXT_STEPS.filter(([to]) =>
                      canAdvance(order.status, to),
                    ).map(([to, label]) => (
                      <button
                        key={to}
                        type="button"
                        className={
                          to === "cancelled"
                            ? "kissa-button quiet"
                            : "kissa-button"
                        }
                        onClick={() => move(order.orderId, to)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {closedOrders.length > 0 && (
            <>
              <h2>終わった注文</h2>
              <ul className="kissa-records compact">
                {closedOrders.map((order) => (
                  <li
                    key={order.orderId}
                    className="kissa-record"
                    data-status={order.status}
                  >
                    <div className="kissa-record-head">
                      <div>
                        <span className="kissa-reference">
                          {order.reference}
                        </span>
                        <p>{formatJst(order.updatedAtIso)}</p>
                      </div>
                      <span className="kissa-badge" data-state={order.status}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </div>
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
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      {tab === "tables" && (
        <>
          <h2>本日の席</h2>
          {todaysTables.length === 0 ? (
            <div className="kissa-empty">
              <p>
                {openToday
                  ? "本日のご予約はありません。"
                  : "本日は定休日のため、ご予約は承っていません。"}
              </p>
              <Link href="/kissa/reserve" className="kissa-button secondary">
                客側の画面から予約してみる
              </Link>
            </div>
          ) : (
            <table className="kissa-table">
              <caption className="sr-only">本日の予約一覧</caption>
              <thead>
                <tr>
                  <th scope="col">時間</th>
                  <th scope="col">席</th>
                  <th scope="col">人数</th>
                  <th scope="col">お名前</th>
                  <th scope="col">状態</th>
                </tr>
              </thead>
              <tbody>
                {todaysTables.map((r) => (
                  <tr
                    key={r.reservationId}
                    data-occupying={isOccupying(r, nowIso)}
                  >
                    <td>{formatJst(r.startIso).slice(-5)}</td>
                    <td>{seatById(r.seatId)?.label ?? r.seatId}</td>
                    <td>{r.partySize} 名</td>
                    <td>{r.name || "—"}</td>
                    <td>
                      <span className="kissa-badge" data-state={r.status}>
                        {RESERVATION_STATUS_LABELS[r.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {laterTables.length > 0 && (
            <>
              <h2>以降のご予約</h2>
              <ul className="kissa-records compact">
                {laterTables.map((r) => (
                  <li key={r.reservationId} className="kissa-record">
                    <div className="kissa-record-head">
                      <div>
                        <span className="kissa-reference">{r.reference}</span>
                        <p>
                          {formatJst(r.startIso)}・{seatById(r.seatId)?.label}・
                          {r.partySize} 名
                        </p>
                      </div>
                      <span className="kissa-badge" data-state={r.status}>
                        {RESERVATION_STATUS_LABELS[r.status]}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      {tab === "menu" && (
        <>
          <h2>販売状態</h2>
          <p className="kissa-fineprint">
            ここで変えた状態は、メニューと商品ページにそのまま出ます。売り切れにした商品は
            カートに入れられなくなり、すでにカートにある場合は注文の直前に知らせます。
          </p>
          <table className="kissa-table">
            <caption className="sr-only">商品の販売状態</caption>
            <thead>
              <tr>
                <th scope="col">商品</th>
                <th scope="col">価格</th>
                <th scope="col">販売状態</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const current =
                  state.saleOverrides[product.id] ?? product.saleState;
                return (
                  <tr key={product.id}>
                    <th scope="row">
                      <Link href={`/kissa/menu/${product.id}`}>
                        {product.name}
                      </Link>
                    </th>
                    <td>{formatMoney(product.price)}</td>
                    <td>
                      <label className="kissa-field compact">
                        <span className="sr-only">
                          {product.name}の販売状態
                        </span>
                        <select
                          value={current}
                          onChange={(e) =>
                            setSaleState(
                              product.id,
                              e.target.value as SaleState,
                            )
                          }
                        >
                          {SALE_STATES.map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}

      {tab === "takings" && (
        <>
          <h2>この端末の集計</h2>
          <dl className="kissa-stats">
            <div>
              <dt>有効な注文</dt>
              <dd>{totals.count} 件</dd>
            </div>
            <div>
              <dt>合計</dt>
              <dd>{formatMoney(totals.gross)}</dd>
            </div>
            <div>
              <dt>受領済み</dt>
              <dd>{formatMoney(totals.paid)}</dd>
            </div>
            <div>
              <dt>未収</dt>
              <dd>{formatMoney(totals.unpaid)}</dd>
            </div>
            <div>
              <dt>取消</dt>
              <dd>{totals.cancelled} 件</dd>
            </div>
          </dl>
          <p className="kissa-fineprint">
            取り消した注文は合計に含めていません。未収は、店頭でのお支払いや、
            シミュレーターで拒否・保留・結果不明になった分です。決済は外部サービスへ
            接続していないため、実際の入金はありません。
          </p>
        </>
      )}
    </>
  );
}
