import Link from "next/link";
import { ArrowUpRight, ArrowDown, Check } from "lucide-react";
import { Header, Footer } from "@/components/site";
import { Contact } from "@/components/contact";
import { PortfolioGrid } from "@/components/portfolio-grid";
import { ProjectArt } from "@/components/project-art";
import { Process } from "@/components/sales";
import { categories, pricingNote, projects } from "@/lib/portfolio";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Web制作からAI業務自動化まで | WORKS",
  "Webサイト・LP・Webアプリ・AI業務自動化の自主制作ポートフォリオ。設計・制作・テスト・納品物を、実際に動くデモで確認できます。",
  "/",
);
export default function Home() {
  return (
    <>
      <Header />
      <main id="main" className="sales-hub">
        <section className="hub-hero">
          <div className="hub-hero-copy">
            <span className="eyebrow">
              <span className="status-dot" /> INDEPENDENT WEB & DIGITAL
              PRODUCTION
            </span>
            <h1>
              BUILD.
              <br />
              <span>AUTOMATE.</span>
              <br />
              DELIVER.
            </h1>
            <h2>
              つくる。その先の、
              <br className="mobile-only" />
              使えるところまで。
            </h2>
            <p>
              WebサイトからAI業務自動化まで。
              <br />
              設計・制作・実装・テスト・納品を一貫して。
            </p>
            <div className="hero-actions">
              <Link href="#works" className="button primary">
                制作デモを見る <ArrowDown size={17} />
              </Link>
              <Link href="#process" className="text-link">
                納品までの進め方 <ArrowUpRight size={16} />
              </Link>
            </div>
            <div className="hero-assurance">
              <span>
                <Check size={15} /> メッセージで進行可能
              </span>
              <span>
                <Check size={15} /> ソース・手順書の納品
              </span>
            </div>
          </div>
          <div className="hero-showcase">
            <Link
              href="/projects/cafe"
              className="hero-feature"
              aria-label="KOMOREBI カフェの制作事例"
            >
              <ProjectArt project={projects[0]} />
              <div>
                <span>01 / WEB EXPERIENCE</span>
                <ArrowUpRight size={20} />
              </div>
            </Link>
            <div className="hero-small-projects">
              <Link href="/projects/saas" aria-label="FOLIO SaaSの制作事例">
                <ProjectArt project={projects[1]} />
              </Link>
              <Link href="/projects/ec" aria-label="FORM ECの制作事例">
                <ProjectArt project={projects[2]} />
              </Link>
            </div>
            <p>SELECTED SELF-INITIATED PROJECTS / 自主制作</p>
          </div>
        </section>
        <div className="hub-strip">
          <span>DESIGN WITH PURPOSE. BUILD WITH CARE.</span>
          <p>
            Websites <i>/</i> Applications <i>/</i> Automation <i>/</i> Quality
            assurance
          </p>
        </div>
        <PortfolioGrid />
        <section className="hub-section services-overview" id="services">
          <div className="hub-section-head">
            <div>
              <span className="eyebrow">02 / SERVICES & ESTIMATES</span>
              <h2>
                必要なところから。
                <br />
                完成品の納品まで。
              </h2>
            </div>
            <p>
              ページ制作も、既存コードの修正も。
              <br />
              案件に合わせた範囲でご相談いただけます。
            </p>
          </div>
          <div className="price-grid">
            {[
              ["トップページ", "30,000円〜", "3〜5営業日"],
              ["下層ページ", "5,000円〜 / ページ", "1〜2営業日"],
              ["LP制作", "30,000円〜", "5〜10営業日"],
              ["Webサイト一式", "50,000円〜", "7〜14営業日"],
            ].map(([name, price, days]) => (
              <article key={name}>
                <span>{name}</span>
                <h3>{price}</h3>
                <p>{days}</p>
              </article>
            ))}
          </div>
          <p className="honesty-note">
            {pricingNote} Webアプリ・AI業務自動化は要件によりお見積もりします。
          </p>
          <div className="service-links">
            {categories.map((c) => (
              <Link key={c.id} href={`/works/${c.id}`}>
                {c.name}
                <ArrowUpRight size={16} />
              </Link>
            ))}
          </div>
        </section>
        <Process />
        <section id="profile" className="hub-section studio-note">
          <span className="eyebrow">BUILT TO BE HANDED OVER</span>
          <h2>
            デザインだけでも、
            <br />
            動くだけでも終わらせない。
          </h2>
          <div>
            <p>
              目的を整理し、使う人の視点で設計する。画面とコードをつくり、操作を確かめ、引き継げる形に整える。この一連の工程を大切にしています。
            </p>
            <p>
              掲載しているのは、制作の考え方と実装を確認できる自主制作です。対応可能な業務とデモの実装範囲を明記し、ご依頼の際には実際の仕様に合わせてお見積もりします。
            </p>
            <Link href="/projects/qa" className="text-link">
              納品・品質確認のサンプルを見る <ArrowUpRight size={16} />
            </Link>
          </div>
        </section>
        <Contact />
      </main>
      <Footer />
    </>
  );
}
