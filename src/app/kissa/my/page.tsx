import { MyPage } from "@/components/kissa/my-page";
import { pageMetadata } from "@/lib/seo";

/** This visitor's own orders and bookings (指示書 §11, §12). */
export const metadata = {
  ...pageMetadata(
    "注文・予約の確認｜KISSA（架空店舗のデモ）",
    "この端末から行った注文の進み具合と、予約の変更・取消を確認できます。架空店舗のデモです。",
    "/kissa/my",
  ),
  // Someone's own records are never something to index (指示書 §22).
  robots: { index: false, follow: false },
};

export default function KissaMy() {
  return (
    <>
      <div className="kissa-page-head">
        <span className="kissa-eyebrow">MY</span>
        <h1>ご注文・ご予約</h1>
        <p>
          この端末から行った分を表示しています。ログインは不要で、他の端末とは共有されません。
        </p>
      </div>
      <MyPage />
    </>
  );
}
