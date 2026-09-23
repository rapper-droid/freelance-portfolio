import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/kissa/product-detail";
import { productById, products } from "@/lib/shop/catalog";
import { pageMetadata } from "@/lib/seo";

/** Every product has its own page, prerendered (指示書 §10「商品詳細」). */
export const generateStaticParams = () =>
  products.map((p) => ({ productId: p.id }));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const product = productById((await params).productId);
  if (!product) notFound();
  return {
    ...pageMetadata(
      `${product.name}｜KISSA（架空店舗のデモ）`,
      product.summary,
      `/kissa/menu/${product.id}`,
    ),
    robots: { index: false, follow: true },
  };
}

export default async function KissaProduct({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const product = productById((await params).productId);
  if (!product) notFound();
  return <ProductDetail product={product} />;
}
