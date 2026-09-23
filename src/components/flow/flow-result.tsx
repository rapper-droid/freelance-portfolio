"use client";

import { displayValue, fieldLabel } from "@/lib/runtime/display";
import type { StageLabel } from "@/lib/runtime/present";
import type { Evidence, MissingField, Warning } from "@/lib/runtime/types";

/**
 * Renders one run as three panels: what arrived, what was done, what the
 * person still decides (指示書 §05).
 *
 * The panels only display what the server returned. Nothing here recomputes a
 * total, re-reads a date or decides whether something may be sent — those
 * answers come from the runtime, and a second implementation in the browser
 * would be a second set of answers.
 */

export type ActionView = {
  id: string;
  kind: string;
  summary: string;
  targetRef: string;
  requiresApproval: boolean;
  executable: boolean;
  reason: string;
};

export type FlowResponse = {
  workflow: "relay" | "daybook" | "report";
  scenario: string;
  stages?: StageLabel;
  status?: string;
  timeline?: Array<{ at: string; event: string; detail: string }>;
  evidence?: Evidence[];
  warnings?: Warning[];
  missing?: MissingField[];
  actions?: ActionView[];
  // relay
  reply?: {
    subject: string;
    body: string;
    asks: string[];
    reviewNotes: string[];
  };
  caseRecord?: {
    caseId: string;
    title: string;
    knownFields: Record<string, { value: string; atIso: string }>;
    openQuestions: string[];
  };
  identityCandidates?: Array<{ caseId: string; reason: string }>;
  answeredThisTime?: string[];
  // daybook
  requested?: {
    label: string;
    ok: boolean;
    conflictsWith: string[];
    warnings: Warning[];
  } | null;
  proposals?: Array<{ startIso: string; label: string; endLabel: string }>;
  calendar?: {
    label: string;
    hours: string;
    service: string;
    buffers: string;
    closedDates: string[];
  };
  releasedHolds?: string[];
  reschedule?: {
    ok: boolean;
    reason: string;
    from: string;
    to: string;
    remindersToStop: string[];
    warnings: Warning[];
  };
  // report
  fileLabel?: string;
  /** The limits the parser actually enforces, shown as implemented (C02). */
  limits?: string;
  downloads?: {
    processedCsv: string;
    changeLogCsv: string;
    processedName: string;
    changeLogName: string;
  };
  headers?: string[];
  rowCount?: number;
  needsConfirmation?: Array<{
    kind: string;
    detail: string;
    proposal: string;
  }> | null;
  recipe?: {
    label: string;
    version: number;
    dedupeBy: string;
    currency: string;
  };
  result?: {
    totals: {
      rowsRead: number;
      rowsCounted: number;
      rowsExcluded: number;
      duplicatesRemoved: number;
      total: Money | null;
      quantityTotal: number | null;
      averageOrder: Money | null;
      byProduct: Array<{ name: string; count: number; total: Money }>;
    };
    problems: Array<{ sourceRow: number; reason: string }>;
    changeLog: Array<{ kind: string; sourceRow: number; detail: string }>;
    provenance: { recipeId: string; recipeVersion: number; currency: string };
  } | null;
  comparison?: {
    basis: string;
    totalChange: { label: string };
    countChange: { previous: number; current: number; absolute: number };
    newProducts: string[];
    droppedProducts: string[];
    warnings: Warning[];
  } | null;
  summary?: {
    observed: string[];
    possibleFactors: string[];
    needed: string[];
  } | null;
};

type Money = { minorUnits: number; scale: number; currency: string };

const yen = (m: Money | null | undefined) => {
  if (!m) return "—";
  const divisor = 10 ** m.scale;
  const whole = Math.floor(Math.abs(m.minorUnits) / divisor).toLocaleString(
    "ja-JP",
  );
  const sign = m.minorUnits < 0 ? "-" : "";
  const prefix = m.currency === "JPY" ? "¥" : m.currency + " ";
  const fraction = m.scale
    ? "." + String(Math.abs(m.minorUnits) % divisor).padStart(m.scale, "0")
    : "";
  return `${sign}${prefix}${whole}${fraction}`;
};

