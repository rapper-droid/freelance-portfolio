import type { MenuItem } from "@/lib/cafe-menu";

/**
 * Product art for the KISSA demo.
 *
 * Drawn here rather than photographed. The honest reason is in
 * docs/IMAGE_SOURCES.md: a site that takes real client enquiries should not
 * ship stock photography whose licence cannot be recorded and checked, and
 * this shop is fictional, so there is nothing to photograph. Consistent line
 * art reads as deliberate art direction; mismatched stock photos of six
 * different real cafes would not.
 *
 * All decorative: every drawing sits beside the item's real name, Japanese
 * name, description and price, so nothing here is the only source of
 * anything. They scale with the card and inherit colour from it.
 */

const S = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.1,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** A saucer, shared by the cup drinks so the set looks like one family. */
function Saucer() {
  return <path d="M14 52h36" {...S} />;
}

function Steam({ x = 32 }: { x?: number }) {
  return (
    <g opacity="0.55">
      <path d={`M${x - 6} 17c2-3-2-5 0-8`} {...S} />
      <path d={`M${x} 15c2-3-2-5 0-8`} {...S} />
      <path d={`M${x + 6} 17c2-3-2-5 0-8`} {...S} />
    </g>
  );
}

const ART: Record<MenuItem["art"], React.ReactNode> = {
  espresso: (
    <>
      <Steam x={32} />
      <path d="M22 28h20v12a10 10 0 0 1-20 0z" {...S} />
      <path d="M42 31h5a4 4 0 0 1 0 8h-5" {...S} />
      <Saucer />
    </>
  ),
  latte: (
    <>
      <Steam x={32} />
      <path d="M17 26h30v16a12 12 0 0 1-24 0z" {...S} />
      <path d="M47 30h4a5 5 0 0 1 0 10h-4" {...S} />
      {/* leaf, the one thing that says "latte" at a glance */}
      <path
        d="M32 33c0 4 0 7 0 9M32 35c-3-2-5-1-6 1 2 2 4 2 6-1zM32 38c3-2 5-1 6 1-2 2-4 2-6-1z"
        {...S}
      />
      <Saucer />
    </>
  ),
  cappuccino: (
    <>
      <Steam x={32} />
      <path d="M17 28h30v14a12 12 0 0 1-24 0z" {...S} />
      <path d="M47 32h4a5 5 0 0 1 0 10h-4" {...S} />
      <path d="M21 30c3 3 7 3 11 0s8-3 11 0" {...S} opacity="0.7" />
      <Saucer />
    </>
  ),
  drip: (
    <>
      <Steam x={32} />
      <path d="M20 18h24l-8 14h-8z" {...S} />
      <path d="M28 32v4" {...S} />
      <path d="M22 40h20v6a8 8 0 0 1-16 0z" {...S} />
      <Saucer />
    </>
  ),
  matcha: (
    <>
      <Steam x={32} />
      <path d="M19 27h26v15a11 11 0 0 1-22 0z" {...S} />
      {/* whisk marks */}
      <path d="M25 33c4 2 10 2 14 0" {...S} opacity="0.7" />
      <path d="M27 38c3 1 7 1 10 0" {...S} opacity="0.5" />
      <Saucer />
    </>
  ),
  "seasonal-drink": (
    <>
      <path d="M23 20h18l-2 28a5 5 0 0 1-5 4h-4a5 5 0 0 1-5-4z" {...S} />
      <path d="M24 32h16" {...S} opacity="0.6" />
      <path
        d="M32 20v-6M32 14c-3 0-5-2-5-4 3 0 5 2 5 4zM32 14c3 0 5-2 5-4-3 0-5 2-5 4z"
        {...S}
      />
    </>
  ),
  toast: (
    <>
      <path
        d="M16 24c0-5 7-8 16-8s16 3 16 8v22a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4z"
        {...S}
      />
      <path d="M24 30h16v10H24z" {...S} opacity="0.65" />
      <path d="M30 33l4 4" {...S} opacity="0.5" />
    </>
  ),
  sandwich: (
    <>
      <path d="M12 42 34 18l18 18-22 24z" {...S} />
      <path d="M20 40l14-15 10 10" {...S} opacity="0.6" />
      <path d="M26 44c3-3 6-3 9 0" {...S} opacity="0.5" />
    </>
  ),
  cake: (
    <>
      <path d="M14 30h36v18a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4z" {...S} />
      <path d="M14 38h36" {...S} opacity="0.6" />
      <path d="M22 30c0-5 4-8 10-8s10 3 10 8" {...S} />
      <path d="M32 22v-5" {...S} />
      <circle cx="32" cy="15" r="2.4" {...S} />
    </>
  ),
  pastry: (
    <>
      <path
        d="M12 42c6-14 14-20 20-20s14 6 20 20c-6 4-14 6-20 6s-14-2-20-6z"
        {...S}
      />
      <path
        d="M26 24c-2 8-2 16 0 22M38 24c2 8 2 16 0 22"
        {...S}
        opacity="0.6"
      />
    </>
  ),
  breakfast: (
    <>
      <circle cx="32" cy="36" r="18" {...S} />
      <circle cx="26" cy="33" r="6" {...S} opacity="0.8" />
      <circle cx="26" cy="33" r="2" {...S} />
      <path d="M36 30h10M36 36h10M36 42h7" {...S} opacity="0.65" />
    </>
  ),
  "seasonal-food": (
    <>
      <path d="M12 38h40v4a10 10 0 0 1-10 10H22a10 10 0 0 1-10-10z" {...S} />
      <path d="M14 38c2-8 8-12 18-12s16 4 18 12" {...S} />
      <circle cx="26" cy="32" r="3" {...S} opacity="0.75" />
      <circle cx="36" cy="30" r="3" {...S} opacity="0.75" />
      <circle cx="31" cy="35" r="2.4" {...S} opacity="0.6" />
    </>
  ),
};

