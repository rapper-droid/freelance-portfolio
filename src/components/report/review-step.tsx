"use client";

import { useMemo, useState } from "react";
import { useReport } from "./report-provider";
import { cellsOf, fixableColumns } from "@/lib/report/fixes";
import { formatMoney } from "@/lib/runtime/rules/money";
import { downloadText, stamp } from "@/lib/runtime/download";
import { exportCsv } from "@/lib/csv";
import type { ProblemRow } from "@/lib/runtime/report/compute";

/**
 * The screen that has to earn the tool's existence (指示書 §15).
 *
 * The six chores it is meant to remove, in the order somebody meets them:
 *
 *   読む      — the totals come before any table, and say what they exclude.
 *   確認する  — the comparison states what was compared before the number.
 *   探す      — the unreadable rows are first, with their source row numbers.
 *   直す      — and each one can be corrected here, without a spreadsheet.
 *   コピーする — one button for the CSV, one for the summary text.
 *   思い出す  — the recipe and its version are named on the screen.
 *
 * Five thousand rows are never all drawn. The table is a sample with a filter
 * and a page size, because a person reviewing a report reads the exceptions
 * and the totals, not row 3,214.
 */

const PAGE = 50;

const money = (value: Parameters<typeof formatMoney>[0] | null) =>
  value ? formatMoney(value) : "—";

