import fs from "node:fs/promises";
import sharp from "sharp";
// Embed the exact committed Figma mark; no remote dependency.
const mark = await fs.readFile("public/brand/tw-mark.svg", "utf8");
const markData = `data:image/svg+xml;base64,${Buffer.from(mark).toString("base64")}`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
<rect width="1200" height="630" fill="#080a09"/>
<image href="${markData}" x="64" y="40" width="38" height="38"/>
<image href="${markData}" x="942" y="160" width="180" height="180" opacity="0.045"/>
<g fill="#f3f4ee" font-family="Arial,sans-serif">
<text x="118" y="65" font-size="19" font-weight="600" letter-spacing="1">TETSU / WORKS</text>
<text x="58" y="235" font-size="124" font-weight="900" letter-spacing="-6">BUILD.</text>
<text x="58" y="352" font-size="124" font-weight="900" letter-spacing="-6">AUTOMATE.</text>
<text x="58" y="469" font-size="124" font-weight="900" letter-spacing="-6" fill="#c7ff63">DELIVER.</text>
<text x="64" y="537" font-size="18">Websites / E-commerce / Applications / AI Automation</text>
<path d="M64 564H1136" stroke="#2a302a"/>
<text x="64" y="600" font-size="12" letter-spacing="2">MESSAGE-ONLY OK / DESIGN TO DELIVERY</text>
<text x="1000" y="600" font-size="12" fill="#a6aaa2">tetsuworks.com</text>
</g></svg>`;
await fs.writeFile("public/og.svg", svg);
await sharp(Buffer.from(svg)).png().toFile("public/og.png");
