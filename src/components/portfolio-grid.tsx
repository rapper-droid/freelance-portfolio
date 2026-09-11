"use client";
import { Children, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CategoryId } from "@/lib/portfolio";
export function PortfolioGrid({
  items,
  categoryOptions,
  children,
}: {
  items: { slug: string; categories: CategoryId[] }[];
  categoryOptions: { id: CategoryId; name: string }[];
  children: ReactNode;
}) {
  const [selected, setSelected] = useState<CategoryId | "all">("all");
  const count = items.filter(
    (p) => selected === "all" || p.categories.includes(selected),
  ).length;
  return (
    <section className="hub-section" id="works">
      <div className="hub-section-head">
        <div>
          <span className="eyebrow">01 / FIND YOUR PROJECT</span>
          <h2>何を依頼したいですか？</h2>
        </div>
        <p>
          依頼したい仕事から、制作例を探す。
          <br />
          すべて実際に操作できる自主制作です。
        </p>
      </div>
      <div className="category-filter" aria-label="作品カテゴリ">
        <button
          aria-pressed={selected === "all"}
          onClick={() => setSelected("all")}
        >
          すべて<span>{items.length}</span>
        </button>
        {categoryOptions.map((c) => (
          <button
            key={c.id}
            aria-pressed={selected === c.id}
            onClick={() => setSelected(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>
      <div className="selection-caption">
        <p aria-live="polite">
          {selected === "all"
            ? "すべての制作例"
            : categoryOptions.find((c) => c.id === selected)?.name}{" "}
          <span> / {count} PROJECTS</span>
        </p>
        {selected !== "all" && (
          <Link href={`/works/${selected}`} className="text-link">
            この仕事の料金・納品物 <ArrowRight size={16} />
          </Link>
        )}
      </div>
      <div className="project-grid">
        {Children.toArray(children).filter(
          (_, i) =>
            selected === "all" || items[i].categories.includes(selected),
        )}
      </div>
      <p className="honesty-note">
        掲載作品はすべて自主制作です。企業名・商品・業務データは架空で、受託実績・導入実績ではありません。
      </p>
    </section>
  );
}
