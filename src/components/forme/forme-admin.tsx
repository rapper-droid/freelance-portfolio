"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useForme } from "./forme-provider";
import { products } from "@/lib/forme/catalog";
import {
  PAYMENT_LABELS,
  canAdvance,
  orderTotals,
  shippingBlock,
} from "@/lib/forme/order";
import {
  allSkus,
  baseStock,
  describeSku,
  levelOf,
  skuKey,
  skusOf,
  stockFor,
  stockLabel,
  totalStock,
} from "@/lib/forme/stock";
import { formatJst } from "@/lib/runtime/rules/datetime";
import { formatMoney } from "@/lib/runtime/rules/money";
import {
  FORME_STATUS_LABELS,
  FULFILMENT_LABELS,
  type FormeOrderStatus,
} from "@/lib/forme/types";

/**
 * The shop's back office (指示書 §16).
 *
 * Products, stock, orders and money from the same record the customer reads,
 * so changing a count here changes what the product page offers and taking an
 * order off the shelf is visible on both sides.
 *
 * The steps the state machine forbids are not rendered as dead buttons, and
 * the one that is blocked for a reason — shipping something unpaid — says the
 * reason instead of disappearing.
 */

const NEXT_STEPS: Array<[FormeOrderStatus, string]> = [
  ["preparing", "準備を始める"],
  ["shipped", "発送した"],
  ["delivered", "お渡し済みにする"],
  ["cancelled", "取り消す"],
];

