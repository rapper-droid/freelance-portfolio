import { notFound } from "next/navigation";
import { ItemDetail } from "@/components/forme/item-detail";
import { productById, products } from "@/lib/forme/catalog";
import { pageMetadata } from "@/lib/seo";

/** Every product has its own page, prerendered (指示書 §16). */
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
      `${product.name}｜FORME（架空店舗のデモ）`,
      product.summary,
      `/forme/items/${product.id}`,
    ),
    robots: { index: false, follow: true },
  };
}

export default async function FormeItem({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const product = productById((await params).productId);
  if (!product) notFound();
  return <ItemDetail product={product} />;
}
