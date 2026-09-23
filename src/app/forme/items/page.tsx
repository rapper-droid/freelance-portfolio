import { ItemBrowser } from "@/components/forme/item-browser";
import { ART_DISCLOSURE } from "@/components/forme/product-art";
import { products } from "@/lib/forme/catalog";
import { pageMetadata } from "@/lib/seo";

/** The full catalogue, filterable, searchable and comparable (指示書 §16). */
export const metadata = {
  ...pageMetadata(
    "商品一覧｜FORME（架空店舗のデモ）",
    `毎日使う道具 ${products.length} 品。カラーやサイズを選ぶと、画像・価格・在庫が連動します。架空店舗のデモです。`,
    "/forme/items",
  ),
  robots: { index: false, follow: true },
};

export default async function FormeItems({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  return (
    <>
      <div className="forme-page-head">
        <span className="forme-eyebrow">ITEMS</span>
        <h1>商品一覧</h1>
        <p>
          {
            "在庫は一つずつ数えています。売り切れは売り切れ、残りわずかは残りわずかと表示します。"
          }
        </p>
      </div>
      <p className="forme-note">{ART_DISCLOSURE}</p>
      <ItemBrowser initialCategory={category ?? ""} />
    </>
  );
}