/**
 * Saves a result the visitor can open in their own spreadsheet.
 *
 * The bytes come from the server, already passed through the exporter that
 * neutralises formula-leading cells, so what is saved is what was computed —
 * the browser does not re-serialise anything (指示書 C08, C09).
 */
function DownloadButton({
  text,
  name,
  label,
}: {
  text: string;
  name: string;
  label: string;
}) {
  const save = () => {
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <button type="button" className="flow-button secondary" onClick={save}>
      {label}
    </button>
  );
}

export function FlowResult({ result }: { result: FlowResponse }) {
  return (
    <section aria-label="処理の結果">
      {result.stages && <Stages stages={result.stages} />}
      <div className="flow-columns">
        <Received result={result} />
        <Progressed result={result} />
        <ToDecide result={result} />
      </div>
    </section>
  );
}

/** The four facts about this run, shown separately (指示書 §06). */
function Stages({ stages }: { stages: StageLabel }) {
  const items = [
    { key: "入力元", value: stages.input.label, tone: stages.input.value },
    {
      key: "処理",
      value: stages.processing.label,
      tone: stages.processing.value,
    },
    { key: "出力先", value: stages.output.label, tone: stages.output.value },
    {
      key: "外部操作",
      value: stages.external.label,
      tone: stages.external.value,
    },
  ];
  return (
    <ul className="flow-stages">
      {items.map((i) => (
        <li key={i.key} data-tone={i.tone}>
          <dl>
            <dt>{i.key}</dt>
            <dd>{i.value}</dd>
          </dl>
        </li>
      ))}
    </ul>
  );
}

function Received({ result }: { result: FlowResponse }) {
  return (
    <div className="flow-panel">
      <h2>受け取ったもの</h2>

      {result.evidence && result.evidence.length > 0 && (
        <>
          <h3>本文から読み取った箇所</h3>
          <ul className="flow-list">
            {result.evidence.map((e) => (
              <li key={e.id} className="flow-evidence">
                <q>{e.quote}</q>
                <small>
                  本文 {e.start}〜{e.end} 文字目
                </small>
              </li>
            ))}
          </ul>
        </>
      )}

      {result.calendar && (
        <>
          <h3>適用した業務ルール</h3>
          <ul className="flow-list">
            <li className="flow-evidence">
              <q>{result.calendar.label}</q>
              <small>
                営業時間 {result.calendar.hours} ／ 所要{" "}
                {result.calendar.service} ／ 準備 {result.calendar.buffers}
                {result.calendar.closedDates.length
                  ? ` ／ 休業日 ${result.calendar.closedDates.join("、")}`
                  : ""}
              </small>
            </li>
          </ul>
        </>
      )}

      {result.fileLabel && (
        <>
          <h3>届いたファイル</h3>
          <p>
            {result.fileLabel}
            <br />
            {result.rowCount} 行 ／ 列: {result.headers?.join("、")}
          </p>
          {result.limits && <p className="flow-limits">{result.limits}</p>}
          {result.recipe && (
            <p>
              適用したレシピ：{result.recipe.label} v{result.recipe.version}
              （重複条件 {result.recipe.dedupeBy} ／ 通貨{" "}
              {result.recipe.currency}）
            </p>
          )}
        </>
      )}

      {!result.evidence?.length && !result.calendar && !result.fileLabel && (
        <p className="flow-empty">
          このステップでは新しい入力を受け取っていません。
        </p>
      )}
    </div>
  );
}

