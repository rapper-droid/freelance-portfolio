import "./portfolio-styles.css";
import "./works-chrome.css";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ContactLink } from "./contact-link";
import { BrandMark } from "./brand-mark";
import { WorksNavigation } from "./works-nav";
import {
  BRAND_MESSAGE,
  BRAND_NAME,
  BRAND_OPERATOR,
  BRAND_TAGLINE,
  WORKS_BRAND_NAME,
  WORKS_RELATIONSHIP,
  displayDomain,
} from "@/lib/brand";
import { siteOrigin } from "@/lib/seo";

/** TETSU WORKS chrome: the parent mark leads home, the lockup leads to WORKS. */
export function Header() {
  return (
    <header className="site-header">
      <div className="site-lockup">
        <Link href="/" className="brand" aria-label={`${BRAND_NAME} ホーム`}>
          <BrandMark /> <span className="brand-word">{BRAND_NAME}</span>
        </Link>
        <Link href="/works" className="works-lockup" prefetch={false}>
          <span className="works-lockup-name">{WORKS_BRAND_NAME}</span>
          <span className="works-lockup-role" lang="en">
            CLIENT SERVICES
          </span>
        </Link>
      </div>
      <WorksNavigation />
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
        <ContactLink className="footer-cta">
          次の制作について相談する <ArrowUpRight size={20} aria-hidden="true" />
        </ContactLink>
      </div>
      <div className="footer-main">
        <p className="footer-statement" lang="en">
          {BRAND_TAGLINE.split(" ").map((word) => (
            <span key={word}>{word} </span>
          ))}
        </p>
        <div className="footer-about">
          <p className="footer-message">{BRAND_MESSAGE}</p>
          <p className="footer-parent">{WORKS_RELATIONSHIP}</p>
          <p className="footer-domain">{displayDomain(siteOrigin())}</p>
        </div>
      </div>
      <nav className="footer-branches" aria-label="ブランド構造">
        <Link href="/" prefetch={false}>
          {BRAND_NAME} <span lang="en">PARENT</span>
        </Link>
        <Link href="/works" prefetch={false}>
          {WORKS_BRAND_NAME} <span lang="en">CLIENT SERVICES</span>
        </Link>
        <Link href="/lab" prefetch={false}>
          TSUKUTTA LAB <span lang="en">PRODUCTS & PLAY</span>
        </Link>
      </nav>
      <div className="footer-bottom">
        <nav aria-label="フッターナビゲーション">
          <Link href="/works#works">制作例</Link>
          <Link href="/works#services">サービス</Link>
          <Link href="/works#pricing">料金</Link>
          <Link href="/services">小さく頼めるメニュー</Link>
          <Link href="/partners">制作会社の方へ</Link>
          <Link href="/works#process">進め方</Link>
          <Link href="/works#faq">よくある質問</Link>
          <Link href="/privacy">プライバシー</Link>
        </nav>
        <small>
          © {new Date().getFullYear()} {BRAND_NAME} · 運営：{BRAND_OPERATOR}
        </small>
      </div>
    </footer>
  );
}