export function CafeArt({ art }: { art: MenuItem["art"] }) {
  return (
    <svg
      className="cafe-art"
      viewBox="0 0 64 64"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      {ART[art]}
    </svg>
  );
}

/**
 * The area around the shop.
 *
 * Deliberately a schematic, not a map: KISSA does not exist, so a real map
 * would point at a real address that has nothing to do with it. A schematic
 * says "four minutes from the east exit" without making a false claim about
 * a place, and it is the shape a client would replace with their own map.
 */
export function AccessMap() {
  return (
    <svg
      className="cafe-map"
      viewBox="0 0 320 180"
      role="img"
      aria-label="◯◯駅 東口から南へ、大通りを渡って徒歩4分の位置にある店舗の概略図。正確な地図ではありません。"
      focusable="false"
    >
      <rect width="320" height="180" rx="10" className="cafe-map-bg" />
      {/* roads */}
      <path d="M0 108h320" className="cafe-map-road" strokeWidth="16" />
      <path d="M196 0v180" className="cafe-map-road" strokeWidth="11" />
      <path
        d="M0 52h320"
        className="cafe-map-road"
        strokeWidth="7"
        opacity="0.6"
      />
      {/* station */}
      <rect
        x="28"
        y="78"
        width="74"
        height="30"
        rx="5"
        className="cafe-map-block"
      />
      <text x="65" y="97" className="cafe-map-label" textAnchor="middle">
        ◯◯駅
      </text>
      {/* walking route */}
      <path
        d="M102 96h70v34h44"
        className="cafe-map-route"
        strokeDasharray="5 6"
      />
      {/* the shop */}
      <circle cx="222" cy="130" r="9" className="cafe-map-pin" />
      <circle cx="222" cy="130" r="3.4" className="cafe-map-pin-core" />
      <text x="238" y="134" className="cafe-map-label cafe-map-label--shop">
        KISSA
      </text>
      <text x="112" y="150" className="cafe-map-label cafe-map-label--soft">
        徒歩4分
      </text>
    </svg>
  );
}
