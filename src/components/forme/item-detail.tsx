"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { ProductArt } from "./product-art";
import { ProductMedia, imagesFor } from "./product-media";
import { useForme } from "./forme-provider";
import { unitPriceOf } from "@/lib/forme/cart";
import {
  AXIS_LABELS,
  TAX_NOTE,
  axesOf,
  colourOf,
  variantsOn,
} from "@/lib/forme/catalog";
import { levelOf, stockFor, stockLabel } from "@/lib/forme/stock";
import { formatMoney } from "@/lib/runtime/rules/money";
import type { FormeProduct } from "@/lib/forme/types";

/**
 * One product (指示書 §16).
 *
 * Changing a choice moves everything it should move: the picture, the price,
 * the stock line and, once it is in the cart, the cart line. That is the
 * requirement, and it works because all four read the same selection rather
 * than each keeping their own idea of what is chosen.
 *
 * A combination that is out of stock is still selectable — a customer is
 * allowed to find out that the charcoal 750ml is gone — but it cannot be
 * added, and the screen says which combination is missing rather than
 * greying the whole product out.
 */
export function ItemDetail({ product }: { product: FormeProduct }) {
  const router = useRouter();
  const { addToCart, state, ready, toggleFavourite } = useForme();

  const axes = useMemo(() => axesOf(product), [product]);
  const [selection, setSelection] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      axesOf(product).map((axis) => [axis, variantsOn(product, axis)[0].id]),
    ),
  );
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const variantIds = axes.map((axis) => selection[axis]).filter(Boolean);
  const unit = unitPriceOf(product, variantIds);
  const colourId = colourOf(product, variantIds);
  const images = imagesFor(product, colourId);
  const stock = stockFor(product.id, variantIds, state.stockDeltas);
  const hidden = state.unpublished.includes(product.id);
  const orderable = ready && stock > 0 && !hidden;
  const favourite = ready && state.favourites.includes(product.id);

  const choose = (axis: string, id: string) => {
    setSelection((prev) => ({ ...prev, [axis]: id }));
    // A different colour is a different set of pictures; keeping the index
    // would show the second photograph of a colour that has only one.
    if (axis === "color") setImageIndex(0);
    setMessage("");
    setError("");
  };

  const submit = (thenCart = false) => {
    setError("");
    setMessage("");
    const result = addToCart({ productId: product.id, variantIds, quantity });
    if (!result.ok) {
      setError(result.reason ?? "カートに入れられませんでした。");
      return;
    }
    setMessage(`${product.name}を ${quantity} 点カートに入れました。`);
    if (thenCart) router.push("/forme/cart");
  };

  return (
    <div className="forme-detail">
      <div className="forme-detail-media">
        <div className="forme-detail-main">
          <ProductMedia
            product={product}
            variantIds={variantIds}
            size="detail"
            index={imageIndex}
            priority
          />
        </div>

        {images.length > 1 ? (
          <ul className="forme-thumbs" aria-label="商品画像">
            {images.map((image, index) => (
              <li key={image.src ?? index}>
                <button
                  type="button"
                  className="forme-thumb"
                  aria-pressed={imageIndex === index}
                  aria-label={image.caption}
                  onClick={() => setImageIndex(index)}
                >
                  <ProductMedia
                    product={product}
                    variantIds={variantIds}
                    size="thumb"
                    index={index}
                  />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          images.length === 0 && (
            <p className="forme-fineprint">
              この商品はこのサイト内で描いた図版です。実物の写真ではありません。
            </p>
          )
        )}
        {images[imageIndex]?.caption && (
          <p className="forme-caption">{images[imageIndex].caption}</p>
        )}
      </div>

      <div className="forme-detail-body">
        <nav aria-label="パンくず" className="forme-crumbs">
          <Link href="/forme/items">商品一覧</Link>
          <span aria-hidden="true">›</span>
          <span>{product.name}</span>
        </nav>

        <span className="forme-code">{product.code}</span>
        <h1>{product.name}</h1>
        <p className="forme-detail-summary">{product.summary}</p>
        <p className="forme-detail-description">{product.description}</p>

        <p className="forme-detail-price">
          <span className="forme-price">{formatMoney(unit)}</span>
          {unit.minorUnits !== product.price.minorUnits && (
            <small>（基本 {formatMoney(product.price)} ＋ 選択分）</small>
          )}
        </p>
        <p className="forme-fineprint">{TAX_NOTE}</p>

        {hidden && (
          <p className="forme-error" role="status">
            この商品はいま取り扱っていません。
            <Link href="/forme/items"> ほかの商品を見る</Link>
          </p>
        )}

        {axes.map((axis) => (
          <fieldset key={axis} className="forme-axis">
            <legend>
              {AXIS_LABELS[axis]}：
              {variantsOn(product, axis).find((v) => v.id === selection[axis])
                ?.label ?? ""}
            </legend>
            <div className="forme-axis-options" data-axis={axis}>
              {variantsOn(product, axis).map((variant) => {
                const trial = axes.map((a) =>
                  a === axis ? variant.id : selection[a],
                );
                const left = stockFor(product.id, trial, state.stockDeltas);
                const checked = selection[axis] === variant.id;
                return (
                  <label
                    key={variant.id}
                    className="forme-option"
                    data-out={ready && left <= 0}
                  >
                    <input
                      type="radio"
                      name={`axis-${axis}`}
                      checked={checked}
                      onChange={() => choose(axis, variant.id)}
                    />
                    {variant.swatch ? (
                      <span
                        className="forme-swatch large"
                        style={{ background: variant.swatch }}
                        aria-hidden="true"
                      />
                    ) : null}
                    <span>{variant.label}</span>
                    {variant.extra.minorUnits > 0 && (
                      <small>＋{formatMoney(variant.extra)}</small>
                    )}
                    {ready && left <= 0 && <small>在庫切れ</small>}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}

        <p className="forme-stock" data-level={levelOf(stock)}>
          {ready ? stockLabel(stock) : "在庫を確認しています…"}
        </p>

        <div className="forme-detail-actions">
          <label className="forme-field forme-quantity">
            <span>数量</span>
            <input
              type="number"
              min={1}
              max={Math.max(1, Math.min(10, stock))}
              value={quantity}
              disabled={!orderable}
              onChange={(e) =>
                setQuantity(
                  Math.max(
                    1,
                    Math.min(
                      Math.min(10, Math.max(1, stock)),
                      Number(e.target.value) || 1,
                    ),
                  ),
                )
              }
            />
          </label>
          <button
            type="button"
            className="forme-button"
            disabled={!orderable}
            onClick={() => submit(false)}
          >
            カートに入れる
          </button>
          <button
            type="button"
            className="forme-button secondary"
            disabled={!orderable}
            onClick={() => submit(true)}
          >
            カートへ進む
          </button>
          <button
            type="button"
            className="forme-icon-button"
            aria-pressed={favourite}
            aria-label={`${product.name}をお気に入りに${favourite ? "登録済み" : "登録する"}`}
            onClick={() => toggleFavourite(product.id)}
          >
            <Heart
              size={18}
              aria-hidden="true"
              fill={favourite ? "currentColor" : "none"}
            />
          </button>
        </div>

        <p role="status" aria-live="polite" className="forme-feedback">
          {error ? <span className="forme-error">{error}</span> : message}
        </p>

        <dl className="forme-spec">
          {product.spec.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
          <div>
            <dt>重さ</dt>
            <dd>約 {product.weightGrams} g</dd>
          </div>
        </dl>

        <details className="forme-details">
          <summary>お届けとお支払いについて</summary>
          <p>
            配送は全国一律 600 円、8,000
            円以上で無料です。北海道・東北と九州・沖縄は 300
            円を加算します。店頭受け取りは送料がかかりません。
          </p>
          <p className="forme-fineprint">
            {
              "架空の店舗です。実際の配送・課金は発生しません。クーポンやポイントは用意していません（条件・期限・併用・上限まで実装していないものを、画面にだけ置かないためです）。"
            }
          </p>
        </details>
      </div>
    </div>
  );
}

export { ProductArt };
