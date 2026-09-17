import Link from "next/link";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { Header, Footer } from "@/components/site";
import { Contact } from "@/components/contact";
import { MasterHero } from "@/components/master-exhibits";
import { ProjectFeature } from "@/components/project-feature";
import { FAQ } from "@/components/faq";
import { Process } from "@/components/sales";
import { Delivery, MessageOnly } from "@/components/sales-sections";
import {
  BrandArchitecture,
  WorksBridge,
} from "@/components/brand-architecture";
import { pricingNote } from "@/lib/portfolio";
import { services, selectedProjects } from "@/lib/sales-ui";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "集まり、つくり、次へ広がる",
  "TSUDOWAはTETSU WORKS、TSUKUTTA LAB、これから生まれる事業をつなぐ親ブランドです。現在の制作・AI業務自動化サービス、制作デモ、料金と進め方を紹介します。",
  "/",
);

export default function Home() {
  return (
    <>
      <Header />
      <main id="main" className="sales-hub sales-ui home-ui">
        <section className="sales-hero brand-hero">
          <div className="sales-hero-copy">
            <span className="eyebrow">PARENT BRAND / JAPAN</span>
            <h1>
              <span>GATHER.</span>
              <span>BUILD.</span>
              <span>EXPAND.</span>
            </h1>
            <p className="brand-line">集まった想いを、次のかたちへ。</p>
            <p className="desktop-copy">
              人・技術・作品・事業が集まり、つくり、次へ広がる。
              <br />
              TSUDOWAは、複数の挑戦を一つの思想でつなぐ親ブランドです。
            </p>
            <p className="mobile-copy">
              集まり、つくり、次へ広がる。
              <br />
              複数の挑戦をつなぐ親ブランド。
            </p>
            <div className="hero-actions">
              <Link href="#brands" className="button primary">
                TSUDOWAを知る <ArrowRight size={17} />
              </Link>
              <Link href="#tetsu-works" className="button hero-secondary">
                現在の事業を見る
              </Link>
            </div>
          </div>
          <MasterHero />
          <div className="hero-colophon">
            <span>TSUDOWA / GATHER · BUILD · EXPAND</span>
            <span>TETSU WORKS / TSUKUTTA LAB</span>
          </div>
        </section>

        <BrandArchitecture />
        <WorksBridge />

        <section
          className="hub-section service-selector"
          id="services"
          data-reveal="title"
        >
          <span className="eyebrow">03 / TETSU WORKS CAPABILITIES</span>
          <p className="editorial-heading" lang="en">
            WHAT DO YOU NEED?
          </p>
          <h2>何を依頼したいですか？</h2>
          <p className="section-lead">
            案件に近いカテゴリを選ぶと、関連する作品・料金・納品物だけを表示。
          </p>
          <div className="service-selector-grid" data-reveal="group">
            {services.map((service, index) => (
              <Link
                key={service.id}
                href={`/works/${service.id}`}
                data-service={service.id}
              >
                <span className="service-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <ArrowUpRight size={20} />
              </Link>
            ))}
          </div>
          <p className="selector-more">
            コーディング・Next.js・レスポンシブ・既存サイト改善も対応。
            <Link href="/works">
              全12カテゴリから探す <ArrowRight size={15} />
            </Link>
          </p>
        </section>

        <section
          className="hub-section selected-works"
          id="works"
          data-reveal="title"
        >
          <div className="hub-section-head">
            <div>
              <span className="eyebrow">04 / TETSU WORKS — SELECTED WORKS</span>
              <h2 className="editorial-heading">
                SELECTED
                <br />
                WORKS.
              </h2>
              <p className="section-lead">
                店舗サイト、サービスLP、商品ページ、業務ツール。
                <br />
                動くデモと制作内容から、完成形をご確認いただけます。
              </p>
            </div>
            <Link href="/works" className="button all-works">
              ALL WORKS <ArrowRight size={16} />
            </Link>
          </div>
          <div className="featured-projects">
            {selectedProjects.map((project, index) => (
              <ProjectFeature
                key={project.slug}
                project={project}
                index={index}
              />
            ))}
          </div>
          <p className="honesty-note">
            掲載作品はすべて自主制作（SELF-INITIATED
            DEMO）です。企業・商品・データは架空で、受託実績を示すものではありません。
          </p>
        </section>

        <section
          className="hub-section sales-pricing"
          id="pricing"
          data-price-info
        >
          <span className="eyebrow">05 / TETSU WORKS — PRICE GUIDE</span>
          <h2>料金と納期の目安。</h2>
          <p className="section-lead">必要な範囲からご依頼いただけます。</p>
          <div className="price-grid" data-reveal="group">
            {[
              ["トップページ", "30,000円〜", "3〜5営業日"],
              ["下層ページ", "5,000円〜 / 1ページ", "1〜2営業日 / 1ページ"],
              ["LP", "30,000円〜", "5〜10営業日"],
              ["Webサイト一式", "50,000円〜", "7〜14営業日"],
            ].map(([name, price, days]) => (
              <article key={name}>
                <span>{name}</span>
                <h3>{price}</h3>
                <p>{days}</p>
              </article>
            ))}
          </div>
          <div className="custom-estimates">
            <p>
              <b>EC / 商品ページ</b>
              <span>内容により見積 / 5〜10営業日</span>
            </p>
            <p>
              <b>Webアプリ・AI業務自動化・API連携</b>
              <span>料金・納期ともに要件により見積</span>
            </p>
          </div>
          <p className="honesty-note">{pricingNote}</p>
        </section>

        <Delivery />
        <Process />
        <section
          id="qa"
          className="hub-section sales-quality"
          data-reveal="section"
        >
          <div>
            <span className="eyebrow">08 / BUILT WITH CARE</span>
            <h2>
              AIを活かして、
              <br />
              人が使える完成品へ。
            </h2>
          </div>
          <div>
            <p>
              AIで調査や実装を効率化しながら、要件整理・設計の判断・テスト・修正には責任を持って対応します。画面ができた段階で終わらず、実際の操作と納品後の使い方まで確認します。
            </p>
            <ul>
              <li>Desktop / Mobileの表示・操作確認</li>
              <li>フォーム、エラー表示、リンクの確認</li>
              <li>キーボード操作・読みやすさ・納品ファイルの確認</li>
            </ul>
            <Link href="/projects/qa" className="text-link">
              QA・納品工程のデモを見る <ArrowUpRight size={16} />
            </Link>
          </div>
        </section>
        <FAQ />
        <div className="hub-section message-wrap">
          <MessageOnly />
        </div>
        <Contact />
      </main>
      <Footer />
    </>
  );
}
