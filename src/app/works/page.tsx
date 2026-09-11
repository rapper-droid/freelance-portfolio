import { Header, Footer } from "@/components/site";
import { PortfolioGrid } from "@/components/portfolio-grid";
import { ProjectCard } from "@/components/project-card";
import { Contact } from "@/components/contact";
import { categories, projects } from "@/lib/portfolio";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "全11作品・12カテゴリから制作例を探す",
  "Webサイト・LP・EC・業務ツールからQAまで。依頼内容で絞り込み、動く自主制作デモ・料金・納期・納品内容を確認できます。",
  "/works",
);
export default function AllWorks() {
  return (
    <>
      <Header />
      <main id="main" className="sales-hub sales-ui">
        <section className="hub-section catalogue-intro">
          <span className="eyebrow">ALL WORKS / 11 SELF-INITIATED DEMOS</span>
          <h1>
            依頼したい仕事から、
            <br />
            完成形を見つける。
          </h1>
          <p>
            12カテゴリで絞り込み、制作例の詳細・操作デモ・参考料金をご確認ください。
          </p>
        </section>
        <PortfolioGrid
          items={projects.map(({ slug, categories }) => ({ slug, categories }))}
          categoryOptions={categories.map(({ id, name }) => ({ id, name }))}
        >
          {projects.map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </PortfolioGrid>
        <Contact />
      </main>
      <Footer />
    </>
  );
}
