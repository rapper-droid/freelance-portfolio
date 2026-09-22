import { Header, Footer } from "@/components/site";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DeliveryRibbon } from "@/components/premium-exhibits";
import { MasterWorks } from "@/components/master-exhibits";
import { PortfolioGrid } from "@/components/portfolio-grid";
import { ProjectCard } from "@/components/project-card";
import { WorksServiceGuide } from "@/components/works-service-guide";
import { WorksLead } from "@/components/works-lead";
import { realUtilityEnabled } from "@/lib/runtime/feature";
import { Contact } from "@/components/contact";
import { OfferStrip } from "@/components/offer-strip";
import { categories, projects } from "@/lib/portfolio";
import "@/components/portfolio-styles.css";
import "@/components/offers.css";
import "@/components/works-lead.css";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "入力する仕事を減らす｜問い合わせ・日程調整・定期報告と制作例",
  "問い合わせ対応・日程調整・毎週の集計を、実際に処理が進むところで確認できます。Webサイト・LP・EC・業務ツールの制作例と料金・納期もこのページから。",
  "/works",
);
export default function AllWorks() {
  return (
    <>
      <Header />
      <main id="main" className="sales-hub sales-ui">
        <section className="hub-section catalogue-intro">
          <div className="catalogue-copy">
            <span className="works-byline">
              TETSU WORKS / CLIENT SERVICES BY TSUDOWA
            </span>
            <span className="eyebrow">ALL WORKS / 11 SELF-INITIATED DEMOS</span>
            <h1>
              依頼したい仕事から、
              <br />
              完成形を見つける。
            </h1>
            <p>
              12カテゴリで絞り込み、制作例の詳細・操作デモ・参考料金をご確認ください。
            </p>
            <Link href="#works" className="button primary">
              制作例から探す <ArrowRight size={16} />
            </Link>
          </div>
          <MasterWorks />
        </section>
        <DeliveryRibbon />
        {/* 仕事が減る話を、製品名より先に置く（指示書 §11）。
            既存のギャラリー・カテゴリ入口はこの下にそのまま残る。 */}
        {realUtilityEnabled() && <WorksLead />}
        <OfferStrip />
        <PortfolioGrid
          items={projects.map(({ slug, categories }) => ({ slug, categories }))}
          categoryOptions={categories.map(({ id, name }) => ({ id, name }))}
        >
          {projects.map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </PortfolioGrid>
        <WorksServiceGuide />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
