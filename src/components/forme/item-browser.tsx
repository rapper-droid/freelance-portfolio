"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Heart, Search } from "lucide-react";
import { ProductMedia } from "./product-media";
import { useForme } from "./forme-provider";
import {
  CATEGORY_LABELS,
  colourOf,
  products,
  variantsOn,
} from "@/lib/forme/catalog";
import {
  anyInStock,
  levelOf,
  skuKey,
  skusOf,
  stockFor,
  stockLabel,
  totalStock,
} from "@/lib/forme/stock";
import { formatMoney } from "@/lib/runtime/rules/money";
import type { FormeCategory, FormeProduct } from "@/lib/forme/types";

/**
 * The shop front (指示書 §16).
 *
 * Filter by what it is, search the words a customer would use, keep the ones
 * worth coming back to, and compare up to three side by side.
 *
 * The sort options are the ones a shop can justify: name, price and how much
 * is left. There is no "popular" and no "recommended", because this shop has
 * no customers and inventing a ranking would be inventing social proof.
 */

type Sort = "catalogue" | "price-asc" | "price-desc" | "stock";

const SORT_LABELS: Record<Sort, string> = {
  catalogue: "掲載順",
  "price-asc": "価格が安い順",
  "price-desc": "価格が高い順",
  stock: "在庫が多い順",
};

export const MAX_COMPARE = 3;

