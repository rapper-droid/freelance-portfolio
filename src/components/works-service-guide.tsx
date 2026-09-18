import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { FAQ } from "./faq";
import { Process } from "./sales";
import { Delivery, MessageOnly } from "./sales-sections";
import { pricingNote } from "@/lib/portfolio";
import { services } from "@/lib/sales-ui";

/** The established sales content lives with TETSU WORKS, not the parent HQ. */
export function WorksServiceGuide() {
  return (
    <>
      <section
        className="hub-section service-selector"
        id="services"
        data-reveal="title"
      >
        <span className="eyebrow">02 / TETSU WORKS CAPABILITIES</span>
        <p className="editorial-heading" lang="en">
          WHAT DO YOU NEED?
        </p>
        <h2>8つのサービスから、選ぶ。</h2>
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
          <Link href="/works#works">
            全12カテゴリから探す <ArrowRight size={15} />
          </Link>
        </p>
      </section>

      <section
        className="hub-section sales-pricing"
        id="pricing"
        data-price-info
      >
        <span className="eyebrow">03 / PRICE GUIDE</span>
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
      <Process index="05" />
      <section
        id="qa"
        className="hub-section sales-quality"
        data-reveal="section"
      >
        <div>
          <span className="eyebrow">06 / BUILT WITH CARE</span>
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
    </>
  );
}
