import Link from "next/link";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { Header, Footer } from "@/components/site";
import { Contact } from "@/components/contact";
import { ProjectCard } from "@/components/project-card";
import { Process } from "@/components/sales";
import { Delivery, MessageOnly, TrustPanel } from "@/components/sales-sections";
import { pricingNote } from "@/lib/portfolio";
import { services, selectedProjects } from "@/lib/sales-ui";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Web制作からAI業務自動化まで",
  "Webサイト・LP・EC・業務ツールを、設計から実装・テスト・納品まで。制作デモ、参考料金と納期を確認できます。クラウドソーシングのメッセージだけでも進行可能。",
  "/",
);
export default function Home() {
  return (
    <>
      <Header />
      <main id="main" className="sales-hub sales-ui home-ui">
        <section className="sales-hero">
          <div className="sales-hero-copy">
            <span className="eyebrow">
              <span className="desktop-copy">
                WEB DEVELOPMENT / AI AUTOMATION / DESIGN
              </span>
              <span className="mobile-copy">WEB / AI / DESIGN</span>
            </span>
            <h1>
              BUILD.
              <br />
              AUTOMATE.
              <br />
              DELIVER.
            </h1>
            <p className="desktop-copy">
              WebサイトからAI業務自動化まで。
              <br />
              設計・制作・実装・テスト・納品まで、一気通貫で。
            </p>
            <p className="mobile-copy">
              設計から実装・テスト・納品まで。
              <br />
              メッセージ中心で、納品まで進行可能。
            </p>
            <div className="hero-actions">
              <Link href="#services" className="button primary">
                依頼内容から作品を見る <ArrowRight size={17} />
              </Link>
              <Link href="#process" className="button hero-secondary">
                制作フローを見る
              </Link>
            </div>
          </div>
          <TrustPanel />
        </section>
        <section className="hub-section service-selector" id="services">
          <span className="eyebrow">SELECT WHAT YOU NEED</span>
          <h2>何を依頼したいですか？</h2>
          <p className="section-lead">
            案件に近いカテゴリを選ぶと、関連する作品・料金・納品物だけを表示。
          </p>
          <div className="service-selector-grid">
            {services.map((s, i) => (
              <Link key={s.id} href={`/works/${s.id}`} data-service={s.id}>
                <span className="service-number">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3>{s.title}</h3>
                <p>{s.description}</p>
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
        <section className="hub-section selected-works" id="works">
          <div className="hub-section-head">
            <div>
              <span className="eyebrow">SELECTED WORKS</span>
              <h2>
                作品は、依頼内容に
                <br className="mobile-copy" />
                近いものから。
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
          <div className="project-grid">
            {selectedProjects.map((p) => (
              <ProjectCard key={p.slug} project={p} />
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
          <span className="eyebrow">PRICE GUIDE / EST. DELIVERY</span>
          <h2>料金と納期の目安。</h2>
          <p className="section-lead">必要な範囲からご依頼いただけます。</p>
          <div className="price-grid">
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
        <section id="qa" className="hub-section sales-quality">
          <div>
            <span className="eyebrow">BUILT WITH CARE / QA</span>
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
        <div className="hub-section message-wrap">
          <MessageOnly />
        </div>
        <Contact />
      </main>
      <Footer />
    </>
  );
}
