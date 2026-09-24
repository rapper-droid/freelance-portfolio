import fs from "node:fs";
import path from "node:path";

/**
 * Does every thing we show have a picture, and does every picture we name
 * exist? (指示書 受け入れ基準 Q07)
 *
 * The site draws most of its product imagery rather than photographing it, and
 * both drawing tables look up an id with a `?? FALLBACK` beside them. That
 * fallback is right at runtime — a missing drawing should not be a blank
 * screen — and wrong as a strategy: a product added without artwork would
 * silently become a generic mug, and nobody would ever see a failure.
 *
 * So this counts, per catalogue: every entity, whether it resolves to its own
 * artwork or to a fallback, and whether each referenced file is on disk. An
 * unreferenced file is reported too — dead weight in the deploy is worth
 * knowing about, though it is not a failure.
 *
 * Output: docs/rebuild/IMAGE_COVERAGE.json, and a non-zero exit when coverage
 * of a required slot is below 100%.
 */

const ROOT = process.cwd();
const OUT = "docs/rebuild/IMAGE_COVERAGE.json";

const read = (relative) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const exists = (relative) => fs.existsSync(path.join(ROOT, relative));

/** Keys of a top-level `const NAME ... = { ... };` object literal. */
function objectKeys(source, name) {
  const match = new RegExp(`const ${name}[^=]*= \\{(.*?)\\n\\};`, "s").exec(
    source,
  );
  if (!match) throw new Error(`${name} not found`);
  return new Set(
    [...match[1].matchAll(/^\s{2}"?([\w-]+)"?:/gm)].map((m) => m[1]),
  );
}

/** Every `field: "value"` in a source file, in order. */
const fieldValues = (source, field) =>
  [...source.matchAll(new RegExp(`\\b${field}:\\s*"([^"]+)"`, "g"))].map(
    (m) => m[1],
  );

const slots = [];
const problems = [];

function record(slot) {
  slots.push(slot);
  const missing = slot.entities.filter((e) => !e.ok);
  if (missing.length && slot.required)
    problems.push(
      `${slot.id}: ${missing.length}/${slot.entities.length} without ${slot.needs} — ${missing
        .map((e) => e.id)
        .join(", ")}`,
    );
}

// ---------------------------------------------------------------- KISSA ----
{
  const art = read("src/components/kissa/product-art.tsx");
  const palette = objectKeys(art, "PALETTE");
  const shapes = objectKeys(art, "SHAPES");
  const ids = fieldValues(read("src/lib/shop/catalog.ts"), "artId");

  record({
    id: "kissa.menu.artwork",
    label: "KISSA の商品イラスト",
    needs: "PALETTE + SHAPES",
    required: true,
    kind: "drawn",
    entities: ids.map((id) => ({
      id,
      ok: palette.has(id) && shapes.has(id),
      detail: [
        palette.has(id) ? null : "no palette",
        shapes.has(id) ? null : "no shape",
      ]
        .filter(Boolean)
        .join(", "),
    })),
  });
}

