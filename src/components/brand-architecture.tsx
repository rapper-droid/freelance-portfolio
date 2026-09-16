import Link from "next/link";
import { ArrowDownRight, ArrowRight } from "lucide-react";
import { BrandMark } from "./brand-mark";
import { TrustPanel } from "./sales-sections";
import {
  BRAND_MESSAGE,
  BRAND_NAME,
  BRAND_READING,
  BRAND_STRUCTURE,
  WORKS_BRAND_NAME,
} from "@/lib/brand";

export function BrandOrbit() {
  return (
    <aside className="brand-orbit" aria-label="TSUDOWAのブランド構造">
      <div className="orbit-visual" aria-hidden="true">
        <span className="orbit-ring orbit-ring-outer" />
        <span className="orbit-ring orbit-ring-inner" />
        <BrandMark className="orbit-mark" />
        <span className="orbit-path" />
      </div>
      <div className="orbit-copy">
        <span className="eyebrow">ONE IDEA / MANY DIRECTIONS</span>
        <p className="orbit-title">ひとつに集まり、外へひらく。</p>
        <dl>
          <div>
            <dt>NOW</dt>
            <dd>{WORKS_BRAND_NAME}</dd>
          </div>
          <div>
            <dt>BUILDING</dt>
            <dd>PRODUCTS / AI / CONTENT</dd>
          </div>
          <div>
            <dt>PRINCIPLE</dt>
            <dd>HUMAN-OWNED DELIVERY</dd>
          </div>
        </dl>
      </div>
    </aside>
  );
}

export function BrandArchitecture() {
  return (
    <section
      className="hub-section brand-architecture"
      id="brands"
      aria-labelledby="brand-architecture-title"
      data-reveal="section"
    >
      <div className="brand-architecture-head">
        <div>
          <span className="eyebrow">01 / BRAND ARCHITECTURE</span>
          <p className="editorial-heading" lang="en">
            ONE CIRCLE.
            <br />
            MANY DIRECTIONS.
          </p>
        </div>
        <div>
          <h2 id="brand-architecture-title">
            ひとつの思想から、複数の事業へ。
          </h2>
          <p>
            {BRAND_NAME}（{BRAND_READING}
            ）は、人・技術・作品・事業が集まる親ブランド。 制作を担うTETSU
            WORKSと、独立したプロダクトが、それぞれの形で育っていきます。
          </p>
          <blockquote>{BRAND_MESSAGE}</blockquote>
        </div>
      </div>
      <div className="brand-structure-grid" data-reveal="group">
        <article className="brand-card brand-card-parent">
          <div className="brand-card-top">
            <span>PARENT / 00</span>
            <span className="brand-state">ACTIVE</span>
          </div>
          <BrandMark />
          <h3>{BRAND_NAME}</h3>
          <p>制作・技術・プロダクトを、一つの思想でつなぐ親ブランド。</p>
        </article>
        {BRAND_STRUCTURE.map((brand, index) => (
          <article className="brand-card" key={brand.name}>
            <div className="brand-card-top">
              <span>
                {brand.role} / 0{index + 1}
              </span>
              <span className="brand-state">{brand.state}</span>
            </div>
            <span className="brand-branch" aria-hidden="true">
              <ArrowDownRight size={20} />
            </span>
            <h3>{brand.name}</h3>
            <p>{brand.description}</p>
            {brand.name === WORKS_BRAND_NAME && (
              <Link href="#tetsu-works" className="text-link">
                現在の仕事を見る <ArrowRight size={15} />
              </Link>
            )}
          </article>
        ))}
        <article className="brand-card brand-card-future">
          <div className="brand-card-top">
            <span>FUTURE / 03+</span>
            <span className="brand-state">NOT ANNOUNCED</span>
          </div>
          <span className="future-ring" aria-hidden="true" />
          <h3>NEXT VENTURES</h3>
          <p>
            SaaS、AI、Automation、コンテンツなど。新しい事業は、形になったものからご紹介します。
          </p>
        </article>
      </div>
    </section>
  );
}

export function WorksBridge() {
  return (
    <section className="hub-section works-bridge" id="tetsu-works">
      <div className="works-bridge-copy" data-reveal="title">
        <span className="eyebrow">02 / CURRENT BUSINESS</span>
        <p className="works-wordmark">{WORKS_BRAND_NAME}</p>
        <h2>
          依頼を、
          <br />
          動く成果物へ。
        </h2>
        <p>
          Web制作・AI業務自動化・業務ツールを担う、TSUDOWAの制作・受託部門です。
          設計だけで終わらず、実装・テスト・納品まで責任を持ちます。
        </p>
        <div className="hero-actions">
          <Link href="#services" className="button primary">
            依頼内容から探す <ArrowRight size={17} />
          </Link>
          <Link href="#works" className="button hero-secondary">
            制作デモを見る
          </Link>
        </div>
      </div>
      <TrustPanel />
    </section>
  );
}
