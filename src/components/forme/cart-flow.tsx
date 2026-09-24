"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ProductMedia } from "./product-media";
import { useForme } from "./forme-provider";
import { cartTotals, describeVariants, repriceCart } from "@/lib/forme/cart";
import {
  PICKUP_NOTE,
  REGIONS,
  SHIPPING,
  TAX_NOTE,
  productById,
} from "@/lib/forme/catalog";
import { PAYMENT_LABELS } from "@/lib/forme/order";
import {
  OUTCOME_LABELS,
  OUTCOME_NOTES,
  PAYMENT_DISCLOSURE,
  PAYMENT_OUTCOMES,
  type PaymentOutcome,
} from "@/lib/shop/payment";
import { formatMoney } from "@/lib/runtime/rules/money";
import {
  FULFILMENT_LABELS,
  type FormeOrder,
  type Fulfilment,
} from "@/lib/forme/types";

/**
 * Cart through to a placed order (指示書 §16).
 *
 * One route with steps, so backing out of the checkout does not lose the
 * cart. The total is quoted by the same function that charges it, and the
 * shipping rule is stated beside the number rather than left to be inferred
 * from the arithmetic.
 */

type Step = "cart" | "delivery" | "confirm" | "done";

const STEPS: Array<[Step, string]> = [
  ["cart", "カート"],
  ["delivery", "受け取り方法"],
  ["confirm", "内容確認"],
  ["done", "完了"],
];

