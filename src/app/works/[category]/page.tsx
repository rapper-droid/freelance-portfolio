import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { categories, getCategory, projectsFor } from "@/lib/portfolio";
import { pageMetadata } from "@/lib/seo";
import { Header, Footer } from "@/components/site";
import { ProjectArt } from "@/components/project-art";
import { SalesInfo, Process } from "@/components/sales";
import { Contact } from "@/components/contact";
// Known paths are prerendered; unknown paths render the explicit notFound() boundary.
export const generateStaticParams = () =>
  categories.map((c) => ({ category: c.id }));
export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const c = getCategory((await params).category);
  if (!c) notFound();
  return pageMetadata(
    `${c.name}の制作・納品`,
    `${c.description} 制作例・参考料金・納期・納品物を紹介します。`,
    `/works/${c.id}`,
  );
}
export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const c = getCategory((await params).category);
  if (!c) notFound();
  return (
    <>
      <Header />
      <main id="main" className="sales-hub" data-category={c.id}>
        <section className="hub-section category-intro">
          <Link className="back" href="/#works">
            ← すべての制作カテゴリ
          </Link>
          <span className="eyebrow">SERVICE / {c.id.toUpperCase()}</span>
          <h1>{c.name}</h1>
          <p className="category-lead">{c.description}</p>
          <div className="category-estimate">
            <span>
              参考料金 <b>{c.price}</b>
            </span>
            <span>
              期間目安 <b>{c.duration}</b>
            </span>
            <Link href="#delivery" className="text-link">
              依頼内容・納品物を見る ↓
            </Link>
          </div>
        </section>
        <section className="hub-section category-projects">
          <div className="hub-section-head">
            <div>
              <span className="eyebrow">SELECTED WORK</span>
              <h2>この仕事の制作例。</h2>
            </div>
            <p>SELF-INITIATED DEMO / すべて自主制作</p>
          </div>
          <div className="project-grid">
            {projectsFor(c.id).map((p) => (
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
                </div>
              </Link>
            ))}
          </div>
        </section>
        <SalesInfo category={c} />
        <Process />
        <Contact initialKind={c.name} />
      </main>
      <Footer />
    </>
  );
}