export function FormeAdmin() {
  const { state, ready, advance, setStock, togglePublished } = useForme();
  const [tab, setTab] = useState<"orders" | "stock" | "catalogue" | "takings">(
    "orders",
  );
  const [error, setError] = useState("");

  const deltas = state.stockDeltas;

  const openOrders = useMemo(
    () =>
      [...state.orders]
        .filter((o) => o.status !== "delivered" && o.status !== "cancelled")
        .sort((a, b) => Date.parse(a.placedAtIso) - Date.parse(b.placedAtIso)),
    [state.orders],
  );
  const closedOrders = useMemo(
    () =>
      [...state.orders]
        .filter((o) => o.status === "delivered" || o.status === "cancelled")
        .sort(
          (a, b) => Date.parse(b.updatedAtIso) - Date.parse(a.updatedAtIso),
        ),
    [state.orders],
  );
  const totals = useMemo(() => orderTotals(state.orders), [state.orders]);
  const skus = useMemo(() => allSkus(), []);
  const lowSkus = skus.filter(
    ({ key }) => baseStock(key) + (deltas[key] ?? 0) <= 3,
  ).length;

  if (!ready) return <p className="forme-empty">読み込んでいます…</p>;

  const move = (orderId: string, to: FormeOrderStatus) => {
    const result = advance(orderId, to);
    setError(result.ok ? "" : (result.reason ?? ""));
  };

  return (
    <>
      <p className="forme-note">
        この画面は、同じ端末で行われた注文と在庫だけを扱います。実店舗の管理画面では
        なく、運営側の操作がお客さま側の画面にどう反映されるかを見るためのものです。
      </p>

      {error && (
        <p className="forme-error" role="alert">
          {error}
        </p>
      )}

      <div className="forme-tabs" role="tablist" aria-label="運営メニュー">
        {(
          [
            ["orders", "注文", openOrders.length],
            ["stock", "在庫", lowSkus],
            ["catalogue", "商品", products.length],
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

      {tab === "orders" && (
        <>
          <h2>いま動いている注文</h2>
          {openOrders.length === 0 ? (
            <div className="forme-empty">
              <p>進行中の注文はありません。</p>
              <Link href="/forme/items" className="forme-button secondary">
                客側の画面から注文してみる
              </Link>
            </div>
          ) : (
            <ul className="forme-records">
              {openOrders.map((order) => {
                const block = shippingBlock(order);
                return (
                  <li
                    key={order.orderId}
                    className="forme-record"
                    data-status={order.status}
                  >
                    <div className="forme-record-head">
                      <div>
                        <span className="forme-reference">
                          {order.reference}
                        </span>
                        <p>
                          {formatJst(order.placedAtIso)} ·{" "}
                          {FULFILMENT_LABELS[order.fulfilment]}
                          {order.region && `（${order.region}）`}
                        </p>
                      </div>
                      <span className="forme-badge" data-status={order.status}>
                        {FORME_STATUS_LABELS[order.status]}
                      </span>
                    </div>

                    <ul className="forme-confirm-lines">
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

                    <dl className="forme-summary">
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
                      <p className="forme-fineprint">ご要望：{order.note}</p>
                    )}

                    {block && <p className="forme-note">{block}</p>}

                    <div className="forme-detail-actions">
                      {NEXT_STEPS.filter(([to]) =>
                        canAdvance(order.status, to),
                      ).map(([to, label]) => (
                        <button
                          key={to}
                          type="button"
                          className={
                            to === "cancelled"
                              ? "forme-button quiet"
                              : "forme-button"
                          }
                          disabled={to === "shipped" && Boolean(block)}
                          onClick={() => move(order.orderId, to)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {closedOrders.length > 0 && (
            <>
              <h2>終わった注文</h2>
              <ul className="forme-records compact">
                {closedOrders.map((order) => (
                  <li
                    key={order.orderId}
                    className="forme-record"
                    data-status={order.status}
                  >
                    <div className="forme-record-head">
                      <div>
                        <span className="forme-reference">
                          {order.reference}
                        </span>
                        <p>{formatJst(order.updatedAtIso)}</p>
                      </div>
                      <span className="forme-badge" data-status={order.status}>
                        {FORME_STATUS_LABELS[order.status]}
                      </span>
                    </div>
                    <dl className="forme-summary">
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

      {tab === "stock" && (
        <>
          <h2>在庫</h2>
          <p className="forme-fineprint">
            数を変えると、商品ページの在庫表示とカートの上限がそのまま変わります。
            注文が入ると減り、取り消すと戻ります。
          </p>
          <div
            className="forme-table-scroll"
            tabIndex={0}
            role="region"
            aria-label="在庫一覧"
          >
            <table className="forme-table">
              <caption className="sr-only">商品の組み合わせごとの在庫</caption>
              <thead>
                <tr>
                  <th scope="col">組み合わせ</th>
                  <th scope="col">掲載時</th>
                  <th scope="col">いま</th>
                  <th scope="col">状態</th>
                </tr>
              </thead>
              <tbody>
                {skus.map(({ key, productId }) => {
                  const now = baseStock(key) + (deltas[key] ?? 0);
                  return (
                    <tr key={key}>
                      <th scope="row">
                        <Link href={`/forme/items/${productId}`}>
                          {describeSku(key)}
                        </Link>
                      </th>
                      <td>{baseStock(key)}</td>
                      <td>
                        <label className="forme-field compact">
                          <span className="sr-only">
                            {describeSku(key)}の在庫
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={999}
                            value={Math.max(0, now)}
                            onChange={(e) =>
                              setStock(key, Number(e.target.value) || 0)
                            }
                          />
                        </label>
                      </td>
                      <td>
                        <span
                          className="forme-badge"
                          data-level={levelOf(Math.max(0, now))}
                        >
                          {stockLabel(Math.max(0, now))}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "catalogue" && (
        <>
          <h2>商品</h2>
          <p className="forme-fineprint">
            取り扱いを止めると、一覧から消え、カートに入っていた分は注文の直前に
            知らせます。価格は注文時点で控えているため、過去の注文金額は変わりません。
          </p>
          <div
            className="forme-table-scroll"
            tabIndex={0}
            role="region"
            aria-label="商品一覧"
          >
            <table className="forme-table">
              <caption className="sr-only">商品の取り扱い状態</caption>
              <thead>
                <tr>
                  <th scope="col">商品</th>
                  <th scope="col">価格</th>
                  <th scope="col">組み合わせ</th>
                  <th scope="col">在庫合計</th>
                  <th scope="col">取り扱い</th>
                </tr>
              </thead>
              <tbody>
                {[...products]
                  .sort((a, b) => a.order - b.order)
                  .map((product) => {
                    const hidden = state.unpublished.includes(product.id);
                    return (
                      <tr key={product.id} data-hidden={hidden}>
                        <th scope="row">
                          <Link href={`/forme/items/${product.id}`}>
                            {product.name}
                          </Link>
                        </th>
                        <td>{formatMoney(product.price)}</td>
                        <td>{skusOf(product).length}</td>
                        <td>{totalStock(product, deltas)}</td>
                        <td>
                          <button
                            type="button"
                            className="forme-button quiet"
                            aria-pressed={!hidden}
                            onClick={() => togglePublished(product.id)}
                          >
                            {hidden ? "取り扱いを再開" : "取り扱いを止める"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "takings" && (
        <>
          <h2>この端末の集計</h2>
          <dl className="forme-stats">
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
              <dt>発送待ち</dt>
              <dd>{totals.awaitingShipment} 件</dd>
            </div>
            <div>
              <dt>取消</dt>
              <dd>{totals.cancelled} 件</dd>
            </div>
          </dl>
          <p className="forme-fineprint">
            取り消した注文は合計に含めていません。未収は、シミュレーターで拒否・保留・
            結果不明になった分と、まだ支払を試していない分です。決済は外部サービスへ
            接続していないため、実際の入金はありません。
          </p>
        </>
      )}
    </>
  );
}

export { skuKey, stockFor };
