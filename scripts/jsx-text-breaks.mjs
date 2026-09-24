import fs from "node:fs";
import path from "node:path";

/**
 * Finds Japanese sentences that JSX has broken across two lines.
 *
 * React turns a newline between two text lines into a single space. In English
 * that is what you want. In Japanese there is no space between words, so
 *
 *     <p>
 *       架空店舗のため、
 *       実際の注文は発生しません。
 *     </p>
 *
 * renders as "架空店舗のため、 実際の注文は発生しません。" — a gap in the middle
 * of a sentence, on the page, for every reader.
 *
 * Joining the two lines does not fix it: Prettier reflows JSX text to the print
 * width and puts the break back. The fix is to move the sentence into a string
 * expression, `{"…"}`, which Prettier leaves alone.
 *
 * Run with `--fix` to do that automatically for every run of plain text lines.
 * Without it, this prints what it found and exits non-zero.
 */

const ROOT = process.cwd();
const FIX = process.argv.includes("--fix");

/** Kana, kanji and the full-width punctuation that ends a Japanese clause. */
const JP = /[　-ヿ一-鿿＀-｠々]/;
const endsJapanese = new RegExp(JP.source + "$");
const startsJapanese = new RegExp("^" + JP.source);

/**
 * A line that is nothing but JSX text: no tag, no expression, no comment.
 * Anything else ends the run, because the transform must not swallow it.
 */
function isPlainText(line) {
  const t = line.trim();
  if (!t) return false;
  if (/[<>{}]/.test(t)) return false;
  if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*"))
    return false;
  // Inside a string, an object or an import — anything that is not JSX body.
  if (/["'`]/.test(t)) return false;
  if (t.endsWith(",") || t.endsWith(";") || t.endsWith(":")) return false;
  return true;
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".tsx")) out.push(full);
  }
  return out;
}

const findings = [];
let fixedFiles = 0;

for (const file of walk(path.join(ROOT, "src"))) {
  const original = fs.readFileSync(file, "utf8");
  const lines = original.split("\n");
  const output = [];
  let changed = false;

  for (let i = 0; i < lines.length;) {
    if (!isPlainText(lines[i])) {
      output.push(lines[i]);
      i += 1;
      continue;
    }

    // The maximal run of plain-text lines. Taking anything less would turn a
    // boundary that renders as a space into one that renders as nothing.
    let end = i;
    while (end + 1 < lines.length && isPlainText(lines[end + 1])) end += 1;

    const run = lines.slice(i, end + 1).map((l) => l.trim());
    const breaks = [];
    for (let k = 0; k + 1 < run.length; k++)
      if (endsJapanese.test(run[k]) && startsJapanese.test(run[k + 1]))
        breaks.push(i + k + 1);

    if (breaks.length === 0) {
      for (let k = i; k <= end; k++) output.push(lines[k]);
      i = end + 1;
      continue;
    }

    for (const line of breaks)
      findings.push({ file: path.relative(ROOT, file), line });

    if (FIX) {
      // Japanese against Japanese joins with nothing; anything else keeps the
      // space React would have put there.
      let joined = run[0];
      for (let k = 1; k < run.length; k++) {
        const glue =
          endsJapanese.test(run[k - 1]) && startsJapanese.test(run[k])
            ? ""
            : " ";
        joined += glue + run[k];
      }
      const indent = lines[i].match(/^\s*/)[0];
      output.push(indent + "{" + JSON.stringify(joined) + "}");
      changed = true;
    } else {
      for (let k = i; k <= end; k++) output.push(lines[k]);
    }
    i = end + 1;
  }

  if (changed) {
    fs.writeFileSync(file, output.join("\n"), "utf8");
    fixedFiles += 1;
  }
}

if (FIX) {
  console.log(
    `rewrote ${findings.length} broken sentences in ${fixedFiles} files — run prettier next`,
  );
  process.exit(0);
}

if (findings.length === 0) {
  console.log("PASS no Japanese sentence is split across JSX lines");
  process.exit(0);
}

for (const f of findings) console.log(`${f.file}:${f.line}`);
console.log(
  `\n${findings.length} Japanese sentences render with a space in the middle.\n` +
    "Run `node scripts/jsx-text-breaks.mjs --fix` and then prettier.",
);
process.exit(1);
