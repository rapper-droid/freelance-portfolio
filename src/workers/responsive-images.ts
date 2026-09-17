import raw from "./responsive-manifest.json";
type ImageEntry = {
  originalWidth: number;
  originalHeight: number;
  originalBytes: number;
  variants: { width: number; path: string; bytes: number }[];
};
const manifest: Record<string, ImageEntry> = raw;
export function responsivePath(url: URL) {
  if (url.pathname !== "/_next/image") return null;
  const src = url.searchParams.get("url") || "",
    width = Number(url.searchParams.get("w")),
    quality = Number(url.searchParams.get("q") || 75);
  if (!Number.isInteger(width) || width < 1 || width > 3840 || quality !== 75)
    return null;
  if (!Object.prototype.hasOwnProperty.call(manifest, src)) return null;
  const image = manifest[src];
  return (
    (image.variants.find((v) => v.width >= width) || image.variants.at(-1))
      ?.path ?? null
  );
}
