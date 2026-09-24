/**
 * The three weeks the tool has to survive (指示書 §15).
 *
 * The spec makes this flow mandatory, and it is the whole argument for the
 * product: *week one you explain it, week two you do not, week three it asks
 * only about the part that is genuinely new.*
 *
 *   1. Week 1 — the columns in their original order. A person maps them once
 *      and saves a recipe.
 *   2. Week 2 — the same meaning, the columns shuffled. Must run with no
 *      questions at all; a reordered column is the same data.
 *   3. Week 3 — a column nobody has seen and a tax category nobody approved.
 *      Must stop, and must stop *only* on those two things.
 *
 * The rows carry the cases the spec names: a leading-zero id that must not
 * become twelve, a negative refund that must not be "repaired", zero, a
 * decimal, a quoted comma, a newline inside a cell, a blank, a duplicate, and
 * two date formats in one file. They are here because a sample that only
 * contains tidy rows proves nothing.
 */

const quote = (cell: string) => `"${cell.replace(/"/g, '""')}"`;

const toCsv = (headers: string[], rows: string[][]) =>
  [headers, ...rows].map((r) => r.map(quote).join(",")).join("\r\n");

export type SampleWeek = {
  id: "week1" | "week2" | "week3";
  label: string;
  /** What a person should notice when they open it. */
  note: string;
  csv: string;
};

const WEEK1_HEADERS = ["注文ID", "日付", "商品", "数量", "金額", "税区分"];

/** Week 1, in the order the columns arrived. */
const WEEK1_ROWS: string[][] = [
  ["0012", "2026-09-01", "Webサイト修正", "1", "50000", "10%"],
  ["0013", "2026-09-01", "データ加工", "2", "24000", "10%"],
  // A quoted comma, which a naive splitter turns into two columns.
  ["0014", "2026/09/02", "レポート作成, 月次", "1", "18000", "10%"],
  // A refund. -5000 is a number, not damage to be repaired.
  ["0015", "2026-09-02", "Webサイト修正（返金）", "1", "-5000", "10%"],
  // Zero is a real amount and must appear in the count.
  ["0016", "2026-09-03", "初回相談", "1", "0", "10%"],
  // A yen amount with decimals, which does not exist. Rounding it is a
  // decision for a person, so the row waits for one.
  ["0017", "2026-09-03", "時間課金", "1", "12345.50", "10%"],
  // A newline inside a cell.
  ["0018", "2026-09-04", "フォーム制作\n（問い合わせ用）", "3", "36000", "10%"],
  // Blank amount: unreadable, and must be reported rather than counted as 0.
  ["0019", "2026-09-04", "保守", "1", "", "10%"],
  // Text where a number belongs: the other reason a row becomes a problem.
  ["0020", "2026-09-05", "打ち合わせ", "1", "無料", "10%"],
  // A duplicate order id, for the dedupe rule to have something to do.
  ["0013", "2026-09-05", "データ加工", "2", "24000", "10%"],
  ["0021", "2026/09/05", "Webサイト修正", "1", "50000", "10%"],
  ["0022", "2026-09-06", "データ加工", "4", "48000", "10%"],
];

/** Week 2: identical meaning, different column order, different numbers. */
const WEEK2_ORDER = ["日付", "金額", "注文ID", "税区分", "商品", "数量"];

const WEEK2_SOURCE: string[][] = [
  ["0031", "2026-09-08", "Webサイト修正", "1", "50000", "10%"],
  ["0032", "2026-09-08", "データ加工", "3", "36000", "10%"],
  ["0033", "2026-09-09", "レポート作成, 週次", "1", "18000", "10%"],
  ["0034", "2026-09-09", "初回相談", "1", "0", "10%"],
  ["0035", "2026/09/10", "フォーム制作", "2", "24000", "10%"],
  ["0036", "2026-09-10", "時間課金", "1", "9876.25", "10%"],
  ["0037", "2026-09-11", "保守", "1", "15000", "10%"],
  ["0038", "2026-09-11", "Webサイト修正（返金）", "1", "-12000", "10%"],
  ["0039", "2026-09-12", "データ加工", "2", "24000", "10%"],
  ["0040", "2026-09-12", "新規制作", "1", "80000", "10%"],
];

/** Week 3: one unknown column, one unapproved tax category. Nothing else. */
const WEEK3_HEADERS = [...WEEK1_HEADERS, "販売チャネル"];

const WEEK3_ROWS: string[][] = [
  ["0051", "2026-09-15", "Webサイト修正", "1", "50000", "10%", "直販"],
  ["0052", "2026-09-15", "データ加工", "2", "24000", "10%", "紹介"],
  // The new tax category. One row is enough to require a decision.
  ["0053", "2026-09-16", "書籍販売", "5", "6000", "軽減8%", "直販"],
  ["0054", "2026-09-16", "初回相談", "1", "0", "10%", "直販"],
  ["0055", "2026/09/17", "フォーム制作", "1", "12000", "10%", "紹介"],
  ["0056", "2026-09-17", "保守", "1", "15000", "10%", "直販"],
  ["0057", "2026-09-18", "新規制作", "1", "90000", "10%", "紹介"],
  ["0058", "2026-09-18", "時間課金", "1", "7500.75", "10%", "直販"],
];

const reorder = (headers: string[], order: string[], rows: string[][]) => {
  const at = order.map((h) => headers.indexOf(h));
  return rows.map((row) => at.map((i) => row[i]));
};

export const sampleWeeks: SampleWeek[] = [
  {
    id: "week1",
    label: "1週目（最初の設定）",
    note: "列の対応をここで決めます。先頭ゼロのID、返金のマイナス、0円、円では表せない小数、セル内改行、重複、読み取れない行が含まれています。",
    csv: toCsv(WEEK1_HEADERS, WEEK1_ROWS),
  },
  {
    id: "week2",
    label: "2週目（列の順番だけ違う）",
    note: "中身の意味は1週目と同じで、列の順番だけが違います。保存したルールで、質問なしに処理できます。",
    csv: toCsv(WEEK2_ORDER, reorder(WEEK1_HEADERS, WEEK2_ORDER, WEEK2_SOURCE)),
  },
  {
    id: "week3",
    label: "3週目（知らない列と税区分）",
    note: "「販売チャネル」列と、承認していない税区分「軽減8%」が増えています。この2点だけ確認を求めます。",
    csv: toCsv(WEEK3_HEADERS, WEEK3_ROWS),
  },
];

export const sampleById = (id: string) => sampleWeeks.find((w) => w.id === id);

/**
 * A file large enough to prove the screens do not try to draw all of it.
 *
 * Generated rather than stored: ten thousand rows of literal text in the
 * bundle would be paid for by every visitor who never presses the button.
 */
export function largeSample(rows = 5000): string {
  const products = [
    "Webサイト修正",
    "データ加工",
    "フォーム制作",
    "新規制作",
    "保守",
  ];
  const body: string[][] = [];
  for (let i = 0; i < rows; i++) {
    const n = i + 1;
    body.push([
      String(n).padStart(6, "0"),
      `2026-09-${String((i % 28) + 1).padStart(2, "0")}`,
      products[i % products.length],
      String((i % 4) + 1),
      // A predictable spread, with a refund and a zero every so often.
      i % 97 === 0
        ? "-8000"
        : i % 53 === 0
          ? "0"
          : String(3000 + (i % 40) * 500),
      "10%",
    ]);
  }
  return toCsv(WEEK1_HEADERS, body);
}
