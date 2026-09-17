import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
export default function NotFound() {
  return (
    <div className="error-site">
      <header>
        <Link className="error-home" href="/" prefetch={false}>
          <BrandMark />
          TSUDOWA
        </Link>
      </header>
      <main id="main" className="empty-page">
        <p className="error-kicker">404 / NOT FOUND</p>
        <h1>ページが見つかりませんでした。</h1>
        <p>URLをご確認いただくか、TSUDOWAの入口へお戻りください。</p>
        <Link className="button" href="/" prefetch={false}>
          TSUDOWAへ戻る →
        </Link>
      </main>
      <footer>TSUDOWA / GATHER. BUILD. EXPAND.</footer>
    </div>
  );
}
