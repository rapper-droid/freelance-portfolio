import { OrderFlow } from "@/components/kissa/order-flow";
import { pageMetadata } from "@/lib/seo";

/** Cart, pickup time, confirmation and a simulated payment (指示書 §12). */
export const metadata = {
  ...pageMetadata(
    "カート・テイクアウト注文｜KISSA（架空店舗のデモ）",
    "カートの確認から受取時間の選択、注文の確定までを操作できます。架空店舗のデモで、実際の注文や支払いは発生しません。",
    "/kissa/order",
  ),
  // A checkout is never something to index (指示書 §22).
  robots: { index: false, follow: false },
};

export default function KissaOrder() {
  return (
    <>
      <div className="kissa-page-head">
        <span className="kissa-eyebrow">ORDER</span>
        <h1>テイクアウトのご注文</h1>
        <p>受け取れる時間は、ご注文の内容と営業時間から計算しています。</p>
      </div>
      <OrderFlow />
    </>
  );
}
