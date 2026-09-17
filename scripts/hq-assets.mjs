import sharp from "sharp";
import fs from "node:fs/promises";
import crypto from "node:crypto";

// Native editorial composition. Screens come only from our self-initiated demo.
const backdrop = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#101411"/>
<path d="M54 112H1146M54 552H1146" stroke="#43513d"/>
<g font-family="Arial,sans-serif" fill="#eeeae2">
<text x="54" y="78" font-size="25" letter-spacing="3">TSUDOWA / AN OPEN CIRCLE</text>
<text x="54" y="246" font-size="96" font-weight="600" letter-spacing="-6">GATHER.</text>
<text x="54" y="337" font-size="96" font-weight="600" letter-spacing="-6">BUILD.</text>
<text x="54" y="428" font-size="96" font-weight="600" letter-spacing="-6" fill="#f1b761">EXPAND.</text>
<text x="57" y="491" font-size="17" letter-spacing="2" fill="#bbc5b3">WORK. PLAY. WHAT COMES NEXT.</text>
<text x="54" y="591" font-size="20">TSUDOWA.COM</text>
<text x="821" y="591" font-size="15" fill="#bbc5b3">TETSU WORKS / TSUKUTTA LAB</text>
</g>
<circle cx="916" cy="281" r="151" fill="none" stroke="#505e43"/>
<circle cx="916" cy="281" r="127" fill="none" stroke="#2d3927"/>
<rect x="630" y="337" width="302" height="184" fill="#e9e7de"/>
<text x="644" y="361" font-family="Arial,sans-serif" font-size="13" fill="#25332b">TETSU WORKS / DESIGN &amp; BUILD</text>
<rect x="966" y="342" width="180" height="179" fill="#2b3a24" stroke="#6e875a"/>
<text x="979" y="365" font-family="Arial,sans-serif" font-size="12" fill="#cee9b5">TSUKUTTA LAB</text>
<ellipse cx="1056" cy="423" rx="38" ry="43" fill="none" stroke="#98b481"/>
<circle cx="1056" cy="423" r="27" fill="#b2d399"/>
<text x="1056" y="421" font-family="Arial,sans-serif" font-size="11" text-anchor="middle" fill="#24351a">APP</text>
<text x="1056" y="435" font-family="Arial,sans-serif" font-size="11" text-anchor="middle" fill="#24351a">EGG</text>
<text x="979" y="496" font-family="Arial,sans-serif" font-size="10" fill="#c4d9b4">PRODUCTS &amp; EXPERIMENTS</text>
</svg>`;
const mark = await sharp("public/brand/tsudowa-mark.svg")
  .resize(152, 152)
  .png()
  .toBuffer();
const preview = await sharp("public/previews/inbox-desktop-master-4.webp")
  .resize(274, 138, { fit: "cover", position: "top" })
  .png()
  .toBuffer();
const image = await sharp(Buffer.from(backdrop))
  .composite([
    { input: mark, left: 840, top: 187 },
    { input: preview, left: 644, top: 373 },
  ])
  .png({ compressionLevel: 9 })
  .toBuffer();
await fs.writeFile("public/og-hq.png", image);
console.log(
  JSON.stringify({
    file: "public/og-hq.png",
    width: 1200,
    height: 630,
    bytes: image.length,
    sha256: crypto.createHash("sha256").update(image).digest("hex"),
    sources: [
      "public/brand/tsudowa-mark.svg",
      "public/previews/inbox-desktop-master-4.webp",
    ],
    syntheticPhoto: false,
  }),
);
