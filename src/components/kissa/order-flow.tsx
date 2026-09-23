"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ProductArt } from "./product-art";
import { useShop } from "./shop-provider";
import { cartTotals, describeVariants, repriceCart } from "@/lib/shop/cart";
import { productById } from "@/lib/shop/catalog";
import {
  PAYMENT_LABELS,
  pickupSlots,
  placeOrder,
  prepMinutesFor,
} from "@/lib/shop/order";
import {
  OUTCOME_LABELS,
  OUTCOME_NOTES,
  PAYMENT_DISCLOSURE,
  PAYMENT_OUTCOMES,
  type PaymentOutcome,
} from "@/lib/shop/payment";
import { formatJst } from "@/lib/runtime/rules/datetime";
import { formatMoney } from "@/lib/runtime/rules/money";
import type { Order } from "@/lib/shop/types";

/**
 * Cart through to a placed order (指示書 §12).
 *
 * One route with steps rather than four URLs, because backing out of a
 * checkout should not mean losing the cart. Each step keeps what the previous
 * one established: nothing is re-entered, and the pickup time survives a
 * detour into the payment step.
 *
 * Totals shown here come from the same functions that build the order, so the
 * confirmation is not a second opinion about the price.
 */

type Step = "cart" | "pickup" | "confirm" | "paid";

