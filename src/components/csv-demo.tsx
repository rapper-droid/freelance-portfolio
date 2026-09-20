"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDownToLine,
  FileSpreadsheet,
  Upload,
  Search,
  ArrowDownUp,
  Play,
  RotateCcw,
  ArrowUpRight,
} from "lucide-react";
import { track } from "./analytics";
import {
  parseCsv,
  cleanCsv,
  exportCsv,
  sampleCsv,
  type CsvData,
} from "@/lib/csv";
export function CsvDemo() {
  const [data, setData] = useState<CsvData | null>(null);
  const [result, setResult] = useState<ReturnType<typeof cleanCsv> | null>(
    null,
  );
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState({ index: 0, asc: true });
  const [dedupe, setDedupe] = useState(true);
  const [trim, setTrim] = useState(true);
  const [nfkc, setNfkc] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [sumCol, setSumCol] = useState(-1);
  const [page, setPage] = useState(0);
  const [notice, setNotice] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  function load(text: string, name: string) {
    try {
      const d = parseCsv(text);
      setData(d);
      setResult(null);
      setQuery("");
      setPage(0);
      setSort({ index: 0, asc: true });
      setFileName(name);
      setSumCol(
        d.headers.findIndex((h) => /金額|売上|価格|amount|price/i.test(h)),
      );
      setError("");
      setNotice(`${d.rows.length}件を読み込みました。`);
      track("tool_started", { project: "csv" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "読み込めませんでした。");
    }
  }
  const current = result ?? data;
  const rows =
    current?.rows
      .filter((r) =>
        r.some((c) => c.toLowerCase().includes(query.toLowerCase())),
      )
      .sort(
        (a, b) =>
          a[sort.index].localeCompare(b[sort.index], "ja", { numeric: true }) *
          (sort.asc ? 1 : -1),
      ) ?? [];
  const numericValues =
    sumCol < 0
      ? []
      : (current?.rows ?? [])
          .map((r) => r[sumCol].replace(/[,¥￥\s]/g, ""))
          .filter((s) => s !== "" && Number.isFinite(Number(s)))
          .map(Number);
  const total = numericValues.reduce((a, b) => a + b, 0);
  return (
    <div className="tool-panel">
      <div className="tool-title">
        <div>
          <FileSpreadsheet size={20} />
          <h2>データ加工ワークスペース</h2>
        </div>
        <span className="pill">LOCAL PROCESSING</span>
      </div>
      <div className="csv-upload">
        <div className="upload-icon">
          <Upload />
        </div>
        <div>
          <h3>CSVを読み込んで、作業をスタート</h3>
          <p>UTF-8形式 / 最大2MB・10,000行・50列</p>
        </div>
        <div className="upload-actions">
          <input
            ref={fileRef}
            className="sr-only"
            tabIndex={-1}
            type="file"
            accept=".csv,text/csv"
            aria-label="CSVファイル"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              if (f.size > 2 * 1024 * 1024) {
                setError("ファイルは2MB以内にしてください。");
                e.target.value = "";
                return;
              }
              try {
                const buffer = await f.arrayBuffer();
                load(
                  new TextDecoder("utf-8", { fatal: true }).decode(buffer),
                  f.name,
                );
              } catch {
                setError("UTF-8形式のCSVを選択してください。");
              } finally {
                if (fileRef.current) fileRef.current.value = "";
              }
            }}
          />
          <button
            className="button secondary"
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={15} /> CSVを選択
          </button>
          <button
            className="button primary"
            onClick={() => load(sampleCsv, "sample-orders.csv")}
          >
            サンプルを試す <ArrowDownUp size={15} />
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
      <p role="status" className="sr-only">
        {notice}
      </p>
      {data ? (
        <>
          <div className="processing-options">
            <div>
              <span className="step-number">01</span>
              <b>加工する内容</b>
            </div>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={dedupe}
                onChange={(e) => setDedupe(e.target.checked)}
              />
              重複行を除去
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={trim}
                onChange={(e) => setTrim(e.target.checked)}
              />
              前後・連続する空白を整える
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={nfkc}
                onChange={(e) => setNfkc(e.target.checked)}
              />
              全角の英数字・記号を半角にそろえる
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={empty}
                onChange={(e) => setEmpty(e.target.checked)}
              />
              空欄を含む行を除去
            </label>
            <button
              className="button primary"
              onClick={() => {
                const r = cleanCsv(data, dedupe, trim, empty, nfkc);
                setResult(r);
                setPage(0);
                setNotice(
                  `加工完了。${r.rows.length}件、重複${r.duplicates}件を除去しました。`,
                );
              }}
            >
              <Play size={14} /> 加工を実行
            </button>
          </div>
          <p className="small muted option-note">
            重複は全列の値が一致する行を対象に判定します。空白の整理ではセル内の改行も1つの空白にまとめます。全角→半角は商品コードなどの表記を変えることがあるため、必要なときだけ選んでください。元のデータは変更されず、リセットで戻せます。
          </p>
          <div className="stats-grid">
            <div className="stat">
              <span>処理前</span>
              <strong>
                {data.rows.length}
                <small> 件</small>
              </strong>
            </div>
            <div className="stat">
              <span>処理後</span>
              <strong className="green">
                {result ? result.rows.length : "—"}
                <small> 件</small>
              </strong>
            </div>
            <div className="stat">
              <span>重複 / 空欄行を除去</span>
              <strong>
                {result ? `${result.duplicates} / ${result.empty}` : "—"}
                <small> 件</small>
              </strong>
            </div>
            <div className="stat">
              <label className="stat-select">
                集計対象
                <select
                  aria-label="集計する列"
                  value={sumCol}
                  onChange={(e) => setSumCol(Number(e.target.value))}
                >
                  <option value={-1}>列を選択</option>
                  {data.headers.map((h, i) => (
                    <option key={h} value={i}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>
              <strong className="sum-value">
                {sumCol < 0 ? "—" : total.toLocaleString("ja-JP")}
              </strong>
              <small>
                全{current?.rows.length}件のうち数値{numericValues.length}
                件を集計
              </small>
            </div>
          </div>
          {result && (
            <p className="small muted option-note csv-changes" role="note">
              整形で変わったセル：{result.changed.toLocaleString("ja-JP")}件
              {result.examples.length > 0 && (
                <>
                  （例：
                  {result.examples
                    .map((x) => `${x.column}「${x.before}」→「${x.after}」`)
                    .join("、")}
                  ）
                </>
              )}
            </p>
          )}
          <div className="table-toolbar">
            <div>
              <h3>{result ? "加工後のプレビュー" : "読み込みデータ"}</h3>
              <span className="small muted">{fileName}</span>
            </div>
            <div className="toolbar-controls">
              <label className="search-input">
                <Search size={16} />
                <input
                  aria-label="CSV内を検索"
                  placeholder="データを検索"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(0);
                  }}
                />
              </label>
              <button
                className="button secondary"
                disabled={!result}
                onClick={() => {
                  if (!result) return;
                  const blob = new Blob([exportCsv(result)], {
                    type: "text/csv;charset=utf-8;",
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "processed-data.csv";
                  a.click();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                  setNotice("加工済みCSVをダウンロードしました。");
                  track("tool_completed", { project: "csv" });
                }}
              >
                <ArrowDownToLine size={16} /> CSV出力
              </button>
              <button
                className="icon-button"
                aria-label="加工結果をリセット"
                onClick={() => {
                  setResult(null);
                  setPage(0);
                  setNotice("元のデータに戻しました。");
                }}
              >
                <RotateCcw size={17} />
              </button>
            </div>
          </div>
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="CSVプレビュー"
          >
            <table>
              <thead>
                <tr>
                  {data.headers.map((h, i) => (
                    <th
                      key={h}
                      aria-sort={
                        sort.index === i
                          ? sort.asc
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <button
                        onClick={() =>
                          setSort({
                            index: i,
                            asc: sort.index === i ? !sort.asc : true,
                          })
                        }
                      >
                        {h}
                        <ArrowDownUp size={12} />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(page * 10, page * 10 + 10).map((r, i) => (
                  <tr key={i}>
                    {r.map((c, j) => (
                      <td key={j}>
                        {c || <span className="muted">（空欄）</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && (
              <div className="empty-state">該当するデータがありません。</div>
            )}
          </div>
          <div className="pagination">
            <span>
              {rows.length}件中 {rows.length ? page * 10 + 1 : 0}〜
              {Math.min(page * 10 + 10, rows.length)}件を表示
            </span>
            <div>
              <button
                className="button secondary"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                前へ
              </button>
              <button
                className="button secondary"
                disabled={(page + 1) * 10 >= rows.length}
                onClick={() => setPage((p) => p + 1)}
              >
                次へ
              </button>
            </div>
          </div>
          <p className="small muted option-note">
            CSV出力は検索・並び替えに関わらず加工後の全件を出力します。数式として解釈される値（=、+、-、@などで始まる値）には安全のため先頭にアポストロフィを付けます。-500のような数値はそのまま出力します。
          </p>
          {result && (
            <p className="csv-next">
              <Link href="/services/csv-routine">
                この処理を、毎回のCSVでそのまま使いたい方へ：CSV整形ルーチンの範囲と進め方
                <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            </p>
          )}
        </>
      ) : (
        <div className="empty-state large">
          <FileSpreadsheet size={36} />
          <h3>毎回の手作業を、この画面ひとつで。</h3>
          <p>「サンプルを試す」で125件の架空の注文データを読み込めます。</p>
          <div className="feature-tags">
            <span>1. 読み込み</span>
            <span>2. 加工を実行</span>
            <span>3. CSV出力</span>
          </div>
        </div>
      )}
    </div>
  );
}