function Progressed({ result }: { result: FlowResponse }) {
  return (
    <div className="flow-panel">
      <h2>進めた仕事</h2>

      {result.caseRecord && (
        <>
          <h3>案件記録：{result.caseRecord.title}</h3>
          <ul className="flow-list">
            {Object.entries(result.caseRecord.knownFields).map(([k, v]) => (
              <li key={k}>
                {fieldLabel(k)}：{displayValue(k, v.value)}
                {result.answeredThisTime?.includes(k) && (
                  <span className="flow-new">今回わかった</span>
                )}
              </li>
            ))}
          </ul>
          <p>
            案件ID {result.caseRecord.caseId}（同じ相談は同じ案件になります）
          </p>
        </>
      )}

      {result.reply && (
        <>
          <h3>返信案（送信していません）</h3>
          <p>件名：{result.reply.subject}</p>
          <pre className="flow-output">{result.reply.body}</pre>
        </>
      )}

      {result.proposals && result.proposals.length > 0 && (
        <>
          <h3>提示できる候補</h3>
          {result.requested && !result.requested.ok && (
            <p>
              ご希望の {result.requested.label} は
              {result.requested.conflictsWith.length
                ? "既存の予定と重なります。"
                : "条件に合いません。"}
              準備時間を含めて空いている時間を出しました。
            </p>
          )}
          <ul className="flow-list">
            {result.proposals.map((p) => (
              <li key={p.startIso} className="flow-evidence">
                <q>{p.label}</q>
                <small>終了 {p.endLabel}（準備・片付けを含めて確保）</small>
              </li>
            ))}
          </ul>
          {result.releasedHolds && result.releasedHolds.length > 0 && (
            <p>
              期限切れの仮保持 {result.releasedHolds.length} 件を解放しました。
            </p>
          )}
        </>
      )}

      {result.reschedule && (
        <>
          <h3>日程変更</h3>
          <p>
            {result.reschedule.from} → {result.reschedule.to}
            <br />
            {result.reschedule.reason}
          </p>
          {result.reschedule.remindersToStop.length > 0 && (
            <p>
              停止する旧リマインド：
              {result.reschedule.remindersToStop.join("、")}
              <span className="flow-new">変更に追従</span>
            </p>
          )}
        </>
      )}

      {result.result && (
        <>
          <h3>集計（通常プログラムで計算）</h3>
          <dl className="flow-figures">
            <div className="flow-figure">
              <dt>合計</dt>
              <dd>{yen(result.result.totals.total)}</dd>
            </div>
            <div className="flow-figure">
              <dt>集計件数</dt>
              <dd>{result.result.totals.rowsCounted}</dd>
            </div>
            <div className="flow-figure">
              <dt>1件平均</dt>
              <dd>{yen(result.result.totals.averageOrder)}</dd>
            </div>
          </dl>
          <div className="flow-scroll">
            <table className="flow-table">
              <caption className="sr-only">商品別の集計</caption>
              <thead>
                <tr>
                  <th scope="col">商品</th>
                  <th scope="col">件数</th>
                  <th scope="col">金額</th>
                </tr>
              </thead>
              <tbody>
                {result.result.totals.byProduct.map((p) => (
                  <tr key={p.name}>
                    <td>{p.name}</td>
                    <td>{p.count}</td>
                    <td>{yen(p.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {result.comparison && (
            <>
              <h3>前回との差</h3>
              <p>
                合計 {result.comparison.totalChange.label}
                <br />
                件数 {result.comparison.countChange.previous} →{" "}
                {result.comparison.countChange.current} 件
              </p>
              <p>比較条件：{result.comparison.basis}</p>
              {result.comparison.newProducts.length > 0 && (
                <p>
                  今回増えた商品：{result.comparison.newProducts.join("、")}
                  <span className="flow-new">前回になし</span>
                </p>
              )}
            </>
          )}
          {result.downloads && (
            <>
              <h3>取得できる成果物</h3>
              <div className="flow-downloads">
                <DownloadButton
                  text={result.downloads.processedCsv}
                  name={result.downloads.processedName}
                  label="加工済みCSVを保存"
                />
                <DownloadButton
                  text={result.downloads.changeLogCsv}
                  name={result.downloads.changeLogName}
                  label="変更ログ・問題行を保存"
                />
              </div>
            </>
          )}

          {result.result.changeLog.length > 0 && (
            <>
              <h3>変更ログ</h3>
              <ul className="flow-list">
                {result.result.changeLog.map((c) => (
                  <li key={`${c.kind}-${c.sourceRow}`}>
                    {c.sourceRow} 行目：{c.detail}
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      {result.summary && (
        <>
          <h3>確認できた変化</h3>
          <ul className="flow-list">
            {result.summary.observed.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </>
      )}

      {result.timeline && result.timeline.length > 0 && (
        <>
          <h3>この処理の記録</h3>
          <ul className="flow-timeline">
            {result.timeline.map((t) => (
              <li key={`${t.event}-${t.detail}`}>
                <b>{t.event}</b>
                <span>{t.detail}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function ToDecide({ result }: { result: FlowResponse }) {
  const warnings = [
    ...(result.warnings ?? []),
    ...(result.comparison?.warnings ?? []),
    ...(result.reschedule?.warnings ?? []),
  ];
  const nothing =
    !warnings.length &&
    !result.missing?.length &&
    !result.needsConfirmation?.length &&
    !result.actions?.length &&
    !result.identityCandidates?.length;

  return (
    <div className="flow-panel">
      <h2>あなたが確認すること</h2>

      {result.missing && result.missing.length > 0 && (
        <>
          <h3>足りない情報（返信で質問します）</h3>
          <ul className="flow-list">
            {result.missing.map((m) => (
              <li key={m.field}>
                {m.label}：{m.reason}
              </li>
            ))}
          </ul>
        </>
      )}

      {warnings.length > 0 && (
        <>
          <h3>判断が必要な点</h3>
          <ul className="flow-list">
            {warnings.map((w, i) => (
              <li
                key={`${w.code}-${i}`}
                className="flow-warning"
                data-severity={w.severity}
              >
                {w.message}
              </li>
            ))}
          </ul>
        </>
      )}

      {result.identityCandidates && result.identityCandidates.length > 0 && (
        <>
          <h3>結び付け候補（自動では統合しません）</h3>
          <ul className="flow-list">
            {result.identityCandidates.map((c) => (
              <li key={c.caseId} className="flow-warning">
                {c.caseId}：{c.reason}
              </li>
            ))}
          </ul>
        </>
      )}

      {result.needsConfirmation && result.needsConfirmation.length > 0 && (
        <>
          <h3>前回から変わった点だけ確認</h3>
          <ul className="flow-list">
            {result.needsConfirmation.map((c) => (
              <li key={c.detail} className="flow-warning">
                {c.detail}
                <br />
                {c.proposal}
              </li>
            ))}
          </ul>
        </>
      )}

      {result.reply?.reviewNotes && result.reply.reviewNotes.length > 0 && (
        <>
          <h3>返信案の確認点</h3>
          <ul className="flow-list">
            {result.reply.reviewNotes.map((n) => (
              <li key={n} className="flow-warning">
                {n}
              </li>
            ))}
          </ul>
        </>
      )}

      {result.result && result.result.problems.length > 0 && (
        <>
          <h3>読み取れなかった行</h3>
          <ul className="flow-list">
            {result.result.problems.map((p) => (
              <li key={p.sourceRow} className="flow-warning">
                {p.sourceRow} 行目：{p.reason}
              </li>
            ))}
          </ul>
        </>
      )}

      {result.summary && result.summary.needed.length > 0 && (
        <>
          <h3>追加で必要なデータ</h3>
          <ul className="flow-list">
            {result.summary.needed.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </>
      )}

      {result.summary && (
        <>
          <h3>考えられる要因</h3>
          <ul className="flow-list">
            {result.summary.possibleFactors.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </>
      )}

      {result.actions && result.actions.length > 0 && (
        <>
          <h3>この後に実行する操作</h3>
          <ul className="flow-list">
            {result.actions.map((a) => (
              <li
                key={a.id}
                className="flow-action"
                data-executable={a.executable}
              >
                <strong>{a.summary}</strong>
                <code>{a.targetRef}</code>
                <span className="flow-action-state">
                  {a.executable
                    ? a.requiresApproval
                      ? "承認後に実行"
                      : "承認なしで実行（内部記録）"
                    : "実行しません"}
                </span>
                <p>{a.reason}</p>
              </li>
            ))}
          </ul>
        </>
      )}

      {nothing && (
        <p className="flow-empty">このステップで確認が必要な点はありません。</p>
      )}
    </div>
  );
}
