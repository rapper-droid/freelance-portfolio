"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { categories, projects, type CategoryId } from "@/lib/portfolio";
import { ProjectArt } from "./project-art";
export function PortfolioGrid() {
  const [selected, setSelected] = useState<CategoryId | "all">("all");
  const shown =
    selected === "all"
      ? projects
      : projects.filter((p) => p.categories.includes(selected));
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
          すべて<span>{projects.length}</span>
        </button>
        {categories.map((c) => (
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
            : categories.find((c) => c.id === selected)?.name}{" "}
          <span> / {shown.length} PROJECTS</span>
        </p>
        {selected !== "all" && (
          <Link href={`/works/${selected}`} className="text-link">
            この仕事の料金・納品物 <ArrowRight size={16} />
          </Link>
        )}
      </div>
      <div className="project-grid">
        {shown.map((p) => (
          <Link
            href={`/projects/${p.slug}`}
            className="project-card"
            key={p.slug}
            data-project={p.slug}
          >
            <ProjectArt project={p} />
            <div className="project-card-copy">
              <div className="project-card-meta">
                <span>SELF-INITIATED DEMO</span>
                <ArrowUpRight size={20} />
              </div>
              <h3>
                {p.title}
                <small>{p.name}</small>
              </h3>
              <p>{p.summary}</p>
              <div className="project-card-tags">
                {p.categories.slice(0, 3).map((id) => (
                  <span key={id}>
                    {categories.find((c) => c.id === id)?.short}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
      <p className="honesty-note">
        掲載作品はすべて自主制作です。企業名・商品・業務データは架空で、受託実績・導入実績ではありません。
      </p>
    </section>
  );
}
