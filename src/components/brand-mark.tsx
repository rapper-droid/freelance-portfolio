import Image from "next/image";

/** Exact vector exported from Figma Final Art Direction, node 12:52. */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <Image
      className={`brand-mark ${className}`}
      src="/brand/tw-mark.svg"
      width={38}
      height={38}
      alt=""
      aria-hidden="true"
    />
  );
}
