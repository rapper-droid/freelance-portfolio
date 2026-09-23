import { CartFlow } from "@/components/forme/cart-flow";
import { pageMetadata } from "@/lib/seo";

/** Cart through to a placed order (指示書 §16). */
export const metadata = {
  ...pageMetadata(
    "カート・ご注文｜FORME（架空店舗のデモ）",
    "カートの確認から受け取り方法、注文の確定までを操作できます。架空店舗のデモで、実際の注文や支払いは発生しません。",
    "/forme/cart",
  ),
  // A checkout is never something to index (指示書 §22).
  robots: { index: false, follow: false },
};

export default function FormeCart() {
  return (
    <>
      <div className="forme-page-head">
        <span className="forme-eyebrow">CART</span>
        <h1>カート</h1>
        <p>送料は受け取り方法と地域から計算します。金額はすべて税込です。</p>
      </div>
      <CartFlow />
    </>
  );
}
