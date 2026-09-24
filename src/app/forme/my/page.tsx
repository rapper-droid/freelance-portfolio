import { MyOrders } from "@/components/forme/my-orders";
import { pageMetadata } from "@/lib/seo";

/** This visitor's own orders and favourites (指示書 §16). */
export const metadata = {
  ...pageMetadata(
    "注文・お気に入り｜FORME（架空店舗のデモ）",
    "この端末から行った注文の状況と、お気に入りの商品を確認できます。架空店舗のデモです。",
    "/forme/my",
  ),
  robots: { index: false, follow: false },
};

export default function FormeMy() {
  return (
    <>
      <div className="forme-page-head">
        <span className="forme-eyebrow">MY</span>
        <h1>ご注文・お気に入り</h1>
        <p>
          {
            "この端末から行った分を表示しています。ログインは不要で、他の端末とは共有されません。"
          }
        </p>
      </div>
      <MyOrders />
    </>
  );
}
