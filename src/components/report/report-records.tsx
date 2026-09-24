"use client";

import Link from "next/link";
import { useState } from "react";
import { useReport } from "./report-provider";
import { roleLabel, type ColumnRole } from "@/lib/runtime/report/recipe";
import { formatMoney } from "@/lib/runtime/rules/money";
import { SandboxData } from "@/components/sandbox-data";
import {
  REPORT_STORAGE_KEY,
  REPORT_STORAGE_DISCLOSURE,
  RUN_HISTORY_LIMIT,
} from "@/lib/report/store";

/**
 * The two record screens (指示書 §15).
 *
 * A recipe is the decision somebody made so they would not have to make it
 * again; a run is the only surviving answer to "what did we say last week".
 * Both are worth their own address — a link to the rule you are arguing about
 * is more useful than a description of where to click to find it.
 */

const stamp = (iso: string) => iso.slice(0, 16).replace("T", " ");

export function RecipesPage() {
  const { ready, state, deleteRecipe, notice } = useReport();
  const [confirming, setConfirming] = useState<string | null>(null);

  if (!ready)
    return (
      <section className="report-panel report-panel-placeholder">
        <p className="report-loading" role="status">
          読み込んでいます…
        </p>
      </section>
    );

  return (
    <div className="report-records">
      {notice && (
        <p className="report-notice" role="status">
          {notice}
        </p>
      )}

      {state.recipes.length === 0 ? (
        <section className="report-panel">
          <h2>保存したルールはまだありません</h2>
          <p className="report-lead">
            {
              "CSVを読み込んで列の意味を決め、保存するとここに並びます。次回からは、同じ列名のファイルなら順番が変わっていても自動で当たります。"
            }
          </p>
          <Link href="/report" className="report-button primary">
            CSVを読み込む
          </Link>
        </section>
      ) : (
        <ul className="report-recipe-list">
          {state.recipes.map((recipe) => {
            const used = state.runs.filter(
              (r) => r.recipeId === recipe.recipeId,
            );
            const roles = Object.entries(recipe.columnRoles) as Array<
              [string, ColumnRole]
            >;
            return (
              <li key={recipe.recipeId} className="report-panel">
                <div className="report-panel-head">
                  <div>
                    <h2>{recipe.label}</h2>
                    <p className="report-provenance">
                      版 {recipe.version}｜通貨 {recipe.currency}｜更新{" "}
                      {stamp(recipe.updatedAt)}
                    </p>
                  </div>
                  <span className="report-tag">
                    {used.length > 0
                      ? `${used.length} 回使用`
                      : "まだ使っていません"}
                  </span>
                </div>

                <table className="report-map">
                  <caption className="sr-only">
                    {recipe.label} の列と役割
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">列</th>
                      <th scope="col">役割</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map(([column, role]) => (
                      <tr key={column}>
                        <th scope="row">{column}</th>
                        <td data-label="役割">{roleLabel(role)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <dl className="report-facts">
                  <div>
                    <dt>重複の条件</dt>
                    <dd>
                      {
                        {
                          none: "除外しない",
                          orderId: "注文IDが同じ行",
                          wholeRow: "すべての列が同じ行",
                        }[recipe.dedupeBy]
                      }
                    </dd>
                  </div>
                  <div>
                    <dt>承認済みの税区分</dt>
                    <dd>
                      {recipe.knownTaxCategories.length
                        ? recipe.knownTaxCategories.join("、")
                        : "なし"}
                    </dd>
                  </div>
                  <div>
                    <dt>集計に必須の列</dt>
                    <dd>
                      {recipe.requiredRoles.map(roleLabel).join("、") || "なし"}
                    </dd>
                  </div>
                </dl>

                {confirming === recipe.recipeId ? (
                  <div className="report-actions report-confirm">
                    <p>
                      {`「${recipe.label}」を削除すると、次回のファイルは列の意味からやり直しになります。過去の履歴は残ります。`}
                    </p>
                    <button
                      type="button"
                      className="report-button primary"
                      onClick={() => {
                        deleteRecipe(recipe.recipeId);
                        setConfirming(null);
                      }}
                    >
                      削除する
                    </button>
                    <button
                      type="button"
                      className="report-button"
                      onClick={() => setConfirming(null)}
                    >
                      やめる
                    </button>
                  </div>
                ) : (
                  <div className="report-actions">
                    <button
                      type="button"
                      className="report-button"
                      onClick={() => setConfirming(recipe.recipeId)}
                    >
                      このルールを削除する
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ReportSandboxPanel />
    </div>
  );
}

export function HistoryPage() {
  const { ready, state, notice } = useReport();

  if (!ready)
    return (
      <section className="report-panel report-panel-placeholder">
        <p className="report-loading" role="status">
          読み込んでいます…
        </p>
      </section>
    );

  return (
    <div className="report-records">
      {notice && (
        <p className="report-notice" role="status">
          {notice}
        </p>
      )}

      {state.runs.length === 0 ? (
        <section className="report-panel">
          <h2>処理の履歴はまだありません</h2>
          <p className="report-lead">
            {
              "集計したあとに「この結果を履歴に記録する」を押すと、ここに残ります。次回の前回比は、この記録から計算されます。"
            }
          </p>
          <Link href="/report" className="report-button primary">
            CSVを読み込む
          </Link>
        </section>
      ) : (
        <section className="report-panel">
          <div className="report-panel-head">
            <h2>処理の履歴（{state.runs.length}）</h2>
            <span className="report-tag">
              新しい順・最大 {RUN_HISTORY_LIMIT} 件
            </span>
          </div>
          <p className="report-lead">
            {
              "この端末の中の記録です。合計は、そのとき集計できた行だけの合計であり、読み込んだ行数と分けて記録しています。"
            }
          </p>
          <div
            className="report-table-scroll"
            tabIndex={0}
            role="region"
            aria-label="処理の履歴（横スクロールできます）"
          >
            <table className="report-rows">
              <caption className="sr-only">過去の処理</caption>
              <thead>
                <tr>
                  <th scope="col">日時</th>
                  <th scope="col">ファイル</th>
                  <th scope="col">ルール</th>
                  <th scope="col">合計</th>
                  <th scope="col">集計 / 読込</th>
                  <th scope="col">読み取れず</th>
                  <th scope="col">修正</th>
                </tr>
              </thead>
              <tbody>
                {state.runs.map((run) => (
                  <tr key={run.runId}>
                    <td data-label="日時">{stamp(run.atIso)}</td>
                    <th scope="row">
                      {run.fileLabel}
                      {run.userSupplied && (
                        <span className="report-tag">手元のファイル</span>
                      )}
                    </th>
                    <td data-label="ルール">版 {run.recipeVersion}</td>
                    <td data-label="合計" className="is-number">
                      {run.result.totals.total
                        ? formatMoney(run.result.totals.total)
                        : "—"}
                    </td>
                    <td data-label="集計 / 読込" className="is-number">
                      {run.result.totals.rowsCounted} /{" "}
                      {run.result.totals.rowsRead}
                    </td>
                    <td data-label="読み取れず" className="is-number">
                      {run.result.problemsTotal}
                    </td>
                    <td data-label="修正" className="is-number">
                      {run.fixesApplied}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="report-fineprint">
            {
              "明細は保存していません。件数・合計・例外の数と、どのルールの版で処理したかだけを残します。ブラウザの保存領域を、読み返さない行で埋めないためです。"
            }
          </p>
        </section>
      )}

      <ReportSandboxPanel />
    </div>
  );
}

function ReportSandboxPanel() {
  const { exportData, importData, reset } = useReport();
  return (
    <SandboxData
      name="tsudowa-report"
      storageKey={REPORT_STORAGE_KEY}
      label="ルールと履歴"
      theme="report"
      buttonClass="report-button"
      disclosure={REPORT_STORAGE_DISCLOSURE}
      onExport={exportData}
      onImport={importData}
      onReset={reset}
    >
      <p>
        {
          "書き出したファイルには、保存したルールと処理履歴が入ります。別の端末で読み込めば、列の対応を決め直さずに続きから使えます。"
        }
      </p>
    </SandboxData>
  );
}
