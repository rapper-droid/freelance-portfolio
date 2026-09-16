import Link from "next/link";
import { ArrowUpRight, ArrowLeft, ShieldCheck } from "lucide-react";
import { BrandMark } from "./brand-mark";
import {
  BRAND_MESSAGE,
  BRAND_NAME,
  BRAND_OPERATOR,
  BRAND_TAGLINE,
  WORKS_BRAND_NAME,
  WORKS_LOCKUP,
  WORKS_RELATIONSHIP,
  displayDomain,
} from "@/lib/brand";
import { siteOrigin } from "@/lib/seo";

export function Header() {
  return (
    <header className="site-header">
      <Link href="/" className="brand" aria-label={`${BRAND_NAME} ホーム`}>
        <BrandMark /> {BRAND_NAME}
      </Link>
      <span className="brand-note">{WORKS_LOCKUP}</span>
      <nav aria-label="メインナビゲーション">
        <Link href="/#brands">BRANDS</Link>
        <Link href="/#tetsu-works">TETSU WORKS</Link>
        <Link href="/#works">WORKS</Link>
        <Link href="/#process">PROCESS</Link>
        <Link href="/#contact" className="nav-cta">
          CONTACT
        </Link>
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <Link className="brand" href="/" aria-label={`${BRAND_NAME} ホーム`}>
          <BrandMark /> {BRAND_NAME}
        </Link>
        <Link className="footer-cta" href="/#contact">
          次の制作について相談する <ArrowUpRight size={20} aria-hidden="true" />
        </Link>
      </div>
      <div className="footer-main">
        <p className="footer-statement" lang="en">
          {BRAND_TAGLINE.split(" ").map((word) => (
            <span key={word}>{word} </span>
          ))}
        </p>
        <div>
          <p>{BRAND_MESSAGE}</p>
          <p className="footer-parent">{WORKS_RELATIONSHIP}</p>
          <p className="footer-domain">{displayDomain(siteOrigin())}</p>
        </div>
      </div>
      <div className="footer-branches" aria-label="ブランド構造">
        <span>{BRAND_NAME} / PARENT</span>
        <span>{WORKS_BRAND_NAME} / CLIENT SERVICES</span>
        <span>TSUKUTTA LAB / PRODUCTS & PLAY</span>
      </div>
      <div className="footer-bottom">
        <nav aria-label="フッターナビゲーション">
          <Link href="/#brands">Brands</Link>
          <Link href="/#services">Capabilities</Link>
          <Link href="/works">Works</Link>
          <Link href="/#process">Process</Link>
          <Link href="/#faq">FAQ</Link>
          <Link href="/privacy">プライバシー</Link>
        </nav>
        <small>
          © {new Date().getFullYear()} {BRAND_NAME} · 運営：{BRAND_OPERATOR}
        </small>
      </div>
    </footer>
  );
}

export function DemoShell({
  number,
  title,
  lead,
  description,
  features,
  children,
}: {
  number: string;
  title: string;
  lead: string;
  description: string;
  features: string[];
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main id="main" className="demo-page workbench-page">
        <Link href="/#works" className="back">
          <ArrowLeft size={15} /> 制作デモに戻る
        </Link>
        <div className="demo-heading">
          <div>
            <span className="eyebrow">LIVE DEMO / {number}</span>
            <h1>{title}</h1>
            <p className="demo-lead">{lead}</p>
          </div>
          <span className="pill">自主制作デモ</span>
        </div>
        <details className="demo-context">
          <summary>このデモでできること・制作概要</summary>
          <p className="demo-description">{description}</p>
          <Link
            className="text-link"
            href={`/projects/${({ "01": "csv", "02": "inbox", "03": "admin" } as Record<string, string>)[number] ?? "qa"}`}
          >
            制作概要・参考料金・納品物を見る ↗
          </Link>
          <div className="feature-tags">
            {features.map((feature) => (
              <span key={feature}>{feature}</span>
            ))}
            <span>Next.js / TypeScript</span>
          </div>
        </details>
        <div className="privacy-note">
          <ShieldCheck size={16} />{" "}
          架空データを使用。入力データは外部送信されず、このブラウザ内で処理されます。
        </div>
        {children}
        <div className="demo-bottom">
          <div>
            <h2>このようなツールを、あなたの業務に。</h2>
            <p>
              既存のExcel作業の置き換えや、小さな機能追加からご相談いただけます。
            </p>
          </div>
          <Link className="button primary" href="/#contact">
            相談内容をまとめる <ArrowUpRight size={16} />
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
