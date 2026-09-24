import Link from "next/link";
import { AdminConsole } from "@/components/kissa/admin-console";
import { pageMetadata } from "@/lib/seo";

/**
 * The operator's side of the same records (指示書 §13).
 *
 * Open, and deliberately so: there is no real shop, no real customer and no
 * real money, and the data it shows is the visitor's own. A login here would
 * protect nothing and hide the only thing worth demonstrating — that the two
 * sides are the same record.
 */
export const metadata = {
  ...pageMetadata(
    "運営画面｜KISSA（架空店舗のデモ）",
    "注文の進行、席の状況、販売状態の切り替え、売上の集計。客側の画面と同じ記録を運営側から操作できる、架空店舗のデモです。",
    "/kissa/admin",
  ),
  robots: { index: false, follow: false },
};

export default function KissaAdmin() {
  return (
    <>
      <div className="kissa-page-head">
        <span className="kissa-eyebrow">ADMIN</span>
        <h1>運営画面</h1>
        <p>
          {
            "客側の画面と同じ記録を操作します。ここで進めた注文はお客さまの確認画面に、売り切れにした商品はメニューに、そのまま反映されます。"
          }
        </p>
        <p className="kissa-page-head-links">
          <Link href="/kissa/my">ご注文・ご予約</Link>
          <Link href="/kissa/menu">メニュー</Link>
        </p>
      </div>
      <AdminConsole />
    </>
  );
}
