import Link from "next/link";
import { ArrowUpRight, ArrowDown, Check } from "lucide-react";
import { Header, Footer } from "@/components/site";
import { Contact } from "@/components/contact";
import { PortfolioGrid } from "@/components/portfolio-grid";
import { ProjectCard } from "@/components/project-card";
import { ProjectArt } from "@/components/project-art";
import { Process } from "@/components/sales";
import { categories, pricingNote, projects } from "@/lib/portfolio";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Web制作からAI業務自動化まで",
  "AIを活用して制作を効率化しながら、人が使える完成品まで責任を持って仕上げます。Webサイト・LP・Webアプリ・業務自動化の自主制作デモと、設計・テスト・納品内容をご紹介。",
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
              AIを活用し、制作を効率化。
              <br />
              人が使える完成品まで、責任を持って仕上げます。
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
        <PortfolioGrid
          items={projects.map(({ slug, categories }) => ({ slug, categories }))}
          categoryOptions={categories.map(({ id, name }) => ({ id, name }))}
        >
          {projects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </PortfolioGrid>
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
            AIを活かして、
            <br />
            使う人のために仕上げる。
          </h2>
          <div>
            <p>
              AIを制作の補助に活用し、調査や実装を効率化します。要件の整理、設計の判断、動作確認、修正は責任を持って行い、使う人が迷わず扱える完成品へ仕上げます。
            </p>
            <p>
              画面やコードに加え、必要な設定・操作手順・確認結果も整理して納品します。掲載しているのは、制作の考え方と実装を確認できる自主制作です。対応可能な業務とデモの実装範囲を明記し、ご依頼の際には実際の仕様に合わせてお見積もりします。
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