export function ItemBrowser({
  initialCategory = "",
}: {
  initialCategory?: string;
}) {
  const { state, ready, toggleFavourite } = useForme();
  const [category, setCategory] = useState(initialCategory);
  const [query, setQuery] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("catalogue");
  const [compare, setCompare] = useState<string[]>([]);

  const deltas = state.stockDeltas;
  const hidden = state.unpublished;

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = products
      .filter((p) => p.published && !hidden.includes(p.id))
      .filter((p) => (category ? p.category === category : true))
      .filter((p) =>
        needle
          ? [p.name, p.code, p.summary, p.description].some((text) =>
              text.toLowerCase().includes(needle),
            )
          : true,
      )
      .filter((p) => (inStockOnly ? anyInStock(p, deltas) : true))
      .filter((p) => (favouritesOnly ? state.favourites.includes(p.id) : true));

    const sorted = [...list];
    if (sort === "price-asc")
      sorted.sort((a, b) => a.price.minorUnits - b.price.minorUnits);
    else if (sort === "price-desc")
      sorted.sort((a, b) => b.price.minorUnits - a.price.minorUnits);
    else if (sort === "stock")
      sorted.sort((a, b) => totalStock(b, deltas) - totalStock(a, deltas));
    else sorted.sort((a, b) => a.order - b.order);
    return sorted;
  }, [
    category,
    query,
    inStockOnly,
    favouritesOnly,
    sort,
    deltas,
    hidden,
    state.favourites,
  ]);

  const categories = Object.entries(CATEGORY_LABELS) as Array<
    [FormeCategory, string]
  >;
  const countIn = (id: FormeCategory) =>
    products.filter(
      (p) => p.category === id && p.published && !hidden.includes(p.id),
    ).length;

  const compared = compare
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is FormeProduct => !!p);

  const toggleCompare = (id: string) =>
    setCompare((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= MAX_COMPARE
          ? prev
          : [...prev, id],
    );

  return (
    <>
      <div className="forme-filters">
        <div
          className="forme-chip-row"
          role="group"
          aria-label="分類で絞り込む"
        >
          <button
            type="button"
            className="forme-chip"
            aria-pressed={category === ""}
            onClick={() => setCategory("")}
          >
            すべて
            <span>
              {
                products.filter((p) => p.published && !hidden.includes(p.id))
                  .length
              }
            </span>
          </button>
          {categories.map(([id, label]) => (
            <button
              key={id}
              type="button"
              className="forme-chip"
              aria-pressed={category === id}
              onClick={() => setCategory(id)}
            >
              {label}
              <span>{countIn(id)}</span>
            </button>
          ))}
        </div>

        <div className="forme-filter-row">
          <label className="forme-field forme-search">
            <span>
              <Search size={15} aria-hidden="true" /> 商品を探す
            </span>
            <input
              type="search"
              value={query}
              placeholder="例：タンブラー、トート、ふた"
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label className="forme-field">
            <span>並び順</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
            >
              {(Object.keys(SORT_LABELS) as Sort[]).map((value) => (
                <option key={value} value={value}>
                  {SORT_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="forme-toggle">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
            />
            <span>在庫があるものだけ</span>
          </label>
          <label className="forme-toggle">
            <input
              type="checkbox"
              checked={favouritesOnly}
              onChange={(e) => setFavouritesOnly(e.target.checked)}
            />
            <span>お気に入りだけ（{state.favourites.length}）</span>
          </label>
        </div>
      </div>

      <p className="forme-result-count" role="status" aria-live="polite">
        {visible.length} 件を表示しています。
      </p>

      {visible.length === 0 ? (
        <div className="forme-empty">
          <p>条件に合う商品がありませんでした。</p>
          <button
            type="button"
            className="forme-button secondary"
            onClick={() => {
              setCategory("");
              setQuery("");
              setInStockOnly(false);
              setFavouritesOnly(false);
            }}
          >
            条件をすべて外す
          </button>
        </div>
      ) : (
        <ul className="forme-grid">
          {visible.map((product) => {
            const stock = totalStock(product, deltas);
            const favourite = ready && state.favourites.includes(product.id);
            const colours = variantsOn(product, "color");
            return (
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

                {colours.length > 0 && (
                  <ul className="forme-swatches" aria-label="取り扱いカラー">
                    {colours.map((colour) => (
                      <li key={colour.id}>
                        <span
                          className="forme-swatch"
                          style={{ background: colour.swatch }}
                          aria-hidden="true"
                        />
                        <span className="sr-only">{colour.label}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="forme-card-foot">
                  <span className="forme-price">
                    {formatMoney(product.price)}
                    {product.variants.some((v) => v.extra.minorUnits > 0) && (
                      <small>〜</small>
                    )}
                  </span>
                  <span className="forme-badge" data-level={levelOf(stock)}>
                    {stockLabel(stock)}
                  </span>
                </div>

                <div className="forme-card-actions">
                  <button
                    type="button"
                    className="forme-icon-button"
                    aria-pressed={favourite}
                    aria-label={`${product.name}をお気に入りに${favourite ? "登録済み" : "登録する"}`}
                    onClick={() => toggleFavourite(product.id)}
                  >
                    <Heart
                      size={16}
                      aria-hidden="true"
                      fill={favourite ? "currentColor" : "none"}
                    />
                  </button>
                  <label className="forme-toggle compact">
                    <input
                      type="checkbox"
                      checked={compare.includes(product.id)}
                      disabled={
                        !compare.includes(product.id) &&
                        compare.length >= MAX_COMPARE
                      }
                      onChange={() => toggleCompare(product.id)}
                    />
                    <span>比較</span>
                  </label>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {compared.length > 0 && (
        <section className="forme-compare" aria-labelledby="forme-compare-head">
          <div className="forme-compare-head">
            <h2 id="forme-compare-head">
              比較（{compared.length} / {MAX_COMPARE}）
            </h2>
            <button
              type="button"
              className="forme-button quiet"
              onClick={() => setCompare([])}
            >
              比較をやめる
            </button>
          </div>
          <div
            className="forme-table-scroll"
            tabIndex={0}
            role="region"
            aria-label="比較表"
          >
            <table className="forme-table">
              <caption className="sr-only">選んだ商品の比較</caption>
              <thead>
                <tr>
                  <th scope="col">項目</th>
                  {compared.map((product) => (
                    <th key={product.id} scope="col">
                      {product.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">価格</th>
                  {compared.map((p) => (
                    <td key={p.id}>{formatMoney(p.price)}</td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">重さ</th>
                  {compared.map((p) => (
                    <td key={p.id}>約 {p.weightGrams} g</td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">カラー</th>
                  {compared.map((p) => (
                    <td key={p.id}>
                      {variantsOn(p, "color")
                        .map((v) => v.label)
                        .join("・") || "—"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">在庫</th>
                  {compared.map((p) => (
                    <td key={p.id}>{stockLabel(totalStock(p, deltas))}</td>
                  ))}
                </tr>
                {["素材", "容量", "食洗機"].map((label) => (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    {compared.map((p) => (
                      <td key={p.id}>
                        {p.spec.find(([k]) => k === label)?.[1] ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <th scope="row">詳細</th>
                  {compared.map((p) => (
                    <td key={p.id}>
                      <Link href={`/forme/items/${p.id}`}>商品ページへ</Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}

/** How many of a specific combination are left, for the detail screen. */
export const stockOf = (
  product: FormeProduct,
  variantIds: readonly string[],
  deltas: Record<string, number>,
) => stockFor(product.id, variantIds, deltas);

export { skuKey, skusOf, colourOf };
