import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/lib/portfolio";
import { caseLabels } from "@/lib/sales-ui";
import { previewPath } from "@/lib/preview";

const direction: Record<
  string,
  { line: string; detail: string; image?: string; alt: string }
> = {
  cafe: {
    line: "A quiet moment, online.",
    detail: "COFFEE / SPACE / CRAFT",
    image: "/visuals/kissa-interior-v1.webp",
    alt: "KISSAの世界観：自然光と木の家具に囲まれた架空カフェ",
  },
  saas: {
    line: "Less noise. More flow.",
    detail: "PRODUCT / STRUCTURE / CLARITY",
    alt: "FLOWSTATEの実装済みLP：チームの作業を整理するプロダクトUI",
  },
  ec: {
    line: "Made for the everyday.",
    detail: "OBJECT / TEXTURE / COMMERCE",
    image: "/visuals/forme-sage-v1.webp",
    alt: "FORMEの世界観：石のデスクに置かれたセージ色の架空タンブラー",
  },
  inbox: {
    line: "From inbox to action.",
    detail: "INPUT / PROCESS / REVIEW / OUTPUT",
    alt: "SMART INBOXの実装済み画面：問い合わせの分類・下書き・人による確認",
  },
};

export function ProjectFeature({
  project: p,
  index,
}: {
  project: Project;
  index: number;
}) {
  const art = direction[p.slug];
  return (
    <article
      className={`project-card project-feature feature-${p.slug}`}
      data-project={p.slug}
    >
      <div className="feature-copy">
        <div className="feature-meta">
          <span>
            {String(index + 1).padStart(2, "0")} / {caseLabels[p.slug]}
          </span>
          <span>SELF-INITIATED DEMO</span>
        </div>
        <h3>
          <Link href={`/projects/${p.slug}`}>{p.title}</Link>
        </h3>
        <p className="feature-line" lang="en">
          {art.line}
        </p>
        <p className="feature-description">{p.summary}</p>
        <p className="feature-role">
          ROLE / DESIGN · BUILD · QA
          <br />
          {p.tech.join(" / ")}
        </p>
        <dl className="project-estimate" data-price-info>
          <div>
            <dt>参考価格 / PRICE GUIDE</dt>
            <dd>{p.price}</dd>
          </div>
          <div>
            <dt>納期目安 / DELIVERY</dt>
            <dd>{p.duration}</dd>
          </div>
        </dl>
        <div className="project-actions">
          <Link
            href={`/projects/${p.slug}`}
            aria-label={`${p.title}の詳細を見る`}
          >
            詳細を見る <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <Link href={`/demos/${p.slug}`} data-live-demo={p.slug}>
            Live Demo <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
      <div className="feature-art">
        <Link
          href={`/projects/${p.slug}`}
          className="feature-picture"
          tabIndex={-1}
          aria-hidden="true"
        >
          <Image
            className="feature-main-image"
            src={art.image ?? previewPath(p.slug, "desktop")}
            alt={art.alt}
            width={art.image ? 1200 : 1440}
            height={art.image ? 800 : 1000}
            sizes="(max-width: 700px) 90vw, (max-width: 1440px) 53vw, 760px"
          />
          <Image
            className="feature-detail-image"
            src={
              p.slug === "cafe"
                ? "/visuals/kissa-coffee-v1.webp"
                : p.slug === "ec"
                  ? "/visuals/forme-texture-v1.webp"
                  : previewPath(p.slug, "mobile")
            }
            alt=""
            width={p.slug === "cafe" ? 1200 : p.slug === "ec" ? 480 : 390}
            height={p.slug === "cafe" ? 800 : p.slug === "ec" ? 720 : 844}
            sizes="(max-width: 700px) 30vw, 18vw"
          />
          <span className="feature-art-label">{art.detail}</span>
        </Link>
        {p.slug === "inbox" && (
          <ol className="feature-workflow" aria-label="AI導入時の業務設計例">
            <li>受信</li>
            <li>AI処理設計</li>
            <li>人が確認</li>
            <li>下書き出力</li>
          </ol>
        )}
        <p className="feature-caption">
          {art.image
            ? "AI生成による架空の店舗・商品のイメージ"
            : p.slug === "inbox"
              ? "実デモは固定ルールで処理。AI API・メール送信なし。"
              : "実装済みLPの画面 / プロダクトUIはコンセプト"}
        </p>
      </div>
    </article>
  );
}
