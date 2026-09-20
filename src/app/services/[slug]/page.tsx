import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowUpRight, Check, Minus, Plus } from "lucide-react";
import { Header, Footer } from "@/components/site";
import { OfferBrief } from "@/components/offer-brief";
import { categoryKinds } from "@/lib/contact-options";
import { getOffer, offerHeading, publishedOffers } from "@/lib/offers";
import { getProject } from "@/lib/portfolio";
import { previewPath } from "@/lib/preview";
import { pageMetadata } from "@/lib/seo";
import "@/components/portfolio-styles.css";
import "@/components/offers.css";

// Only verified offers are prerendered; anything else is the notFound() page.
export const dynamicParams = false;
export const generateStaticParams = () =>
  publishedOffers.map((o) => ({ slug: o.slug }));
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const o = getOffer((await params).slug);
  if (!o) notFound();
  return pageMetadata(
    `${o.title.replace(/。$/, "")}｜TETSU WORKS`,
    `${o.problem} ${o.lead}`,
    `/services/${o.slug}`,
  );
}

const evidenceLabels = {
  demo: "動くデモ",
  self_project: "自主運営サイトの記録",
  test: "自動テスト",
} as const;

export default async function OfferPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const o = getOffer((await params).slug);
  if (!o) notFound();
  const demo = getProject(o.demo.slug)!;
  const page = `/services/${o.slug}`;
  return (
    <>
      <Header />
      <main
        id="main"
        className="sales-hub sales-ui offer-page"
        data-offer={o.id}
      >
        <section className="hub-section offer-hero">
          <div className="offer-hero-copy">
            <Link className="back" href="/services">
              ← 小さく頼めるメニュー
            </Link>
            <span className="eyebrow">FIXED-SCOPE SERVICE / {o.id}</span>
            <h1>{o.title}</h1>
            <p className="offer-problem">{o.problem}</p>
            <p className="offer-lead">{o.lead}</p>
            <dl className="offer-facts" data-price-info>
              <div>
                <dt>料金</dt>
                <dd>
                  {o.price.status === "reference" && <small>参考料金 </small>}
                  {o.price.displayLabel}
                </dd>
              </div>
              <div>
                <dt>進め方</dt>
                <dd>メッセージ中心・打ち合わせは必須ではありません</dd>
              </div>
            </dl>
            <div className="offer-actions">
              <Link href="#brief" className="button primary">
                この内容で相談文をつくる <ArrowUpRight size={16} />
              </Link>
              <Link
                href={`/demos/${o.demo.slug}`}
                className="text-link"
                data-live-demo={o.demo.slug}
              >
                先にデモを触ってみる <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>
          <figure className="offer-proof">
            <Link
              href={`/demos/${o.demo.slug}`}
              aria-label={`${o.demo.label} のデモを開く`}
            >
              <Image
                src={previewPath(demo.slug, "desktop")}
                alt={`${demo.title}の実装済み画面`}
                width={1440}
                height={1000}
                sizes="(max-width: 900px) 90vw, 44vw"
                preload
              />
            </Link>
            <figcaption>
              <b>{o.demo.label}</b>
              {o.demo.tryThis}
            </figcaption>
          </figure>
        </section>

        <section className="hub-section offer-result" aria-labelledby="result">
          <span className="eyebrow">WHAT YOU GET</span>
          <h2 id="result">頼むと、こうなる。</h2>
          <p className="section-lead">{o.result}</p>
          <div className="offer-columns" data-delivery-info>
            <article>
              <h3>お渡しするもの</h3>
              <ul className="offer-list offer-list-yes">
                {o.deliverables.map((v) => (
                  <li key={v}>
                    <Check size={16} aria-hidden="true" />
                    {v}
                  </li>
                ))}
              </ul>
            </article>
            <article>
              <h3>このメニューに含まないもの</h3>
              <ul className="offer-list offer-list-no">
                {o.exclusions.map((v) => (
                  <li key={v}>
                    <Minus size={16} aria-hidden="true" />
                    {v}
                  </li>
                ))}
              </ul>
            </article>
            <article>
              <h3>ご用意いただくもの</h3>
              <ul className="offer-list">
                {o.prerequisites.map((v) => (
                  <li key={v}>{v}</li>
                ))}
              </ul>
            </article>
            <article>
              <h3>完了の確認（検収）</h3>
              <ul className="offer-list">
                {o.acceptanceCriteria.map((v) => (
                  <li key={v}>{v}</li>
                ))}
              </ul>
            </article>
          </div>
          {o.limits && <p className="honesty-note">{o.limits}</p>}
        </section>

        <section
          className="hub-section offer-terms"
          aria-labelledby="terms"
          data-price-info
        >
          <span className="eyebrow">PRICE & SCHEDULE</span>
          <h2 id="terms">料金・納期・修正。</h2>
          <div className="sales-grid">
            {[
              [
                o.price.status === "reference" ? "参考料金" : "料金",
                `${o.price.displayLabel}。${o.price.note}`,
              ],
              ["追加でかかる費用", o.price.thirdPartyCosts],
              ["納期", o.schedulePolicy],
              ["修正", o.revisionPolicy],
              [
                "開始の条件",
                "範囲・料金・納期に合意してから着手します。相談を送った時点で、契約や発注にはなりません。",
              ],
              [
                "進め方",
                "相談 → 内容の確認 → 範囲と料金のご提示 → 合意 → 制作 → 確認（検収）→ 納品",
              ],
            ].map(([label, text]) => (
              <div key={label}>
                <span>{label}</span>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="hub-section offer-evidence" aria-labelledby="proof">
          <span className="eyebrow">PROOF, NOT PROMISES</span>
          <h2 id="proof">できることの、根拠。</h2>
          <ul className="offer-evidence-list">
            {o.evidence.map((e) => (
              <li key={e.label}>
                <span>{evidenceLabels[e.kind]}</span>
                {e.href ? (
                  <Link href={e.href}>
                    {e.label} <ArrowUpRight size={15} aria-hidden="true" />
                  </Link>
                ) : (
                  <p>{e.label}</p>
                )}
              </li>
            ))}
          </ul>
          <p className="honesty-note">
            掲載しているデモはすべて自主制作で、企業・商品・データは架空です。お客様への納品実績ではありません。
          </p>
        </section>

        <section className="hub-section offer-faq" aria-labelledby="offer-faq">
          <span className="eyebrow">BEFORE YOU ASK</span>
          <h2 id="offer-faq">よくある質問。</h2>
          <div className="faq-list">
            {o.faqs.map(([q, a], i) => (
              <details key={q}>
                <summary>
                  <span className="faq-number" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{q}</span>
                  <Plus size={18} strokeWidth={1.5} aria-hidden="true" />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>

        <OfferBrief
          heading={offerHeading(o)}
          page={page}
          offerId={o.slug}
          questions={o.brief}
          kind={categoryKinds[o.category]}
        />
      </main>
      <Footer />
    </>
  );
}
