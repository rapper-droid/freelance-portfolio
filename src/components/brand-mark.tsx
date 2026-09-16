import Image from "next/image";

/**
 * TANEBI MASTER BRAND ICON.
 *
 * One mark for TANEBI, TANEBI WORKS, TANEBI COMMAND and anything else under
 * the parent brand. What separates them is the wordmark beside it, never a
 * different drawing. Every size ships from scripts/generate-icons.mjs.
 *
 * Decorative here: the brand name is already adjacent as real text, so alt is
 * empty and the mark is hidden from screen readers rather than read twice.
 */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <Image
      className={`brand-mark ${className}`}
      src="/brand/tanebi-mark.png"
      width={38}
      height={38}
      alt=""
      aria-hidden="true"
      priority
    />
  );
}
