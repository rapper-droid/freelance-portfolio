export type CsvData = { headers: string[]; rows: string[][] };
export function parseCsv(text: string): CsvData {
  const input = text.replace(/^\uFEFF/, "");
  const records: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false,
    closed = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (quoted) {
      if (c === '"') {
        if (input[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else cell += c;
    } else if (c === "," || c === "\n" || c === "\r") {
      row.push(cell);
      cell = "";
      closed = false;
      if (c !== ",") {
        records.push(row);
        row = [];
        if (c === "\r" && input[i + 1] === "\n") i++;
      }
    } else if (c === '"' && !cell && !closed) quoted = true;
    else {
      if (closed || c === '"')
        throw new Error("引用符の形式が正しくありません。");
      cell += c;
    }
  }
  if (quoted) throw new Error("閉じられていない引用符があります。");
  if (cell || row.length || closed) {
    row.push(cell);
    records.push(row);
  }
  const headers = records.shift()?.map((h) => h.trim()) ?? [];
  if (
    !headers.length ||
    headers.some((h) => !h) ||
    new Set(headers).size !== headers.length
  )
    throw new Error("1行目に重複のない列名を指定してください。");
  const rows = records.filter((r) => r.some((c) => c.trim()));
  if (rows.some((r) => r.length !== headers.length))
    throw new Error("列数が一致しない行があります。");
  if (rows.length > 10000 || headers.length > 50)
    throw new Error("10,000行・50列以内のCSVをご利用ください。");
  return { headers, rows };
}
export function cleanCsv(
  data: CsvData,
  dedupe: boolean,
  trim: boolean,
  removeEmpty: boolean,
) {
  const seen = new Set<string>();
  let duplicates = 0,
    empty = 0;
  const rows = data.rows
    .map((r) =>
      trim ? r.map((c) => c.normalize("NFKC").trim().replace(/\s+/g, " ")) : r,
    )
    .filter((r) => {
      if (removeEmpty && r.some((c) => !c.trim())) {
        empty++;
        return false;
      }
      const key = JSON.stringify(r);
      if (dedupe && seen.has(key)) {
        duplicates++;
        return false;
      }
      seen.add(key);
      return true;
    });
  return { ...data, rows, duplicates, empty };
}
export function exportCsv(data: CsvData) {
  return (
    "\uFEFF" +
    [data.headers, ...data.rows]
      .map((r) =>
        r
          .map(
            (c) =>
              '"' +
              (/^[\s]*[=+\-@]/.test(c) ? "'" + c : c).replace(/"/g, '""') +
              '"',
          )
          .join(","),
      )
      .join("\r\n")
  );
}
export const sampleCsv =
  "注文ID,顧客名,商品,金額,ステータス\n" +
  Array.from({ length: 125 }, (_, i) => {
    const n = i % 98;
    return `ORD-${String(n + 1).padStart(3, "0")}, サンプル顧客${(n % 12) + 1} ,${["Webサイト修正", "データ加工", "フォーム制作"][n % 3]},${[5000, 12000, 20000][n % 3]},${n % 4 ? "完了" : "対応中"}`;
  }).join("\n");
