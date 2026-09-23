"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { ProductMedia } from "./product-media";
import { useForme } from "./forme-provider";
import { productById } from "@/lib/forme/catalog";
import {
  PAYMENT_LABELS,
  isCancellable,
  shippingBlock,
} from "@/lib/forme/order";
import {
  OUTCOME_LABELS,
  OUTCOME_NOTES,
  PAYMENT_DISCLOSURE,
  PAYMENT_OUTCOMES,
  type PaymentOutcome,
} from "@/lib/shop/payment";
import { formatJst } from "@/lib/runtime/rules/datetime";
import { formatMoney } from "@/lib/runtime/rules/money";
import {
  FORME_STATUS_LABELS,
  FULFILMENT_LABELS,
  type FormeOrder,
} from "@/lib/forme/types";

/**
 * What this visitor has bought and kept (指示書 §16).
 *
 * Orders and favourites in one place, because they are the two reasons to
 * come back. Cancelling here is the customer's own cancellation — it puts the
 * stock back on the shelf, which the operator's screen then shows.
 */

function OrderCard({ order }: { order: FormeOrder }) {
  const { advance, pay } = useForme();
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [outcome, setOutcome] = useState<PaymentOutcome>("approve");
  const [paymentNote, setPaymentNote] = useState("");

  // Payment belongs to the order, not to the checkout that created it: a
  // customer who closed the tab must still be able to pay, and a delivery
  // that cannot be paid for can never ship.
  const settled = order.payment === "paid" || order.status === "cancelled";
  const block = shippingBlock(order);

  return (
    <li className="forme-record" data-status={order.status}>
      <div className="forme-record-head">
        <div>
          <span className="forme-reference">{order.reference}</span>
          <p>
            {formatJst(order.placedAtIso)} 注文 ·{" "}
            {FULFILMENT_LABELS[order.fulfilment]}
            {order.region && `（${order.region}）`}
          </p>
        </div>
        <span className="forme-badge" data-status={order.status}>
          {FORME_STATUS_LABELS[order.status]}
        </span>
      </div>

      <ul className="forme-order-lines">
        {order.lines.map((line) => {
          const product = productById(line.productId);
          return (
            <li key={line.lineId}>
              {product && <ProductMedia product={product} size="thumb" />}
              <div>
                <b>{line.productName}</b>
                {line.variantLabels.length > 0 && (
                  <small>（{line.variantLabels.join("・")}）</small>
                )}
                <p>
                  {formatMoney(line.unitPrice)} × {line.quantity}
                </p>
              </div>
              <span className="forme-price">{formatMoney(line.lineTotal)}</span>
            </li>
          );
        })}
      </ul>

      <dl className="forme-summary">
        <div>
          <dt>商品</dt>
          <dd>{formatMoney(order.subtotal)}</dd>
        </div>
        <div>
          <dt>送料</dt>
          <dd>
            {order.shipping.minorUnits === 0
              ? "無料"
              : formatMoney(order.shipping)}
          </dd>
        </div>
        <div>
          <dt>合計</dt>
          <dd>{formatMoney(order.total)}</dd>
        </div>
        <div>
          <dt>支払</dt>
          <dd>{PAYMENT_LABELS[order.payment]}</dd>
        </div>
      </dl>

      {order.note && <p className="forme-fineprint">ご要望：{order.note}</p>}

      {block && order.status !== "cancelled" && (
        <p className="forme-note">{block}</p>
      )}

      {!settled && (
        <section className="forme-payment">
          <button
            type="button"
            className="forme-button"
            aria-expanded={payOpen}
            onClick={() => setPayOpen((v) => !v)}
          >
            {payOpen ? "支払の画面を閉じる" : "お支払いに進む"}
          </button>

          {payOpen && (
            <>
              <p className="forme-note">{PAYMENT_DISCLOSURE}</p>
              <fieldset className="forme-axis">
                <legend>結果を選ぶ</legend>
                <div className="forme-axis-options">
                  {PAYMENT_OUTCOMES.map((value) => (
                    <label key={value} className="forme-option">
                      <input
                        type="radio"
                        name={`outcome-${order.orderId}`}
                        checked={outcome === value}
                        onChange={() => setOutcome(value)}
                      />
                      <span>{OUTCOME_LABELS[value]}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <p className="forme-fineprint">{OUTCOME_NOTES[outcome]}</p>
              {paymentNote && (
                <p className="forme-note" role="status" aria-live="polite">
                  {paymentNote}
                </p>
              )}
              <button
                type="button"
                className="forme-button"
                onClick={() => {
                  const result = pay(order.orderId, outcome);
                  setPaymentNote(result.detail ?? "");
                }}
              >
                この結果で試す
              </button>
            </>
          )}
        </section>
      )}

      {error && (
        <p className="forme-error" role="alert">
          {error}
        </p>
      )}

      <div className="forme-detail-actions">
        <button
          type="button"
          className="forme-button quiet"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "経過を隠す" : "経過を見る"}
        </button>
        {isCancellable(order) ? (
          <button
            type="button"
            className="forme-button secondary"
            onClick={() => {
              const result = advance(order.orderId, "cancelled");
              setError(result.ok ? "" : (result.reason ?? ""));
            }}
          >
            この注文を取り消す
          </button>
        ) : (
          order.status !== "cancelled" && (
            <p className="forme-fineprint">
              発送の手配に入ったため、この画面からは取り消せません。
            </p>
          )
        )}
      </div>

      {open && (
        <ul className="forme-history">
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

export function MyOrders() {
  const { state, ready, notice, reset, toggleFavourite } = useForme();
  const [tab, setTab] = useState<"orders" | "favourites">("orders");

  if (!ready) return <p className="forme-empty">読み込んでいます…</p>;

  const orders = [...state.orders].sort(
    (a, b) => Date.parse(b.placedAtIso) - Date.parse(a.placedAtIso),
  );
  const favourites = state.favourites
    .map((id) => productById(id))
    .filter((p): p is NonNullable<typeof p> => !!p);

  return (
    <>
      {notice && (
        <p className="forme-note" role="status">
          {notice}
        </p>
      )}

      <div className="forme-tabs" role="tablist" aria-label="表示の切り替え">
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
          aria-selected={tab === "favourites"}
          onClick={() => setTab("favourites")}
        >
          お気に入り<span>{favourites.length}</span>
        </button>
      </div>

      {tab === "orders" &&
        (orders.length === 0 ? (
          <div className="forme-empty">
            <p>この端末からのご注文はまだありません。</p>
            <Link href="/forme/items" className="forme-button">
              商品を見る
            </Link>
          </div>
        ) : (
          <ul className="forme-records">
            {orders.map((order) => (
              <OrderCard key={order.orderId} order={order} />
            ))}
          </ul>
        ))}

      {tab === "favourites" &&
        (favourites.length === 0 ? (
          <div className="forme-empty">
            <p>お気に入りはまだありません。</p>
            <Link href="/forme/items" className="forme-button">
              商品を見る
            </Link>
          </div>
        ) : (
          <ul className="forme-grid">
            {favourites.map((product) => (
              <li key={product.id} className="forme-card">
                <Link
                  href={`/forme/items/${product.id}`}
                  className="forme-card-link"
                >
                  <ProductMedia product={product} />
                  <span className="forme-code">{product.code}</span>
                  <h2>{product.name}</h2>
                  <p className="forme-card-summary">{product.summary}</p>
                </Link>
                <div className="forme-card-foot">
                  <span className="forme-price">
                    {formatMoney(product.price)}
                  </span>
                  <button
                    type="button"
                    className="forme-icon-button"
                    aria-pressed
                    aria-label={`${product.name}をお気に入りから外す`}
                    onClick={() => toggleFavourite(product.id)}
                  >
                    <Heart size={16} aria-hidden="true" fill="currentColor" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ))}

      <section className="forme-section forme-reset">
        <h2>この端末のデータ</h2>
        <p className="forme-fineprint">
          {
            "注文・お気に入り・在庫の変更は、このブラウザの中だけに保存されています。サーバーには送信されず、他の方には見えません。"
          }
        </p>
        <button type="button" className="forme-button quiet" onClick={reset}>
          この端末の体験データを初期化する
        </button>
      </section>

      <p className="forme-fineprint">
        お問い合わせの導線は <Link href="/demos/inbox">SMART INBOX</Link>{" "}
        のデモに用意しています。この架空店舗から実際の連絡は送られません。
      </p>
    </>
  );
}
