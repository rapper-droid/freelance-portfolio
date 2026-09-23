import Link from "next/link";
import { FormeAdmin } from "@/components/forme/forme-admin";
import { pageMetadata } from "@/lib/seo";

/**
 * The operator's side of the same records (指示書 §16).
 *
 * Open, and deliberately so: there is no real shop, no real customer and no
 * real money, and the data it shows is the visitor's own.
 */
export const metadata = {
  ...pageMetadata(
    "運営画面｜FORME（架空店舗のデモ）",
    "注文の進行、在庫の増減、取り扱いの切り替え、売上の集計。客側の画面と同じ記録を運営側から操作できる、架空店舗のデモです。",
    "/forme/admin",
  ),
  robots: { index: false, follow: false },
};

export default function FormeAdminPage() {
  return (
    <>
      <div className="forme-page-head">
        <span className="forme-eyebrow">ADMIN</span>
        <h1>運営画面</h1>
        <p>
          客側の画面と同じ記録を操作します。在庫を変えると商品ページに、注文を進めると
          お客さまの確認画面に、そのまま反映されます。
        </p>
        <p className="forme-page-head-links">
          <Link href="/forme/my">ご注文・お気に入り</Link>
          <Link href="/forme/items">商品一覧</Link>
        </p>
      </div>
      <FormeAdmin />
    </>
  );
}