export function CartFlow() {
  const { state, ready, setQuantity, removeLine, placeOrder, pay } = useForme();
  const [step, setStep] = useState<Step>("cart");
  const [fulfilment, setFulfilment] = useState<Fulfilment>("delivery");
  const [region, setRegion] = useState<string>(REGIONS[1]);
  const [note, setNote] = useState("");
  const [outcome, setOutcome] = useState<PaymentOutcome>("approve");
  const [placed, setPlaced] = useState<FormeOrder | null>(null);
  const [error, setError] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [busy, setBusy] = useState(false);

  const { changes, cart } = useMemo(
    () => repriceCart(state.cart, state.stockDeltas, state.unpublished),
    [state.cart, state.stockDeltas, state.unpublished],
  );
  const totals = cartTotals(cart, fulfilment, region);

  const current = placed
    ? (state.orders.find((o) => o.orderId === placed.orderId) ?? placed)
    : null;

  if (!ready) return <p className="forme-empty">カートを読み込んでいます…</p>;

  if (step !== "done" && cart.lines.length === 0)
    return (
      <div className="forme-empty">
        <p>カートは空です。</p>
        <Link href="/forme/items" className="forme-button">
          商品を見る
        </Link>
      </div>
    );

  const place = () => {
    setBusy(true);
    setError("");
    const result = placeOrder({ fulfilment, region, note });
    setBusy(false);
    if (!result.ok || !result.order) {
      setError(result.reason ?? "注文できませんでした。");
      setStep("cart");
      return;
    }
    setPlaced(result.order);
    setStep("done");
  };

  const runPayment = () => {
    if (!current) return;
    setBusy(true);
    const result = pay(current.orderId, outcome);
    setBusy(false);
    setPaymentNote(result.detail ?? "");
  };

  return (
    <>
      <ol className="forme-steps" aria-label="注文の手順">
        {STEPS.map(([id, label], index) => (
          <li
            key={id}
            aria-current={step === id ? "step" : undefined}
            data-done={STEPS.findIndex(([s]) => s === step) > index}
          >
            <span>{index + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      {changes.length > 0 && (
        <div className="forme-note" role="status">
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
        <p className="forme-error" role="alert">
          {error}
        </p>
      )}

      {step === "cart" && (
        <>
          <ul className="forme-lines">
            {cart.lines.map((line) => {
              const product = productById(line.productId);
              if (!product) return null;
              return (
                <li key={line.lineId}>
                  <ProductMedia
                    product={product}
                    variantIds={line.variantIds}
                    size="thumb"
                  />
                  <div className="forme-line-body">
                    <Link href={`/forme/items/${product.id}`}>
                      {product.name}
                    </Link>
                    <p>
                      {describeVariants(product, line.variantIds).join("・") ||
                        "選択なし"}
                    </p>
                    <p className="forme-line-unit">
                      単価 {formatMoney(line.unitPrice)}
                    </p>
                  </div>
                  <label className="forme-line-qty">
                    <span className="sr-only">{product.name}の数量</span>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={line.quantity}
                      onChange={(e) => {
                        const result = setQuantity(
                          line.lineId,
                          Number(e.target.value) || 0,
                        );
                        setError(result.reason ?? "");
                      }}
                    />
                  </label>
                  <span className="forme-price">
                    {formatMoney({
                      ...line.unitPrice,
                      minorUnits: line.unitPrice.minorUnits * line.quantity,
                    })}
                  </span>
                  <button
                    type="button"
                    className="forme-button quiet"
                    onClick={() => removeLine(line.lineId)}
                  >
                    削除
                  </button>
                </li>
              );
            })}
          </ul>

          <Totals totals={totals} fulfilment={fulfilment} />

          <div className="forme-detail-actions">
            <Link href="/forme/items" className="forme-button secondary">
              買い物を続ける
            </Link>
            <button
              type="button"
              className="forme-button"
              onClick={() => setStep("delivery")}
            >
              受け取り方法へ
            </button>
          </div>
        </>
      )}

      {step === "delivery" && (
        <>
          <h2>受け取り方法</h2>
          <fieldset className="forme-axis">
            <legend>お届けか、お受け取りか</legend>
            <div className="forme-axis-options">
              {(["delivery", "pickup"] as Fulfilment[]).map((value) => (
                <label key={value} className="forme-option">
                  <input
                    type="radio"
                    name="fulfilment"
                    checked={fulfilment === value}
                    onChange={() => setFulfilment(value)}
                  />
                  <span>{FULFILMENT_LABELS[value]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {fulfilment === "delivery" ? (
            <label className="forme-field">
              <span>お届け地域</span>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              >
                {REGIONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
              <small>
                全国一律 {formatMoney(SHIPPING.flat)}、
                {formatMoney(SHIPPING.freeAbove)} 以上で無料。
                {
                  "北海道・東北と九州・沖縄は 300 円を加算します。住所は入力しません（地域だけで送料が決まる体験です）。"
                }
              </small>
            </label>
          ) : (
            <p className="forme-note">{PICKUP_NOTE}</p>
          )}

          <label className="forme-field">
            <span>ご要望（任意）</span>
            <textarea
              value={note}
              maxLength={200}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>

          <Totals totals={totals} fulfilment={fulfilment} />

          <div className="forme-detail-actions">
            <button
              type="button"
              className="forme-button secondary"
              onClick={() => setStep("cart")}
            >
              カートに戻る
            </button>
            <button
              type="button"
              className="forme-button"
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
          <ul className="forme-confirm-lines">
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

          <dl className="forme-summary">
            <div>
              <dt>受け取り</dt>
              <dd>
                {FULFILMENT_LABELS[fulfilment]}
                {fulfilment === "delivery" && `（${region}）`}
              </dd>
            </div>
          </dl>
          <Totals totals={totals} fulfilment={fulfilment} />
          {note && <p className="forme-fineprint">ご要望：{note}</p>}

          <div className="forme-detail-actions">
            <button
              type="button"
              className="forme-button secondary"
              onClick={() => setStep("delivery")}
            >
              受け取り方法に戻る
            </button>
            <button
              type="button"
              className="forme-button"
              disabled={busy}
              onClick={place}
            >
              {busy ? "処理中…" : "この内容で注文する"}
            </button>
          </div>
        </>
      )}

      {step === "done" && current && (
        <>
          <div className="forme-done">
            <p className="forme-eyebrow">ご注文を承りました</p>
            <p className="forme-reference">{current.reference}</p>
            <p>
              {FULFILMENT_LABELS[current.fulfilment]}
              {current.region && `（${current.region}）`}・
              {formatMoney(current.total)}
              <br />
              お支払い状況：{PAYMENT_LABELS[current.payment]}
            </p>
          </div>

          <section className="forme-payment">
            <h2>お支払いを試す</h2>
            <p className="forme-note">{PAYMENT_DISCLOSURE}</p>
            <fieldset className="forme-axis">
              <legend>結果を選ぶ</legend>
              <div className="forme-axis-options">
                {PAYMENT_OUTCOMES.map((value) => (
                  <label key={value} className="forme-option">
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
            <p className="forme-fineprint">{OUTCOME_NOTES[outcome]}</p>
            {paymentNote && (
              <p className="forme-note" role="status" aria-live="polite">
                {paymentNote}
              </p>
            )}
            {current.fulfilment === "delivery" &&
              current.payment !== "paid" && (
                <p className="forme-note">
                  配送のご注文は、お支払いが確認できるまで発送できません。
                </p>
              )}
            <div className="forme-detail-actions">
              <button
                type="button"
                className="forme-button"
                disabled={busy}
                onClick={runPayment}
              >
                この結果で試す
              </button>
              <Link href="/forme/my" className="forme-button secondary">
                注文状況を見る
              </Link>
            </div>
          </section>

          <ul className="forme-history">
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

function Totals({
  totals,
  fulfilment,
}: {
  totals: ReturnType<typeof cartTotals>;
  fulfilment: Fulfilment;
}) {
  return (
    <>
      <dl className="forme-summary totals">
        <div>
          <dt>商品 {totals.count} 点</dt>
          <dd>{formatMoney(totals.subtotal)}</dd>
        </div>
        <div>
          <dt>{fulfilment === "pickup" ? "受け取り" : "送料"}</dt>
          <dd>
            {totals.shipping.minorUnits === 0
              ? "無料"
              : formatMoney(totals.shipping)}
          </dd>
        </div>
        <div className="forme-summary-total">
          <dt>合計</dt>
          <dd>{formatMoney(totals.total)}</dd>
        </div>
      </dl>
      {totals.toFreeShipping && (
        <p className="forme-fineprint">
          あと {formatMoney(totals.toFreeShipping)} で送料が無料になります。
        </p>
      )}
      <p className="forme-fineprint">{TAX_NOTE}</p>
    </>
  );
}
