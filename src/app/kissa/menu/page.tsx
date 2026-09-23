import { MenuBrowser } from "@/components/kissa/menu-browser";
import { ART_DISCLOSURE } from "@/components/kissa/product-art";
import { products } from "@/lib/shop/catalog";
import { pageMetadata } from "@/lib/seo";

/** The full menu, filterable and searchable (指示書 §10). */
export const metadata = {
  ...pageMetadata(
    "メニュー｜KISSA（架空店舗のデモ）",
    `コーヒー・お茶・フード・デザートなど ${products.length} 品。温度やサイズを選んでカートに入れられます。架空店舗のデモです。`,
    "/kissa/menu",
  ),
  robots: { index: false, follow: true },
};

export default async function KissaMenu({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  return (
    <>
      <div className="kissa-page-head">
        <span className="kissa-eyebrow">MENU</span>
        <h1>メニュー</h1>
        <p>
          その日の豆と仕入れで少しずつ変わります。売り切れは売り切れと表示します。
        </p>
      </div>
      <p className="kissa-note">{ART_DISCLOSURE}</p>
      <MenuBrowser initialCategory={category ?? ""} />
    </>
  );
}
