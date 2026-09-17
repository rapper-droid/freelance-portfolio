import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { HqNavigation } from "./motion";
import { hqConcept } from "@/lib/hq";
import "./hq.css";

export function HqHeader() {
  return (
    <header className="hq-header">
      <Link
        prefetch={false}
        href="/"
        className="hq-logo"
        aria-label="TSUDOWA ホーム"
      >
        <BrandMark />
        <span>TSUDOWA</span>
      </Link>
      <HqNavigation />
    </header>
  );
}
export function HqFooter() {
  return (
    <footer className="hq-footer">
      <div className="hq-footer-intro">
        <span>ONE CIRCLE. MANY POSSIBILITIES.</span>
        <p>{hqConcept}</p>
      </div>
      <Link
        prefetch={false}
        className="hq-footer-wordmark"
        href="/"
        aria-label="TSUDOWA ホーム"
      >
        TSUDOWA<span aria-hidden="true">↗</span>
      </Link>
      <div className="hq-footer-bottom">
        <p>
          © {new Date().getFullYear()} TSUDOWA <span>運営：TETSU</span>
        </p>
        <nav aria-label="フッターナビゲーション">
          <Link prefetch={false} href="/works">
            TETSU WORKS
          </Link>
          <Link prefetch={false} href="/lab">
            TSUKUTTA LAB
          </Link>
          <Link prefetch={false} href="/#contact">
            Contact
          </Link>
          <Link prefetch={false} href="/privacy">
            Privacy
          </Link>
        </nav>
      </div>
    </footer>
  );
}
export function HqArrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <span className="hq-arrow" aria-hidden="true">
      {diagonal ? "↗" : "→"}
    </span>
  );
}
export function HqContactHub() {
  return (
    <section
      id="contact"
      className="hq-contact hq-section"
      aria-labelledby="hq-contact-title"
    >
      <div className="hq-section-index">05 / START A CONVERSATION</div>
      <h2 id="hq-contact-title">
        次の何かは、
        <br />
        ひとつの話から。
      </h2>
      <div className="hq-contact-paths">
        <Link href="/contact?from=%2Fworks" prefetch={false}>
          <span>WITH TETSU WORKS</span>
          <h3>
            制作を相談する <HqArrow diagonal />
          </h3>
          <p>Web・業務ツール・自動化。まだ整理できていなくても。</p>
        </Link>
        <Link href="/contact/general" prefetch={false}>
          <span>WITH TSUDOWA</span>
          <h3>
            TSUDOWAへのお問い合わせ <HqArrow diagonal />
          </h3>
          <p>ブランドや掲載内容、コラボレーションについて。</p>
        </Link>
      </div>
      <p className="hq-contact-address">
        CONTACT <a href="mailto:contact@tsudowa.com">contact@tsudowa.com</a>
      </p>
    </section>
  );
}
