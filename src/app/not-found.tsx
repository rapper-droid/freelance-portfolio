import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

/** Deliberately built on the root core.css only: no HQ or sales CSS here. */
export default function NotFound() {
  return (
    <div className="error-site">
      <header className="error-header">
        <Link className="error-home" href="/" prefetch={false}>
          <BrandMark />
          TSUDOWA
        </Link>
      </header>
      <main id="main" className="error-main">
        <p className="error-kicker">404 / NOT FOUND</p>
        <h1>ページが見つかりませんでした。</h1>
        <p className="error-lead">
          URLが変わったか、ページが移動した可能性があります。TSUDOWAの入口から、目的の場所をお探しください。
        </p>
        <Link className="error-button" href="/" prefetch={false}>
          TSUDOWAへ戻る →
        </Link>
        <nav className="error-paths" aria-label="主な入口">
          <Link href="/works" prefetch={false}>
            <span>TETSU WORKS</span>制作例・ご相談
          </Link>
          <Link href="/lab" prefetch={false}>
            <span>TSUKUTTA LAB</span>プロダクトと実験
          </Link>
          <Link href="/contact/general" prefetch={false}>
            <span>CONTACT</span>お問い合わせ
          </Link>
        </nav>
      </main>
      <footer className="error-footer">TSUDOWA / GATHER. BUILD. EXPAND.</footer>
    </div>
  );
}
