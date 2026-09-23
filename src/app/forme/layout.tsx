import Link from "next/link";
import { FormeProvider } from "@/components/forme/forme-provider";
import { FormeNav } from "@/components/forme/forme-nav";
import { FORME_STORAGE_DISCLOSURE } from "@/lib/forme/store";
import { FORME_REFERENCE_ISO } from "@/lib/forme/types";
import "./forme.css";

/**
 * FORME's own shell (指示書 §16).
 *
 * The operating logic is shared with KISSA; the look is not. A shop selling
 * objects should not feel like a cafe, and §16 asks for exactly that: common
 * rules, independent storefronts.
 *
 * The banner saying this is a fictional shop with no real orders is on every
 * screen, above the fold, and is not something a visitor has to go looking for.
 */
export default function FormeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FormeProvider referenceIso={FORME_REFERENCE_ISO}>
      <div className="forme">
        <p className="forme-demo-banner">
          <strong>架空の店舗のデモです。</strong>
          実際の注文・配送・支払いは発生しません。
          <Link href="/demos/ec">この制作例について</Link>
        </p>
        <FormeNav />
        <main id="main" className="forme-main">
          {children}
        </main>
        <footer className="forme-footer">
          <div className="forme-footer-inner">
            <p className="forme-wordmark">FORME</p>
            <p>{FORME_STORAGE_DISCLOSURE}</p>
            <nav aria-label="フッター">
              <Link href="/forme">トップ</Link>
              <Link href="/forme/items">商品一覧</Link>
              <Link href="/forme/cart">カート</Link>
              <Link href="/forme/my">注文・お気に入り</Link>
              {/* Kept out of the header: a customer has no use for it, but a
                  visitor reading the demo should be able to find it. */}
              <Link href="/forme/admin">運営画面を見る</Link>
              <Link href="/demos/ec">制作例の説明へ戻る</Link>
            </nav>
          </div>
        </footer>
      </div>
    </FormeProvider>
  );
}