export function ReviewStep() {
  const { review, draft, recipe, setStep, recordRun, previousRun } =
    useReport();
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);

  const rows = useMemo(() => {
    if (!review) return [];
    const q = query.trim().toLowerCase();
    if (!q) return review.result.rows;
    return review.result.rows.filter((row) =>
      [row.orderId, row.date, row.productName].some((v) =>
        v.toLowerCase().includes(q),
      ),
    );
  }, [review, query]);

  if (!review || !draft) return null;
  const { result, comparison, summary } = review;

  return (
    <div className="report-review">
      <section className="report-panel" aria-labelledby="totals-h">
        <div className="report-panel-head">
          <div>
            <h2 id="totals-h">集計</h2>
            <p className="report-provenance">
              {draft.fileLabel}
              {recipe && `｜ルール「${recipe.label}」版 ${recipe.version}`}
              {`｜通貨 ${result.provenance.currency}`}
              {draft.fixes.length > 0 &&
                `｜手入力の修正 ${draft.fixes.length} 件`}
            </p>
          </div>
          <button
            type="button"
            className="report-button primary"
            onClick={() => recordRun()}
          >
            この結果を履歴に記録する
          </button>
        </div>

        <dl className="report-totals">
          <div className="is-headline">
            <dt>合計</dt>
            <dd>{money(result.totals.total)}</dd>
          </div>
          <div>
            <dt>集計対象</dt>
            <dd>{result.totals.rowsCounted} 件</dd>
          </div>
          <div>
            <dt>読み込んだ行</dt>
            <dd>{result.totals.rowsRead} 件</dd>
          </div>
          <div>
            <dt>除外</dt>
            <dd>
              {result.totals.rowsExcluded} 件
              {result.totals.duplicatesRemoved > 0 &&
                `（うち重複 ${result.totals.duplicatesRemoved}）`}
            </dd>
          </div>
          <div>
            <dt>1件あたり</dt>
            <dd>{money(result.totals.averageOrder)}</dd>
          </div>
        </dl>

        {/* The count is stated next to the total so nobody reads a total over
            eight rows as a total over twelve. */}
        <p className="report-fineprint">
          {`合計は、読み取れた ${result.totals.rowsCounted} 件だけの合計です（読み込み ${result.totals.rowsRead} 件）。`}
        </p>
      </section>

      {comparison && (
        <section className="report-panel" aria-labelledby="diff-h">
          <h2 id="diff-h">前回との差</h2>
          <p className="report-basis">{comparison.basis}</p>
          <dl className="report-totals">
            <div className="is-headline">
              <dt>合計の変化</dt>
              <dd>{comparison.totalChange.label}</dd>
            </div>
            <div>
              <dt>前回</dt>
              <dd>{money(comparison.totalChange.previous)}</dd>
            </div>
            <div>
              <dt>今回</dt>
              <dd>{money(comparison.totalChange.current)}</dd>
            </div>
            <div>
              <dt>件数</dt>
              <dd>
                {comparison.countChange.previous} →{" "}
                {comparison.countChange.current}
                {` 件（${comparison.countChange.absolute >= 0 ? "+" : ""}${comparison.countChange.absolute}）`}
              </dd>
            </div>
          </dl>
          {(comparison.newProducts.length > 0 ||
            comparison.droppedProducts.length > 0) && (
            <ul className="report-hints">
              {comparison.newProducts.length > 0 && (
                <li>前回になかった商品: {comparison.newProducts.join("、")}</li>
              )}
              {comparison.droppedProducts.length > 0 && (
                <li>
                  今回なくなった商品: {comparison.droppedProducts.join("、")}
                </li>
              )}
            </ul>
          )}
          {comparison.warnings.map((w) => (
            <p key={w.code} className="report-error-reason">
              {w.message}
            </p>
          ))}
        </section>
      )}

      {!comparison && previousRun === null && (
        <p className="report-empty-note">
          {
            "前回の記録がないため、比較は表示していません。この結果を履歴に記録すると、次回から前回比が出ます。"
          }
        </p>
      )}

      <Problems />

      <section className="report-panel" aria-labelledby="read-h">
        <h2 id="read-h">読み取った内容</h2>
        <SummaryLists summary={summary} />
      </section>

      <ChangeLog />

      <section className="report-panel" aria-labelledby="rows-h">
        <div className="report-panel-head">
          <h2 id="rows-h">明細</h2>
          <label className="report-field report-search">
            <span>絞り込み</span>
            <input
              type="search"
              value={query}
              placeholder="注文ID・日付・商品"
              onChange={(e) => {
                setQuery(e.target.value);
                setShown(PAGE);
              }}
            />
          </label>
        </div>

        {rows.length === 0 ? (
          <p className="report-empty-note">
            {query
              ? `「${query}」に一致する行はありませんでした。`
              : "集計できた行がありません。上の「読み取れなかった行」を確認してください。"}
          </p>
        ) : (
          <>
            <div
              className="report-table-scroll"
              tabIndex={0}
              role="region"
              aria-label="明細（横スクロールできます）"
            >
              <table className="report-rows">
                <caption className="sr-only">集計対象の明細</caption>
                <thead>
                  <tr>
                    <th scope="col">行</th>
                    <th scope="col">注文ID</th>
                    <th scope="col">日付</th>
                    <th scope="col">商品</th>
                    <th scope="col">数量</th>
                    <th scope="col">金額</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, shown).map((row) => (
                    <tr
                      key={row.sourceRow}
                      data-counted={row.issues.length === 0}
                    >
                      <td data-label="行">{row.sourceRow}</td>
                      <th scope="row">
                        {row.orderId || "—"}
                        {row.issues.length > 0 && (
                          <span className="report-tag">集計対象外</span>
                        )}
                      </th>
                      <td data-label="日付">{row.date || "—"}</td>
                      <td data-label="商品">{row.productName || "—"}</td>
                      <td data-label="数量">{row.quantity ?? "—"}</td>
                      <td data-label="金額" className="is-number">
                        {row.issues.length > 0 ? (
                          <span className="report-row-issue">
                            {row.issues[0]}
                          </span>
                        ) : (
                          money(row.amount)
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="report-fineprint">
              {`${Math.min(shown, rows.length)} / ${rows.length} 行を表示しています。` +
                `うち ${rows.filter((r) => r.issues.length > 0).length} 行は集計対象外です` +
                `（重複として除外した行は表示していません）。`}
            </p>
            {shown < rows.length && (
              <button
                type="button"
                className="report-button"
                onClick={() => setShown((n) => n + PAGE)}
              >
                次の {Math.min(PAGE, rows.length - shown)} 件を表示
              </button>
            )}
          </>
        )}
      </section>

      <Output />

      <div className="report-actions">
        <button
          type="button"
          className="report-button"
          onClick={() => setStep("map")}
        >
          列の対応を見直す
        </button>
      </div>
    </div>
  );
}

function SummaryLists({
  summary,
}: {
  summary: NonNullable<ReturnType<typeof useReport>["review"]>["summary"];
}) {
  const blocks: Array<[string, string[], string]> = [
    [
      "わかったこと",
      summary.observed,
      "このファイルから直接読み取れる事実です。",
    ],
    [
      "考えられること",
      summary.possibleFactors,
      "可能性であり、原因の断定ではありません。",
    ],
    [
      "足りないもの",
      summary.needed,
      "これが揃うと、数字の意味が確かになります。",
    ],
  ];
  return (
    <div className="report-summary">
      {blocks.map(([title, items, note]) => (
        <div key={title}>
          <h3>{title}</h3>
          {items.length === 0 ? (
            <p className="report-empty-note">該当なし</p>
          ) : (
            <ul>
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
          <p className="report-fineprint">{note}</p>
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------- problems ----

function Problems() {
  const { review, draft, mapping, dropFix } = useReport();
  const [editing, setEditing] = useState<number | null>(null);
  if (!review || !draft) return null;

  const { problems } = review.result;
  const fixed = draft.fixes;

  if (problems.length === 0 && fixed.length === 0)
    return (
      <section className="report-panel is-clear" aria-labelledby="prob-h">
        <h2 id="prob-h">読み取れなかった行</h2>
        <p className="report-empty-note">
          ありません。すべての行を集計に入れています。
        </p>
      </section>
    );

  return (
    <section className="report-panel" aria-labelledby="prob-h">
      <h2 id="prob-h">読み取れなかった行（{problems.length}）</h2>
      <p className="report-lead">
        {
          "除外したまま合計しています。ここで直すと、その場で集計に入ります。元のファイルは変更しません。"
        }
      </p>

      {review.orphanedFixes.length > 0 && (
        <p className="report-error-reason">
          {`前のファイル向けの修正が ${review.orphanedFixes.length} 件あり、この行は見つかりませんでした。`}
        </p>
      )}

      <ul className="report-problems">
        {problems.map((problem) => (
          <li key={problem.sourceRow}>
            <div className="report-problem-head">
              <b>{problem.sourceRow} 行目</b>
              <span>{problem.reason}</span>
              <button
                type="button"
                className="report-button"
                onClick={() =>
                  setEditing(
                    editing === problem.sourceRow ? null : problem.sourceRow,
                  )
                }
                aria-expanded={editing === problem.sourceRow}
              >
                {editing === problem.sourceRow ? "閉じる" : "この行を直す"}
              </button>
            </div>
            {editing === problem.sourceRow && (
              <FixEditor
                problem={problem}
                headers={review.data.headers}
                mapped={mapping ? Object.values(mapping) : []}
                onDone={() => setEditing(null)}
              />
            )}
          </li>
        ))}
      </ul>

      {fixed.length > 0 && (
        <div className="report-fixed">
          <h3>直した行（{fixed.length}）</h3>
          <ul>
            {fixed.map((fix) => (
              <li key={fix.sourceRow}>
                <b>{fix.sourceRow} 行目</b>
                <span>
                  {Object.entries(fix.cells)
                    .map(([c, v]) => `${c}=${v || "（空欄）"}`)
                    .join("、")}
                  {fix.note && `｜${fix.note}`}
                </span>
                <button
                  type="button"
                  className="report-button"
                  onClick={() => dropFix(fix.sourceRow)}
                >
                  取り消す
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function FixEditor({
  problem,
  headers,
  mapped,
  onDone,
}: {
  problem: ProblemRow;
  headers: string[];
  mapped: Array<string | null>;
  onDone: () => void;
}) {
  const { addFix, draft } = useReport();
  const existing = draft?.fixes.find((f) => f.sourceRow === problem.sourceRow);
  const [cells, setCells] = useState<Record<string, string>>(() => ({
    ...cellsOf(problem, headers),
    ...(existing?.cells ?? {}),
  }));
  const [note, setNote] = useState(existing?.note ?? "");
  const { primary, rest } = fixableColumns(headers, mapped);

  const field = (column: string) => (
    <label key={column} className="report-field">
      <span>{column}</span>
      <input
        value={cells[column] ?? ""}
        onChange={(e) => setCells((c) => ({ ...c, [column]: e.target.value }))}
      />
    </label>
  );

  return (
    <div className="report-fix-editor">
      <p className="report-fineprint">
        元の値: <code>{problem.raw.join(" / ") || "（空）"}</code>
      </p>
      <div className="report-fix-fields">{primary.map(field)}</div>
      {rest.length > 0 && (
        <details>
          <summary>集計に使っていない列も直す（{rest.length}）</summary>
          <div className="report-fix-fields">{rest.map(field)}</div>
        </details>
      )}
      <label className="report-field">
        <span>修正の理由（記録に残ります）</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="例：請求書から確認"
        />
      </label>
      <div className="report-actions">
        <button
          type="button"
          className="report-button primary"
          onClick={() => {
            // Only the cells that differ. The editor pre-fills every column so
            // a person can see the row, but recording all of them would make
            // "直した行" list six values when one was edited.
            const original = cellsOf(problem, headers);
            const changed = Object.fromEntries(
              Object.entries(cells).filter(
                ([column, value]) => (original[column] ?? "") !== value,
              ),
            );
            addFix({
              sourceRow: problem.sourceRow,
              cells: changed,
              note: note.trim(),
              atIso: new Date().toISOString(),
            });
            onDone();
          }}
        >
          直して再計算する
        </button>
        <button type="button" className="report-button" onClick={onDone}>
          やめる
        </button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------ change log ----

function ChangeLog() {
  const { review } = useReport();
  const [open, setOpen] = useState(false);
  if (!review) return null;
  const entries = [...review.fixChangeLog, ...review.result.changeLog];
  if (entries.length === 0) return null;

  return (
    <section className="report-panel" aria-labelledby="log-h">
      <div className="report-panel-head">
        <h2 id="log-h">変更の記録（{entries.length}）</h2>
        <button
          type="button"
          className="report-button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {open ? "たたむ" : "ひらく"}
        </button>
      </div>
      <p className="report-lead">
        {
          "元データに対して、どの行に何をしたかです。合計はこの結果に対するものです。"
        }
      </p>
      {open && (
        <ul className="report-log">
          {entries.map((entry, i) => (
            <li key={`${entry.sourceRow}-${i}`} data-kind={entry.kind}>
              <b>{entry.sourceRow} 行目</b>
              <span>{entry.detail}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ---------------------------------------------------------------- output ----

function Output() {
  const { review, draft, recipe } = useReport();
  const [copied, setCopied] = useState("");
  if (!review || !draft) return null;

  const summaryText = [
    `${draft.fileLabel}`,
    recipe
      ? `ルール: ${recipe.label}（版 ${recipe.version}）`
      : "ルール: 未保存",
    `合計: ${money(review.result.totals.total)}（集計対象 ${review.result.totals.rowsCounted} 件／読み込み ${review.result.totals.rowsRead} 件）`,
    review.comparison ? `前回比: ${review.comparison.totalChange.label}` : null,
    review.comparison ? `比較の前提: ${review.comparison.basis}` : null,
    ...review.summary.observed.map((s) => `・${s}`),
    review.result.problems.length
      ? `読み取れなかった行: ${review.result.problems.length} 件（除外して集計）`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <section className="report-panel" aria-labelledby="output-h">
      <h2 id="output-h">書き出す</h2>
      <p className="report-lead">
        {
          "数式として解釈されうるセルには先頭に ' を付けて書き出します。XLSXとPDFは、実際に開いて中身を確認できる形で出せないため用意していません。"
        }
      </p>
      <div className="report-actions">
        <button
          type="button"
          className="report-button primary"
          onClick={() =>
            downloadText(
              exportCsv({
                headers: ["行", "注文ID", "日付", "商品", "数量", "金額"],
                rows: review.result.rows.map((r) => [
                  String(r.sourceRow),
                  r.orderId,
                  r.date,
                  r.productName,
                  r.quantity === null ? "" : String(r.quantity),
                  r.amount === null ? "" : String(r.amount.minorUnits),
                ]),
              }),
              `report-${stamp(new Date().toISOString())}.csv`,
              "text/csv;charset=utf-8;",
            )
          }
        >
          集計結果をCSVで書き出す
        </button>

        {review.result.problems.length > 0 && (
          <button
            type="button"
            className="report-button"
            onClick={() =>
              downloadText(
                exportCsv({
                  headers: ["行", "理由", ...review.data.headers],
                  rows: review.result.problems.map((p) => [
                    String(p.sourceRow),
                    p.reason,
                    ...review.data.headers.map((_, i) => p.raw[i] ?? ""),
                  ]),
                }),
                `report-problems-${stamp(new Date().toISOString())}.csv`,
                "text/csv;charset=utf-8;",
              )
            }
          >
            読み取れなかった行だけ書き出す
          </button>
        )}

        <button
          type="button"
          className="report-button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(summaryText);
              setCopied("要約をコピーしました。そのまま報告文に貼れます。");
            } catch {
              setCopied(
                "コピーできませんでした。下の文面を選択してコピーしてください。",
              );
            }
          }}
        >
          要約をコピー
        </button>
      </div>
      {copied && (
        <p className="report-fineprint" role="status">
          {copied}
        </p>
      )}
      <details className="report-summary-text">
        <summary>コピーされる文面を見る</summary>
        <pre>{summaryText}</pre>
      </details>
    </section>
  );
}
