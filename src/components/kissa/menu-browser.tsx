"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { ProductArt } from "./product-art";
import { useShop } from "./shop-provider";
import { CATEGORY_LABELS, products } from "@/lib/shop/catalog";
import { formatMoney } from "@/lib/runtime/rules/money";
import type { ProductCategory, SaleState } from "@/lib/shop/types";

/**
 * The menu (指示書 §10).
 *
 * Filter, search, and a switch for hiding what cannot be ordered right now.
 * Sale state comes from the shared store, so an operator marking the pudding
 * sold out is visible here immediately — the same record, not a second copy.
 */

const SALE_LABELS: Record<SaleState, string> = {
  on_sale: "販売中",
  sold_out: "売り切れ",
  closed_for_now: "時間外",
  ended: "販売終了",
};

export function MenuBrowser({
  initialCategory = "",
}: {
  initialCategory?: string;
}) {
  const { state, ready } = useShop();
  const [category, setCategory] = useState(initialCategory);
  const [query, setQuery] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const overrides = state.saleOverrides;
  const saleStateOf = useCallback(
    (id: string, fallback: SaleState): SaleState => overrides[id] ?? fallback,
    [overrides],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products
      .filter((p) => (category ? p.category === category : true))
      .filter((p) =>
        needle
          ? [p.name, p.summary, p.description].some((text) =>
              text.toLowerCase().includes(needle),
            )
          : true,
      )
      .filter((p) =>
        onlyAvailable ? saleStateOf(p.id, p.saleState) === "on_sale" : true,
      )
      .sort((a, b) => a.order - b.order);
  }, [category, query, onlyAvailable, saleStateOf]);

  const categories = Object.entries(CATEGORY_LABELS) as Array<
    [ProductCategory, string]
  >;

  return (
    <>
      <div className="kissa-filters">
        <div
          className="kissa-chip-row"
          role="group"
          aria-label="分類で絞り込む"
        >
          <button
            type="button"
            className="kissa-chip"
            aria-pressed={category === ""}
            onClick={() => setCategory("")}
          >
            すべて<span>{products.length}</span>
          </button>
          {categories.map(([id, label]) => (
            <button
              key={id}
              type="button"
              className="kissa-chip"
              aria-pressed={category === id}
              onClick={() => setCategory(id)}
            >
              {label}
              <span>{products.filter((p) => p.category === id).length}</span>
            </button>
          ))}
        </div>

        <div className="kissa-filter-row">
          <label className="kissa-field kissa-search">
            <span>メニューを探す</span>
            <input
              type="search"
              value={query}
              placeholder="例：ラテ、ほうじ茶、トースト"
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label className="kissa-toggle">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
            />
            <span>いま注文できるものだけ</span>
          </label>
        </div>
      </div>

      <p className="kissa-result-count" role="status" aria-live="polite">
        {visible.length} 品を表示しています。
      </p>

      {visible.length === 0 ? (
        <div className="kissa-empty">
          <p>条件に合うメニューがありませんでした。</p>
          <button
            type="button"
            className="kissa-button secondary"
            onClick={() => {
              setCategory("");
              setQuery("");
              setOnlyAvailable(false);
            }}
          >
            条件をすべて外す
          </button>
        </div>
      ) : (
        <ul className="kissa-grid">
          {visible.map((product) => {
            const sale = ready
              ? saleStateOf(product.id, product.saleState)
              : product.saleState;
            return (
              <li key={product.id} className="kissa-card">
                <Link
                  href={`/kissa/menu/${product.id}`}
                  className="kissa-card-link"
                >
                  <ProductArt product={product} />
                  {/* h2, not h3: the menu page's only heading above these is
                      its h1, and skipping a level is a real reading failure,
                      not a styling preference (指示書 §21). */}
                  <h2>{product.name}</h2>
                  <p className="kissa-card-summary">{product.summary}</p>
                </Link>
                <div className="kissa-card-foot">
                  <span className="kissa-price">
                    {formatMoney(product.price)}
                  </span>
                  <span className="kissa-badge" data-state={sale}>
                    {SALE_LABELS[sale]}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