// ---------------------------------------------------------------- FORME ----
{
  const art = read("src/components/forme/product-art.tsx");
  const shapes = objectKeys(art, "SHAPES");
  const ground = objectKeys(art, "GROUND");
  const catalog = read("src/lib/forme/catalog.ts");

  // Each product block starts at its id and ends at the next one.
  const blocks = [
    ...catalog.matchAll(
      /\n    id: "([\w-]+)",\n([\s\S]*?)(?=\n  \},\n  \{|\n\];)/g,
    ),
  ];
  // ProductArt looks up SHAPES by product id and GROUND by category.
  const products = blocks.map(([, id, body]) => ({
    id,
    category: /category: "([\w-]+)"/.exec(body)?.[1] ?? "",
    colours: [...body.matchAll(/colour\("([\w-]+)"/g)].map((m) => m[1]),
    photographed: [...body.matchAll(/"([\w-]+)":\s*\[/g)].map((m) => m[1]),
  }));

  record({
    id: "forme.product.artwork",
    label: "FORME の商品の作図",
    needs: "SHAPES + GROUND",
    required: true,
    kind: "drawn",
    entities: products.map((p) => ({
      id: p.id,
      ok: shapes.has(p.id) && ground.has(p.category),
      detail: [
        shapes.has(p.id) ? null : "no shape",
        ground.has(p.category) ? null : `no ground for "${p.category}"`,
      ]
        .filter(Boolean)
        .join(", "),
    })),
  });

  // Photographs are not required — a colour with no photograph falls back to
  // the drawing on purpose. What matters is that the record says which is which.
  const colours = products.flatMap((p) =>
    p.colours.map((c) => ({
      id: `${p.id}/${c}`,
      ok: true,
      detail: p.photographed.includes(c) ? "photograph" : "drawing",
    })),
  );
  record({
    id: "forme.colour.media",
    label: "FORME の色ごとの見え方",
    needs: "写真または作図",
    required: false,
    kind: "mixed",
    entities: colours,
  });
}

// ----------------------------------------------------------- portfolio ----
{
  const portfolio = read("src/lib/portfolio.ts");
  const slugs = fieldValues(portfolio, "slug");
  const revision = /previewRevision = "([\w-]+)"/.exec(
    read("src/lib/preview.ts"),
  )[1];
  const devices = ["desktop", "tablet", "mobile"];

  record({
    id: "projects.previews",
    label: "制作例のプレビュー（3 幅）",
    needs: `/previews/*-${revision}.webp`,
    required: true,
    kind: "file",
    entities: slugs.flatMap((slug) =>
      devices.map((device) => {
        const file = `public/previews/${slug}-${device}-${revision}.webp`;
        return { id: `${slug}/${device}`, ok: exists(file), detail: file };
      }),
    ),
  });
}

// ------------------------------------------------- every referenced file ----
{
  const referenced = new Set();
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(tsx?|mjs|json)$/.test(entry.name))
        for (const m of fs
          .readFileSync(full, "utf8")
          .matchAll(/"(\/(?:visuals|previews)\/[\w./-]+)"/g))
          referenced.add(m[1]);
    }
  };
  walk(path.join(ROOT, "src"));

  record({
    id: "referenced.files",
    label: "コードが名前を書いている画像",
    needs: "public/ に実在",
    required: true,
    kind: "file",
    entities: [...referenced].sort().map((url) => ({
      id: url,
      ok: exists(path.join("public", url)),
      detail: "",
    })),
  });

  // Not a failure: the preview archive keeps older capture sets on purpose.
  const onDisk = fs
    .readdirSync(path.join(ROOT, "public/visuals"))
    .map((f) => `/visuals/${f}`);
  const unused = onDisk.filter((f) => !referenced.has(f));
  slots.push({
    id: "visuals.unused",
    label: "参照されていない /visuals",
    needs: "—",
    required: false,
    kind: "report",
    entities: unused.map((id) => ({ id, ok: true, detail: "unreferenced" })),
  });
}

// ------------------------------------------------------------- summary ----
const summary = slots.map((s) => ({
  id: s.id,
  label: s.label,
  required: s.required,
  kind: s.kind,
  total: s.entities.length,
  covered: s.entities.filter((e) => e.ok).length,
}));

fs.mkdirSync(path.join(ROOT, "docs/rebuild"), { recursive: true });
fs.writeFileSync(
  path.join(ROOT, OUT),
  JSON.stringify(
    { checkedAt: new Date().toISOString(), summary, slots },
    null,
    2,
  ) + "\n",
  "utf8",
);

for (const s of summary)
  console.log(
    `${s.covered === s.total ? "OK  " : "MISS"} ${s.id.padEnd(24)} ${s.covered}/${s.total}${
      s.required ? "" : "  (報告のみ)"
    }`,
  );

if (problems.length) {
  console.log("\n" + problems.join("\n"));
  process.exit(1);
}
console.log(`\nwrote ${OUT}`);
