import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { publishedOffers } from "@/lib/offers";

/** /works entry to the fixed-scope offers, placed before the full catalogue. */
export function OfferStrip() {
  return (
    <section
      className="hub-section offer-strip"
      aria-labelledby="offer-strip-title"
    >
      <div className="offer-strip-head">
        <span className="eyebrow">SMALL, FIXED-SCOPE SERVICES</span>
        <h2 id="offer-strip-title">決まった範囲で、小さく頼む。</h2>
        <p className="section-lead">
          サイト全体の制作でなくても。何が届き、何を用意すればよいかを先に決めたメニューです。
        </p>
      </div>
      <div className="offer-strip-list">
        {publishedOffers.map((o) => (
          <Link
            key={o.id}
            href={`/services/${o.slug}`}
            className="offer-strip-item"
          >
            <span className="offer-card-id">{o.id}</span>
            <strong>{o.title}</strong>
            <span className="offer-strip-meta">
              {o.price.status === "reference" ? "参考料金 " : ""}
              {o.price.displayLabel} ・ デモあり
            </span>
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        ))}
      </div>
      <p className="offer-strip-more">
        <Link href="/services" className="text-link">
          メニューの一覧 <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
        <Link href="/partners" className="text-link">
          制作会社・デザイナーの方へ{" "}
          <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </p>
    </section>
  );
}
