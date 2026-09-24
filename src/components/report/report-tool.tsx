"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useReport, type ReportStep } from "./report-provider";
import { ReviewStep } from "./review-step";
import { sampleWeeks, largeSample } from "@/lib/report/samples";
import { roleLabel, type ColumnRole } from "@/lib/runtime/report/recipe";

/**
 * REPORT FLOW (指示書 §15).
 *
 * Four steps on one screen, because the file is the expensive thing: losing it
 * to a navigation would undo the only work a person did by hand. The step is
 * part of the saved draft, so closing the tab and coming back resumes rather
 * than restarts.
 *
 * The order of the steps is the argument: you explain the file once, and from
 * then on the tool explains it to you.
 */

const STEPS: Array<{ id: ReportStep; label: string; hint: string }> = [
  { id: "import", label: "取込", hint: "ファイルを選ぶ" },
  { id: "map", label: "ルール", hint: "列の意味を決める" },
  { id: "review", label: "確認", hint: "差分と例外を見る" },
  { id: "output", label: "出力", hint: "書き出して記録する" },
];

const ROLE_OPTIONS: ColumnRole[] = [
  "orderId",
  "date",
  "productName",
  "quantity",
  "amount",
  "taxCategory",
  "currency",
  "ignore",
];

export function ReportTool() {
  const report = useReport();
  const { ready, draft, loaded, notice } = report;

  const step: ReportStep = draft?.step ?? "import";

  // The saved rules can only be read on the client, so the first paint is
  // always "not ready". Returning a bare sentence there and the whole tool a
  // moment later cost 0.075 of layout shift — the performance budget caught
  // it. The frame is the same in both states; only the panel changes.
  if (!ready)
    return (
      <div className="report-tool">
        <StepBar
          current="import"
          hasFile={false}
          canReview={false}
          onGo={() => {}}
        />
        <section className="report-panel report-panel-placeholder">
          <p className="report-loading" role="status">
            保存したルールを読み込んでいます…
          </p>
        </section>
      </div>
    );

  return (
    <div className="report-tool">
      <StepBar
        current={step}
        hasFile={loaded.kind === "ok"}
        canReview={!!report.review}
        onGo={report.setStep}
      />

      {notice && (
        <p className="report-notice" role="status">
          {notice}
        </p>
      )}

      {step === "import" || loaded.kind === "none" ? (
        <ImportStep />
      ) : loaded.kind === "error" ? (
        <FileError message={loaded.message} label={loaded.fileLabel} />
      ) : step === "map" || report.pending.length > 0 ? (
        <MapStep />
      ) : step === "output" ? (
        <OutputStep />
      ) : (
        <ReviewStep />
      )}
    </div>
  );
}

