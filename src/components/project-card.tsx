import "./project-card.css";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { categories, type Project } from "@/lib/portfolio";
import { caseLabels } from "@/lib/sales-ui";
import { previewPath } from "@/lib/preview";
export function ProjectCard({ project: p }: { project: Project }) {
  return (
    <article className="project-card" data-project={p.slug}>
      <Link
        className="project-preview"
        href={`/projects/${p.slug}`}
        tabIndex={-1}
        aria-hidden="true"
      >
        <div className="preview-chrome">
          <i />
          <i />
          <i />
          <span>DESKTOP / MOBILE</span>
        </div>
        <Image
          className="preview-desktop"
          src={previewPath(p.slug, "desktop")}
          alt=""
          width={1440}
          height={1000}
          sizes="(max-width: 700px) 85vw, 42vw"
        />
        <Image
          className="preview-mobile"
          src={previewPath(p.slug, "mobile")}
          alt=""
          width={390}
          height={844}
          sizes="(max-width: 700px) 42vw, 12vw"
        />
      </Link>
      <div className="project-card-copy">
        <div className="project-card-meta">
          <span>{categories.find((c) => c.id === p.categories[0])?.short}</span>
          <span>SELF-INITIATED DEMO</span>
        </div>
        <h3>
          <Link href={`/projects/${p.slug}`}>
            {p.title}
            {caseLabels[p.slug] && <span> — {caseLabels[p.slug]}</span>}
          </Link>
          <small>{p.name}</small>
        </h3>
        <p>{p.summary}</p>
        <div className="project-card-tags">
          {p.tech.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
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
          <Link href={`/demos/${p.slug}`} data-live-demo={p.slug}>
            Live Demo <ArrowUpRight size={16} />
          </Link>
          <Link
            href={`/projects/${p.slug}`}
            aria-label={`${p.title}の詳細を見る`}
          >
            詳細を見る <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}
