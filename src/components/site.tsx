import Link from "next/link";
import { ArrowUpRight, ArrowLeft, ShieldCheck } from "lucide-react";
import { BrandMark } from "./brand-mark";
export function Header() {
  return (
    <header className="site-header">
      <Link href="/" className="brand" aria-label="TETSU / WORKS ホーム">
        <BrandMark /> TETSU / WORKS
      </Link>
      <nav aria-label="メインナビゲーション">
        <Link href="/#works">WORKS</Link>
        <Link href="/#services">SERVICES</Link>
        <Link href="/#process">PROCESS</Link>
        <Link href="/#qa">QA</Link>
        <Link href="/#contact" className="nav-cta">
          MESSAGE-ONLY<span className="nav-ok"> OK</span>
        </Link>
      </nav>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <Link className="brand" href="/" aria-label="TETSU / WORKS ホーム">
          <BrandMark /> TETSU / WORKS
        </Link>
        <Link className="footer-cta" href="/#contact">
          次の制作について相談する <ArrowUpRight size={20} aria-hidden="true" />
        </Link>
      </div>
      <div className="footer-main">
        <p className="footer-statement" lang="en">
          <span>DESIGN.</span> <span>BUILD.</span> <span>SHIP.</span>
        </p>
        <div>
          <p>人が使える完成品まで、責任を持って。</p>
          <p className="footer-domain">tetsuworks.com</p>
        </div>
      </div>
      <div className="footer-bottom">
        <nav aria-label="フッターナビゲーション">
          <Link href="/#services">Capabilities</Link>
          <Link href="/works">Works</Link>
          <Link href="/#process">Process</Link>
          <Link href="/#qa">QA</Link>
          <Link href="/#faq">FAQ</Link>
          <Link href="/privacy">プライバシー</Link>
        </nav>
        <small>
          © {new Date().getFullYear()} TETSU / WORKS · 自主制作ポートフォリオ
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
      <main id="main" className="demo-page">
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
        <p className="demo-description">{description}</p>
        <Link
          className="text-link"
          href={`/projects/${({ "01": "csv", "02": "inbox", "03": "admin" } as Record<string, string>)[number] ?? "qa"}`}
        >
          制作概要・参考料金・納品物を見る ↗
        </Link>
        <div className="feature-tags">
          {features.map((f) => (
            <span key={f}>{f}</span>
          ))}
          <span>Next.js / TypeScript</span>
        </div>
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
