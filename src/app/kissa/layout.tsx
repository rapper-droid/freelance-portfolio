import Link from "next/link";
import { ShopProvider } from "@/components/kissa/shop-provider";
import { KissaNav } from "@/components/kissa/kissa-nav";
import { STORAGE_DISCLOSURE } from "@/lib/shop/store";
import "./kissa.css";

/**
 * KISSA's own shell (指示書 §10).
 *
 * The shop gets its own chrome rather than the portfolio's, because the point
 * of the demo is what a cafe's site feels like to use. What it does not get is
 * ambiguity about what it is: the banner saying this is a fictional shop with
 * no real orders stays on every screen, above the fold, and is not something a
 * visitor has to go looking for.
 */
export default function KissaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ShopProvider>
      <div className="kissa">
        <p className="kissa-demo-banner">
          <strong>架空の店舗のデモです。</strong>
          実際の注文・予約・支払いは発生しません。
          <Link href="/demos/cafe">この制作例について</Link>
        </p>
        <KissaNav />
        <main id="main" className="kissa-main">
          {children}
        </main>
        <footer className="kissa-footer">
          <div className="kissa-footer-inner">
            <p className="kissa-wordmark">KISSA</p>
            <p>{STORAGE_DISCLOSURE}</p>
            <nav aria-label="フッター">
              <Link href="/kissa">店舗トップ</Link>
              <Link href="/kissa/menu">メニュー</Link>
              <Link href="/kissa/reserve">席の予約</Link>
              <Link href="/kissa/my">注文・予約の確認</Link>
              {/* Kept out of the header: a customer has no use for it, but a
                  visitor reading the demo should be able to find it. */}
              <Link href="/kissa/admin">運営画面を見る</Link>
              <Link href="/demos/cafe">制作例の説明へ戻る</Link>
            </nav>
          </div>
        </footer>
      </div>
    </ShopProvider>
  );
}