export function OrderFlow() {
  const { state, ready, setQuantity, removeLine, saveOrder, pay, nowIso } =
    useShop();
  const [step, setStep] = useState<Step>("cart");
  const [pickupIso, setPickupIso] = useState("");
  const [note, setNote] = useState("");
  const [outcome, setOutcome] = useState<PaymentOutcome>("approve");
  const [placed, setPlaced] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [busy, setBusy] = useState(false);

  const { changes, cart } = useMemo(
    () => repriceCart(state.cart, state.saleOverrides),
    [state.cart, state.saleOverrides],
  );
  const totals = cartTotals(cart);
  const slots = useMemo(
    () => (cart.lines.length ? pickupSlots(cart, nowIso, state.orders) : []),
    [cart, nowIso, state.orders],
  );

  if (!ready) return <p className="kissa-empty">カートを読み込んでいます…</p>;

  if (step !== "paid" && cart.lines.length === 0)
    return (
      <div className="kissa-empty">
        <p>カートは空です。</p>
        <Link href="/kissa/menu" className="kissa-button">
          メニューを見る
        </Link>
      </div>
    );

  const place = () => {
    setBusy(true);
    setError("");
    const result = placeOrder({
      cart,
      pickupAtIso: pickupIso,
      nowIso,
      note,
      existingOrders: state.orders,
      saleOverrides: state.saleOverrides,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.reason);
      // Send them back to pick a time again rather than leaving them stuck.
      setStep("pickup");
      return;
    }
    saveOrder(result.order);
    setPlaced(result.order);
    setStep("paid");
  };

  const runPayment = () => {
    if (!placed) return;
    setBusy(true);
    const result = pay(placed.orderId, outcome);
    setBusy(false);
    // `current` reads the order back out of state on the next render, so
    // nothing is copied here — copying would show the pre-payment order.
    setError(result.reason ?? "");
    setPaymentNote(result.detail ?? "");
  };

  const current = placed
    ? (state.orders.find((o) => o.orderId === placed.orderId) ?? placed)
    : null;

  return (
    <>
      <ol className="kissa-steps" aria-label="注文の手順">
        {(
          [
            ["cart", "カート"],
            ["pickup", "受取時間"],
            ["confirm", "内容確認"],
            ["paid", "完了"],
          ] as Array<[Step, string]>
        ).map(([id, label], index) => (
          <li
            key={id}
            aria-current={step === id ? "step" : undefined}
            data-done={
              (["cart", "pickup", "confirm", "paid"] as Step[]).indexOf(step) >
              index
            }
          >
            <span>{index + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      {changes.length > 0 && (
        <div className="kissa-note" role="status">
          <strong>カートの内容が変わりました。</strong>
          <ul>
            {changes.map((c) => (
              <li key={c.lineId}>
                {c.productName}：{c.detail}
              </li>
            ))}
          </ul>
          ご確認のうえお進みください。
        </div>
      )}

      {error && (
        <p className="kissa-error" role="alert">
          {error}
        </p>
      )}

      {step === "cart" && (
        <>
          <ul className="kissa-lines">
            {cart.lines.map((line) => {
              const product = productById(line.productId);
              if (!product) return null;
              return (
                <li key={line.lineId}>
                  <ProductArt product={product} size="thumb" />
                  <div className="kissa-line-body">
                    <Link href={`/kissa/menu/${product.id}`}>
                      {product.name}
                    </Link>
                    <p>
                      {describeVariants(product, line.variantIds).join("・") ||
                        "選択なし"}
                    </p>
                    <p className="kissa-line-unit">
                      単価 {formatMoney(line.unitPrice)}
                    </p>
                  </div>
                  <label className="kissa-line-qty">
                    <span className="sr-only">{product.name}の数量</span>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={line.quantity}
                      onChange={(e) =>
                        setQuantity(line.lineId, Number(e.target.value) || 0)
                      }
                    />
                  </label>
                  <span className="kissa-price">
                    {formatMoney({
                      ...line.unitPrice,
                      minorUnits: line.unitPrice.minorUnits * line.quantity,
                    })}
                  </span>
                  <button
                    type="button"
                    className="kissa-button quiet"
                    onClick={() => removeLine(line.lineId)}
                  >
                    削除
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="kissa-total-row">
            <span>{totals.count} 点</span>
            <strong className="kissa-price">{formatMoney(totals.total)}</strong>
          </div>
          <p className="kissa-fineprint">
            お受け取りまでの目安は約 {prepMinutesFor(cart)} 分です。
          </p>

          <div className="kissa-detail-actions">
            <Link href="/kissa/menu" className="kissa-button secondary">
              買い物を続ける
            </Link>
            <button
              type="button"
              className="kissa-button"
              onClick={() => setStep("pickup")}
            >
              受取時間を選ぶ
            </button>
          </div>
        </>
      )}

      {step === "pickup" && (
        <>
          <h2>受け取り時間を選ぶ</h2>
          <p className="kissa-fineprint">
            調理時間と営業時間から、お受け取りいただける時間だけを表示しています。
            本日の受付が終わっている場合は、次に開いている日をご案内します。
          </p>
          {slots.length === 0 ? (
            <div className="kissa-empty">
              <p>
                しばらくの間、お受け取りいただける時間がありません。
                カートはそのまま残しておきますので、日を改めてお試しください。
              </p>
            </div>
          ) : (
            <fieldset className="kissa-slots">
              <legend className="sr-only">受取時間</legend>
              <div className="kissa-slot-grid">
                {slots.map((slot) => (
                  <label key={slot.iso} className="kissa-slot">
                    <input
                      type="radio"
                      name="pickup"
                      value={slot.iso}
                      checked={pickupIso === slot.iso}
                      disabled={!slot.available}
                      onChange={() => setPickupIso(slot.iso)}
                    />
                    <span>{slot.label}</span>
                    {!slot.available && <small>満</small>}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <label className="kissa-field">
            <span>ご要望（任意）</span>
            <textarea
              value={note}
              maxLength={200}
              placeholder="例：砂糖を多めにお願いします"
              onChange={(e) => setNote(e.target.value)}
            />
          </label>

          <div className="kissa-detail-actions">
            <button
              type="button"
              className="kissa-button secondary"
              onClick={() => setStep("cart")}
            >
              カートに戻る
            </button>
            <button
              type="button"
              className="kissa-button"
              disabled={!pickupIso}
              onClick={() => setStep("confirm")}
            >
              内容を確認する
            </button>
          </div>
        </>
      )}

      {step === "confirm" && (
        <>
          <h2>ご注文内容の確認</h2>
          <dl className="kissa-summary">
            <div>
              <dt>受け取り</dt>
              <dd>{formatJst(pickupIso)}</dd>
            </div>
            <div>
              <dt>点数</dt>
              <dd>{totals.count} 点</dd>
            </div>
            <div>
              <dt>お支払い</dt>
              <dd>{formatMoney(totals.total)}</dd>
            </div>
          </dl>
          <ul className="kissa-confirm-lines">
            {cart.lines.map((line) => {
              const product = productById(line.productId);
              if (!product) return null;
              return (
                <li key={line.lineId}>
                  {product.name}
                  {describeVariants(product, line.variantIds).length > 0 && (
                    <small>
                      （{describeVariants(product, line.variantIds).join("・")}
                      ）
                    </small>
                  )}
                  <span>× {line.quantity}</span>
                </li>
              );
            })}
          </ul>
          {note && <p className="kissa-fineprint">ご要望：{note}</p>}

          <div className="kissa-detail-actions">
            <button
              type="button"
              className="kissa-button secondary"
              onClick={() => setStep("pickup")}
            >
              時間を選び直す
            </button>
            <button
              type="button"
              className="kissa-button"
              disabled={busy}
              onClick={place}
            >
              {busy ? "処理中…" : "この内容で注文する"}
            </button>
          </div>
        </>
      )}

      {step === "paid" && current && (
        <>
          <div className="kissa-done">
            <p className="kissa-eyebrow">ご注文を承りました</p>
            <p className="kissa-reference">{current.reference}</p>
            <p>
              {formatJst(current.pickupAtIso)} にお受け取りください。
              <br />
              お支払い状況：{PAYMENT_LABELS[current.payment]}
            </p>
          </div>

          <section className="kissa-payment">
            <h2>お支払いを試す</h2>
            <p className="kissa-note">{PAYMENT_DISCLOSURE}</p>
            <fieldset className="kissa-axis">
              <legend>結果を選ぶ</legend>
              <div className="kissa-axis-options">
                {PAYMENT_OUTCOMES.map((value) => (
                  <label key={value} className="kissa-option">
                    <input
                      type="radio"
                      name="outcome"
                      checked={outcome === value}
                      onChange={() => setOutcome(value)}
                    />
                    <span>{OUTCOME_LABELS[value]}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <p className="kissa-fineprint">{OUTCOME_NOTES[outcome]}</p>
            {paymentNote && (
              <p className="kissa-note" role="status" aria-live="polite">
                {paymentNote}
              </p>
            )}
            <div className="kissa-detail-actions">
              <button
                type="button"
                className="kissa-button"
                disabled={busy}
                onClick={runPayment}
              >
                この結果で試す
              </button>
              <Link href="/kissa/my" className="kissa-button secondary">
                注文状況を見る
              </Link>
            </div>
          </section>

          <ul className="kissa-history">
            {current.history.map((entry, index) => (
              <li key={`${entry.event}-${index}`}>
                <b>{entry.event}</b>
                <span>{entry.detail}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