function StepBar({
  current,
  hasFile,
  canReview,
  onGo,
}: {
  current: ReportStep;
  hasFile: boolean;
  canReview: boolean;
  onGo: (step: ReportStep) => void;
}) {
  const reachable = (id: ReportStep) =>
    id === "import" ||
    (hasFile &&
      (id === "map" || ((id === "review" || id === "output") && canReview)));

  return (
    <ol className="report-steps" aria-label="処理の手順">
      {STEPS.map((s, i) => {
        const state =
          s.id === current
            ? "current"
            : STEPS.findIndex((x) => x.id === current) > i
              ? "done"
              : "todo";
        return (
          <li key={s.id} data-state={state}>
            <button
              type="button"
              onClick={() => onGo(s.id)}
              disabled={!reachable(s.id) || s.id === current}
              aria-current={s.id === current ? "step" : undefined}
            >
              <span className="report-step-no">{i + 1}</span>
              <span className="report-step-label">{s.label}</span>
              <span className="report-step-hint">{s.hint}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function FileError({ message, label }: { message: string; label: string }) {
  const { clearFile } = useReport();
  return (
    <section className="report-panel report-error" aria-labelledby="fe">
      <h2 id="fe">「{label}」は読み込めませんでした</h2>
      <p className="report-error-reason">{message}</p>
      <ul className="report-hints">
        <li>1行目が列名で、空の列名や同じ名前の列がないか</li>
        <li>すべての行の列数が同じか（途中に説明行が入っていないか）</li>
        <li>
          引用符 <code>&quot;</code> が閉じているか
        </li>
        <li>10,000行・50列を超えていないか</li>
      </ul>
      <button type="button" className="report-button" onClick={clearFile}>
        別のファイルを選ぶ
      </button>
    </section>
  );
}

// ---------------------------------------------------------------- import ----

function ImportStep() {
  const { openFile, state } = useReport();
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  return (
    <section className="report-panel" aria-labelledby="import-h">
      <h2 id="import-h">CSVを読み込む</h2>
      <p className="report-lead">
        {
          "ファイルはこのブラウザの中だけで処理されます。サーバーには送信されません。自動での取り込み（メール添付・共有フォルダの監視）は接続していないため、ここではファイルを選んで始めます。"
        }
      </p>

      <div className="report-sources">
        <div className="report-source">
          <h3>手元のCSVを使う</h3>
          <p>1行目が列名のCSV。10,000行・50列まで。</p>
          <button
            type="button"
            className="report-button primary"
            onClick={() => fileRef.current?.click()}
          >
            ファイルを選ぶ
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            aria-label="CSVファイルを選ぶ"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              setError("");
              try {
                openFile(await file.text(), file.name, true);
              } catch {
                setError("ファイルを読み込めませんでした。");
              }
            }}
          />
          {error && (
            <p className="report-error-reason" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="report-source">
          <h3>サンプルで試す（3週分）</h3>
          <p>
            {
              "1週目で設定し、2週目は列の順番が違うだけなので質問なしで処理され、3週目だけ新しい列と税区分を確認します。"
            }
          </p>
          <ul className="report-samples">
            {sampleWeeks.map((week) => (
              <li key={week.id}>
                <button
                  type="button"
                  className="report-button"
                  onClick={() => openFile(week.csv, week.label, false)}
                >
                  {week.label}
                </button>
                <span>{week.note}</span>
              </li>
            ))}
            <li>
              <button
                type="button"
                className="report-button"
                onClick={() =>
                  openFile(largeSample(5000), "5,000行のサンプル", false)
                }
              >
                5,000行で試す
              </button>
              <span>
                大きなファイルでも、表を全部描かずに集計と例外だけを出します。
              </span>
            </li>
          </ul>
        </div>
      </div>

      {state.recipes.length > 0 && (
        <p className="report-saved-note">
          保存済みのルールが {state.recipes.length} 件あります。列名が一致する
          ファイルを読み込むと自動で当たります（
          <Link href="/report/recipes">ルールを見る</Link>）。
        </p>
      )}
    </section>
  );
}

// ------------------------------------------------------------------- map ----

function MapStep() {
  const {
    loaded,
    draft,
    recipe,
    pending,
    setRole,
    setCurrency,
    setDedupe,
    saveRecipe,
    acceptChanges,
    state,
    applyRecipe,
  } = useReport();
  const [label, setLabel] = useState(draft?.fileLabel ?? "週次売上");
  const [error, setError] = useState("");

  if (loaded.kind !== "ok" || !draft) return null;
  const roles = draft.columnRoles as Record<string, ColumnRole>;

  return (
    <section className="report-panel" aria-labelledby="map-h">
      {pending.length > 0 ? (
        <>
          <h2 id="map-h">確認が必要な変更が {pending.length} 件あります</h2>
          <p className="report-lead">
            {
              "保存したルールは、列の順番が変わっただけなら何も聞きません。聞くのは、前になかったものが出てきたときだけです。"
            }
          </p>
          <ul className="report-changes">
            {pending.map((change) => (
              <li key={change.detail} data-kind={change.kind}>
                <b>{change.detail}</b>
                <span>{change.proposal}</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <h2 id="map-h">列の意味を決める</h2>
          <p className="report-lead">
            {
              "ここで決めた内容をルールとして保存すると、次回からは同じ説明をしなくて済みます。名前が一致する列は順番が変わっても自動で当たります。"
            }
          </p>
        </>
      )}

      {state.recipes.length > 0 && (
        <label className="report-field">
          <span>保存済みルールを使う</span>
          <select
            value={draft.recipeId ?? ""}
            onChange={(e) => applyRecipe(e.target.value || null)}
          >
            <option value="">使わない（この場で決める）</option>
            {state.recipes.map((r) => (
              <option key={r.recipeId} value={r.recipeId}>
                {r.label}（版 {r.version}）
              </option>
            ))}
          </select>
        </label>
      )}

      <table className="report-map">
        <caption className="sr-only">列と役割の対応</caption>
        <thead>
          <tr>
            <th scope="col">ファイルの列</th>
            <th scope="col">最初の行の値</th>
            <th scope="col">役割</th>
          </tr>
        </thead>
        <tbody>
          {loaded.data.headers.map((header, i) => (
            <tr
              key={header}
              data-new={recipe && !(header in recipe.columnRoles)}
            >
              <th scope="row">
                {header}
                {recipe && !(header in recipe.columnRoles) && (
                  <span className="report-tag">前回になかった列</span>
                )}
              </th>
              <td data-label="最初の行">
                <code>{loaded.data.rows[0]?.[i] || "（空欄）"}</code>
              </td>
              <td data-label="役割">
                <label>
                  <span className="sr-only">{header} の役割</span>
                  <select
                    value={roles[header] ?? "ignore"}
                    onChange={(e) =>
                      setRole(header, e.target.value as ColumnRole)
                    }
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {roleLabel(role)}
                      </option>
                    ))}
                  </select>
                </label>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="report-settings">
        <label className="report-field">
          <span>通貨</span>
          <select
            value={draft.currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {["JPY", "USD", "EUR", "GBP"].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="report-field">
          <span>重複とみなす条件</span>
          <select
            value={draft.dedupeBy}
            onChange={(e) => setDedupe(e.target.value as typeof draft.dedupeBy)}
          >
            <option value="none">除外しない</option>
            <option value="orderId">注文IDが同じ行</option>
            <option value="wholeRow">すべての列が同じ行</option>
          </select>
        </label>
      </div>

      {pending.length > 0 ? (
        <div className="report-actions">
          <button
            type="button"
            className="report-button primary"
            onClick={() => acceptChanges(roles)}
          >
            この内容でルールを更新する（版が上がります）
          </button>
          <p className="report-fineprint">
            {
              "前の版は残します。過去の集計が、そのとき使ったルールで説明できなくなるためです。"
            }
          </p>
        </div>
      ) : (
        <div className="report-actions">
          <label className="report-field">
            <span>ルールの名前</span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="例：週次売上"
            />
          </label>
          <button
            type="button"
            className="report-button primary"
            onClick={() => {
              const result = saveRecipe(label);
              setError(result.ok ? "" : (result.reason ?? ""));
            }}
          >
            ルールを保存して集計する
          </button>
          {error && (
            <p className="report-error-reason" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------- output ----

function OutputStep() {
  const { review, draft, state } = useReport();
  const latest = state.runs[0];
  if (!review || !draft) return null;

  return (
    <section className="report-panel" aria-labelledby="out-h">
      <h2 id="out-h">記録しました</h2>
      <p className="report-lead">
        {`「${draft.fileLabel}」の処理を履歴に残しました。次に同じ列のファイルを読み込むと、このルールが自動で当たり、前回比もここから計算されます。`}
      </p>
      {latest && (
        <dl className="report-facts">
          <div>
            <dt>処理ID</dt>
            <dd>
              <code>{latest.runId}</code>
            </dd>
          </div>
          <div>
            <dt>使ったルール</dt>
            <dd>
              版 {latest.recipeVersion}
              {latest.fixesApplied > 0 &&
                `／手入力の修正 ${latest.fixesApplied} 件`}
            </dd>
          </div>
          <div>
            <dt>集計対象</dt>
            <dd>{latest.result.totals.rowsCounted} 件</dd>
          </div>
        </dl>
      )}
      <div className="report-actions">
        <Link href="/report/history" className="report-button">
          履歴を見る
        </Link>
        <Link href="/report/recipes" className="report-button">
          ルールを見る
        </Link>
      </div>
    </section>
  );
}
