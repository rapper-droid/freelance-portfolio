import Image from "next/image";

/**
 * TSUDOWA symbol.
 *
 * Four open arcs gather around one core. The gaps keep the ring in motion:
 * things meet here, become something together, then continue outward. The
 * adjacent wordmark is real text, so the image stays decorative in the UI.
 */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <Image
      className={`brand-mark ${className}`}
      src="/brand/tsudowa-mark.svg"
      width={38}
      height={38}
      alt=""
      aria-hidden="true"
      priority
    />
  );
}
