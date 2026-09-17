import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { categories, projects, getProject, pricingNote } from "@/lib/portfolio";
import "@/components/portfolio-styles.css";
import { pageMetadata } from "@/lib/seo";
import { Header, Footer } from "@/components/site";
import { MessageOnly } from "@/components/sales-sections";
import { caseLabels } from "@/lib/sales-ui";
import { previewPath } from "@/lib/preview";
import { ProjectVisualStory } from "@/components/project-visuals";
import { Contact } from "@/components/contact";
// Known paths are prerendered; unknown paths render the explicit notFound() boundary.
export const generateStaticParams = () =>
  projects.map((p) => ({ slug: p.slug }));
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const p = getProject((await params).slug);
  if (!p) notFound();
  return pageMetadata(
    `${p.title} — ${p.name}`,
    `${p.summary} 自主制作の制作概要・納品物・料金・QAをご紹介。`,
    `/projects/${p.slug}`,
  );
}
export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const p = getProject((await params).slug);
  if (!p) notFound();
  return (
    <>
      <Header />
      <main
        id="main"
        className={`sales-hub sales-ui case-ui case-${p.slug}`}
        data-project-detail={p.slug}
      >
        <section className="hub-section case-hero">
          <div>
            <Link className="back" href="/works">
              ← 制作例一覧
            </Link>
            <p className="eyebrow">SELF-INITIATED DEMO / 自主制作</p>
            <h1>
              {p.title}
              {caseLabels[p.slug] && <span> — {caseLabels[p.slug]}</span>}
              <small>{p.name}</small>
            </h1>
            <p className="eyebrow case-overview">OVERVIEW</p>
            <p>{p.summary}</p>
            <div className="project-card-tags">
              {p.tech.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
            <Link
              href={`/demos/${p.slug}`}
              className="button primary"
              data-live-demo={p.slug}
            >
              Live Demoを操作する <ArrowUpRight size={16} />
            </Link>
            <p className="honesty-note">{p.limitation}</p>
          </div>
          <figure className="case-main-visual">
            <div className="preview-chrome">
              <i />
              <i />
              <i />
              <span>MAIN VISUAL / LIVE DEMO</span>
            </div>
            <Image
              src={previewPath(p.slug, "desktop")}
              alt={`${p.title}の実装済みDesktop画面`}
              width={1440}
              height={1000}
              sizes="(max-width: 700px) 90vw, 45vw"
              preload
            />
            <figcaption>実際に操作できる自主制作デモ</figcaption>
          </figure>
          <dl className="case-facts" data-price-info>
            <div>
              <dt>SCOPE</dt>
              <dd>Design + Build + QA</dd>
            </div>
            <div>
              <dt>EST. DELIVERY / 納期目安</dt>
              <dd>{p.duration}</dd>
            </div>
            <div>
              <dt>PRICE GUIDE / 参考価格</dt>
              <dd>{p.price}</dd>
            </div>
          </dl>
        </section>
        <ProjectVisualStory slug={p.slug} />
        <section className="hub-section case-content">
          <div className="case-stories">
            {[
              ["ASSUMED CLIENT BRIEF", "想定依頼", p.brief],
              ["CHALLENGE", "制作上の課題", p.challenge],
              ["SOLUTION", "解決のための実装", p.solution],
              ["DESIGN CONCEPT", "制作コンセプト", p.concept],
              [
                "RESPONSIVE DESIGN",
                "画面ごとの最適化",
                "PCは情報の比較しやすさ、タブレットはカラム幅、モバイルは読む順番とタップ領域を調整。表や操作UIは画面幅に合わせて配置します。",
              ],
            ].map(([label, title, text]) => (
              <article key={label}>
                <span className="eyebrow">{label}</span>
                <h2>{title}</h2>
                <p>{text}</p>
              </article>
            ))}
          </div>
          <h2>ひとつの体験を、どの画面でも。</h2>
          <p className="honesty-note">
            実際のデモを各画面幅で撮影したプレビューです。
          </p>
          <div className="device-grid">
            {[
              ["desktop", "Desktop Preview", 1440, 1000],
              ["tablet", "Tablet Preview", 768, 1024],
              ["mobile", "Mobile Preview", 390, 844],
            ].map(([device, label, width, height]) => (
              <figure key={device}>
                <Image
                  src={previewPath(p.slug, device)}
                  alt={`${p.name} / ${label}`}
                  width={Number(width)}
                  height={Number(height)}
                  sizes="(max-width: 700px) 90vw, 45vw"
                />
                <figcaption>{label}</figcaption>
              </figure>
            ))}
          </div>
          <div
            className="sales-grid case-details"
            id="delivery"
            data-delivery-info
            data-price-info
          >
            {[
              ["TECH STACK / 使用技術", p.tech.join(" / ")],
              ["対応範囲", "設計・デザイン・実装・内部QA・ドキュメント整理"],
              ["制作期間目安", p.duration],
              ["参考価格", p.price],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <p>{value}</p>
              </div>
            ))}
            {[
              ["実装した機能", p.features],
              ["DELIVERABLES / 納品可能物", p.deliverables],
              ["QA内容・確認項目", p.qa],
            ].map(([label, list]) => (
              <div key={String(label)}>
                <span>{label}</span>
                <ul className="case-list">
                  {(list as string[]).map((v) => (
                    <li key={v}>{v}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="honesty-note">
            {pricingNote}{" "}
            納品物は契約範囲に合わせて確定します。QA内容は確認対象を示すもので、実運用環境の適合保証ではありません。
          </p>
          <h2>Related Services / 関連カテゴリ</h2>
          <div className="service-links">
            {p.categories.map((id) => (
              <Link key={id} href={`/works/${id}`}>
                {categories.find((c) => c.id === id)?.name}
                <ArrowUpRight size={16} />
              </Link>
            ))}
          </div>
        </section>
        <div className="hub-section message-wrap">
          <MessageOnly />
        </div>
        <Contact initialKind={`${p.name}のような制作`} />
      </main>
      <Footer />
    </>
  );
}
