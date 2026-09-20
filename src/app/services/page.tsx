import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Header, Footer } from "@/components/site";
import { publishedOffers } from "@/lib/offers";
import { pageMetadata } from "@/lib/seo";
import "@/components/portfolio-styles.css";
import "@/components/offers.css";

export const metadata = pageMetadata(
  "小さく頼めるメニュー｜TETSU WORKS",
  "表示崩れの修正1か所、CSV整理の手順化1本など、範囲を決めて小さく頼めるメニュー。納品物・対象外・準備物・完了の確認を先にご確認いただけます。",
  "/services",
);

export default function ServicesPage() {
  return (
    <>
      <Header />
      <main id="main" className="sales-hub sales-ui offer-page">
        <section className="hub-section offer-index-intro">
          <span className="works-byline">
            TETSU WORKS / CLIENT SERVICES BY TSUDOWA
          </span>
          <span className="eyebrow">FIXED-SCOPE SERVICES</span>
          <h1>
            その小さな修正、
            <br />
            その手作業から。
          </h1>
          <p className="section-lead">
            サイト全体の制作でなくても大丈夫です。範囲を先に決めた「小さく頼めるメニュー」なら、何が届き、何を用意すればよいかが最初から分かります。どちらも実際に触れるデモを用意しています。
          </p>
        </section>
        <section
          className="hub-section offer-index"
          aria-label="小さく頼めるメニュー"
        >
          <div className="offer-index-grid">
            {publishedOffers.map((o) => (
              <article key={o.id} className="offer-card">
                <span className="offer-card-id">{o.id}</span>
                <h2>
                  <Link href={`/services/${o.slug}`}>{o.title}</Link>
                </h2>
                <p>{o.problem}</p>
                <dl>
                  <div>
                    <dt>お渡しするもの</dt>
                    <dd>{o.deliverables[0]}</dd>
                  </div>
                  <div>
                    <dt>
                      {o.price.status === "reference" ? "参考料金" : "料金"}
                    </dt>
                    <dd>{o.price.displayLabel}</dd>
                  </div>
                  <div>
                    <dt>試せるデモ</dt>
                    <dd>
                      <Link href={`/demos/${o.demo.slug}`}>{o.demo.label}</Link>
                    </dd>
                  </div>
                </dl>
                <Link
                  href={`/services/${o.slug}`}
                  className="button primary"
                  aria-label={`${o.shortTitle}の内容を見る`}
                >
                  内容と範囲を見る <ArrowUpRight size={16} />
                </Link>
              </article>
            ))}
          </div>
          <div className="offer-index-more">
            <p>
              メニューにない制作や、どれを選べばよいか分からない場合は、困っていることから相談できます。
            </p>
            <div>
              <Link href="/contact?from=%2Fservices" className="text-link">
                困っていることから相談する <ArrowUpRight size={15} />
              </Link>
              <Link href="/partners" className="text-link">
                制作会社・デザイナーの方へ <ArrowUpRight size={15} />
              </Link>
              <Link href="/works#works" className="text-link">
                すべての制作例を見る <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
