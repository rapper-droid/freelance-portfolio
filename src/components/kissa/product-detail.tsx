"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProductArt } from "./product-art";
import { useShop } from "./shop-provider";
import { unitPriceOf } from "@/lib/shop/cart";
import { formatMoney } from "@/lib/runtime/rules/money";
import type { Product, SaleState, VariantAxis } from "@/lib/shop/types";

/**
 * One product, with the choices it actually offers (指示書 §10).
 *
 * Axes are rendered only when the product has them — an espresso shows no
 * temperature switch, a cake shows no size — because offering a choice that
 * does not exist is how a menu stops being trusted.
 *
 * The price updates as choices change, using the same function the cart uses
 * to charge, so the number shown here is the number that ends up on the line.
 */

const AXIS_LABELS: Record<VariantAxis, string> = {
  temperature: "温度",
  size: "サイズ",
  addon: "追加・変更",
};

const SALE_LABELS: Record<SaleState, string> = {
  on_sale: "販売中",
  sold_out: "売り切れ",
  closed_for_now: "いまの時間は承っていません",
  ended: "販売終了",
};

const minuteLabel = (minute: number) =>
  `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;

export function ProductDetail({ product }: { product: Product }) {
  const router = useRouter();
  const { addToCart, state, ready } = useShop();

  const axes = useMemo(() => {
    const grouped = new Map<VariantAxis, typeof product.variants>();
    for (const variant of product.variants) {
      const list = grouped.get(variant.axis) ?? [];
      list.push(variant);
      grouped.set(variant.axis, list);
    }
    return [...grouped.entries()];
  }, [product]);

  // Exclusive axes default to their first option; add-ons default to none.
  const [selection, setSelection] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const [axis, variants] of (() => {
      const grouped = new Map<VariantAxis, typeof product.variants>();
      for (const v of product.variants) {
        const list = grouped.get(v.axis) ?? [];
        list.push(v);
        grouped.set(v.axis, list);
      }
      return [...grouped.entries()];
    })())
      if (axis !== "addon") initial[axis] = variants[0].id;
    return initial;
  });
  const [addons, setAddons] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const variantIds = [...Object.values(selection), ...addons];
  const unit = unitPriceOf(product, variantIds);
  const sale: SaleState = ready
    ? (state.saleOverrides[product.id] ?? product.saleState)
    : product.saleState;
  const orderable = sale === "on_sale";

  const submit = () => {
    setError("");
    setMessage("");
    const result = addToCart({ productId: product.id, variantIds, quantity });
    if (!result.ok) {
      setError(result.reason ?? "カートに入れられませんでした。");
      return;
    }
    setMessage(`${product.name}を ${quantity} 点カートに入れました。`);
  };

  return (
    <div className="kissa-detail">
      <div className="kissa-detail-art">
        <ProductArt product={product} size="detail" />
      </div>

      <div className="kissa-detail-body">
        <nav aria-label="パンくず" className="kissa-crumbs">
          <Link href="/kissa/menu">メニュー</Link>
          <span aria-hidden="true">›</span>
          <span>{product.name}</span>
        </nav>

        <h1>{product.name}</h1>
        <p className="kissa-detail-summary">{product.summary}</p>
        <p className="kissa-detail-description">{product.description}</p>

        <p className="kissa-detail-price">
          <span className="kissa-price">{formatMoney(unit)}</span>
          {unit.minorUnits !== product.price.minorUnits && (
            <small>（基本 {formatMoney(product.price)} ＋ 選択分）</small>
          )}
        </p>

        {!orderable && (
          <p className="kissa-error" role="status">
            {SALE_LABELS[sale]}。
            <Link href="/kissa/menu"> ほかのメニューを見る</Link>
          </p>
        )}

        {axes.map(([axis, variants]) => (
          <fieldset key={axis} className="kissa-axis">
            <legend>{AXIS_LABELS[axis]}</legend>
            <div className="kissa-axis-options">
              {variants.map((variant) => {
                const checked =
                  axis === "addon"
                    ? addons.includes(variant.id)
                    : selection[axis] === variant.id;
                return (
                  <label key={variant.id} className="kissa-option">
                    <input
                      type={axis === "addon" ? "checkbox" : "radio"}
                      name={`axis-${axis}`}
                      checked={checked}
                      disabled={variant.saleState !== "on_sale" || !orderable}
                      onChange={(e) => {
                        if (axis === "addon")
                          setAddons((prev) =>
                            e.target.checked
                              ? [...prev, variant.id]
                              : prev.filter((id) => id !== variant.id),
                          );
                        else
                          setSelection((prev) => ({
                            ...prev,
                            [axis]: variant.id,
                          }));
                      }}
                    />
                    <span>{variant.label}</span>
                    {variant.extra.minorUnits > 0 && (
                      <small>＋{formatMoney(variant.extra)}</small>
                    )}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}

        <div className="kissa-detail-actions">
          <label className="kissa-field kissa-quantity">
            <span>数量</span>
            <input
              type="number"
              min={1}
              max={20}
              value={quantity}
              disabled={!orderable}
              onChange={(e) =>
                setQuantity(
                  Math.max(1, Math.min(20, Number(e.target.value) || 1)),
                )
              }
            />
          </label>
          <button
            type="button"
            className="kissa-button"
            disabled={!orderable}
            onClick={submit}
          >
            カートに入れる
          </button>
          <button
            type="button"
            className="kissa-button secondary"
            disabled={!orderable}
            onClick={() => {
              submit();
              router.push("/kissa/order");
            }}
          >
            カートへ進む
          </button>
        </div>

        <p role="status" aria-live="polite" className="kissa-feedback">
          {error ? <span className="kissa-error">{error}</span> : message}
        </p>

        <dl className="kissa-spec">
          <div>
            <dt>提供までの目安</dt>
            <dd>約 {product.prepMinutes} 分</dd>
          </div>
          {(product.servedFrom !== undefined ||
            product.servedTo !== undefined) && (
            <div>
              <dt>提供時間</dt>
              <dd>
                {minuteLabel(product.servedFrom ?? 0)} –{" "}
                {minuteLabel(product.servedTo ?? 24 * 60)}
              </dd>
            </div>
          )}
          <div>
            <dt>アレルゲン</dt>
            <dd>
              {product.allergens.length
                ? product.allergens.join("・")
                : "この商品には記載がありません"}
            </dd>
          </div>
          {product.caffeine && (
            <div>
              <dt>カフェイン</dt>
              <dd>
                {product.caffeine === "none"
                  ? "ノンカフェイン"
                  : product.caffeine === "low"
                    ? "少なめ"
                    : "通常"}
              </dd>
            </div>
          )}
        </dl>
        <p className="kissa-fineprint">
          アレルゲンは、このデモのレシピ資料に記載がある項目のみ表示しています。
          栄養や健康に関する表示は行っていません。
        </p>
      </div>
    </div>
  );
}
