import Image from "next/image";
import { ProductArt, type ArtSize } from "./product-art";
import { colourOf } from "@/lib/forme/catalog";
import type { FormeImage, FormeProduct } from "@/lib/forme/types";

/**
 * The picture for a product in the colour currently chosen (指示書 §16).
 *
 * One component decides between a photograph and a drawing, so no screen can
 * accidentally show the sage photograph beside a charcoal price. Every caller
 * passes the chosen colour; the fallback is the product's first colour, never
 * a fixed image.
 */

export function imagesFor(
  product: FormeProduct,
  colourId: string | null,
): FormeImage[] {
  if (!colourId) return [];
  return product.images[colourId] ?? [];
}

export const hasPhoto = (product: FormeProduct, colourId: string | null) =>
  imagesFor(product, colourId).length > 0;

const PIXELS: Record<ArtSize, number> = { card: 240, detail: 440, thumb: 72 };

export function ProductMedia({
  product,
  variantIds = [],
  size = "card",
  index = 0,
  priority = false,
}: {
  product: FormeProduct;
  variantIds?: readonly string[];
  size?: ArtSize;
  /** Which of the colour's images to show. */
  index?: number;
  priority?: boolean;
}) {
  const colourId = colourOf(product, variantIds);
  const images = imagesFor(product, colourId);
  const image = images[index] ?? images[0];

  if (!image?.src)
    return <ProductArt product={product} colourId={colourId} size={size} />;

  const px = PIXELS[size];
  return (
    <Image
      className="forme-photo"
      src={image.src}
      alt={image.alt}
      width={px * 2}
      height={px * 2}
      sizes={size === "detail" ? "(max-width: 860px) 92vw, 46vw" : "260px"}
      priority={priority}
    />
  );
}
