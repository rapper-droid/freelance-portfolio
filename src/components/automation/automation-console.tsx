"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { SCENARIOS } from "@/lib/runtime/scenarios";
import { authoriseAction, recordApproval } from "@/lib/runtime/approval";
import type { AuthorisationContext } from "@/lib/runtime/approval";
import type {
  ActionPlan,
  Approval,
  EffectRecord,
  Evidence,
} from "@/lib/runtime/types";
import { isIrreversible } from "@/lib/runtime/types";
import {
  attemptRun,
  choiceLabel,
  outcomeLabel,
  type OutcomeChoice,
  type RunAttempt,
} from "@/lib/automation/simulator";
import { downloadText, stamp } from "@/lib/runtime/download";
import { SchemaPanel } from "./schema-panel";
import "./automation.css";

/**
 * The technical entry to RELAY (指示書 §17 Automation／API).
 *
 * The spec's instruction is mostly about what this must not be: *nodeを線で
 * つなぐだけのフローチャートで終わらせない*. Lines between boxes do not answer
 * the questions an engineer actually has — which of these effects cannot be
 * taken back, what is an approval bound to, what happens if I press it twice,
 * and what does the system do when the answer never comes back. So the screen
 * is built around those four, in that order, on the same run the business
 * demo uses.
 *
 * Everything below the input is derived from one call to `/api/flow`. There is
 * no second planner and no separate truth.
 */

const RELAY_SCENARIOS = SCENARIOS.filter((s) => s.workflow === "relay");

/** Sample mode, nothing connected, no kill switch. Shown, not hidden. */
const CONTEXT: AuthorisationContext = {
  mode: "sample",
  connectedTargets: [],
  killSwitch: false,
};

type Technical = {
  plan: ActionPlan;
  payloads: Record<string, unknown>;
  run: { runId: string; mode: string; status: string; inputSource: string };
  sourceText: string;
  extraction: {
    extractorVersion: string;
    processing: string;
    fields: Record<string, { value: unknown; evidenceIds: string[] }>;
  };
};

type Loaded =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; data: Technical };

export function AutomationConsole() {
  const [scenario, setScenario] = useState(RELAY_SCENARIOS[0].id);
  const [loaded, setLoaded] = useState<Loaded>({ kind: "idle" });
  const [approval, setApproval] = useState<Approval | null>(null);
  const [approvalError, setApprovalError] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [choices, setChoices] = useState<Record<string, OutcomeChoice>>({});
  const [attempts, setAttempts] = useState<RunAttempt[]>([]);
  const [highlight, setHighlight] = useState<string[]>([]);

  const reset = useCallback(() => {
    setApproval(null);
    setApprovalError("");
    setSelected([]);
    setChoices({});
    setAttempts([]);
    setHighlight([]);
  }, []);

  const load = useCallback(
    async (id: string) => {
      reset();
      setLoaded({ kind: "loading" });
      try {
        const response = await fetch("/api/flow", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ scenario: id }),
        });
        const body = await response.json();
        if (!response.ok || !body?.technical) {
          setLoaded({
            kind: "error",
            message:
              body?.message ??
              "計画を取得できませんでした。時間をおいて試してください。",
          });
          return;
        }
        const data = body.technical as Technical;
        setLoaded({ kind: "ready", data });
        // Default to approving the reversible ones: the irreversible actions
        // are the decision, so they start unticked.
        setSelected(
          data.plan.actions
            .filter((a) => !isIrreversible(a.kind))
            .map((a) => a.id),
        );
      } catch {
        setLoaded({
          kind: "error",
          message: "通信に失敗しました。接続を確認してください。",
        });
      }
    },
    [reset],
  );

  const data = loaded.kind === "ready" ? loaded.data : null;

  const authorisations = useMemo(() => {
    if (!data) return [];
    return data.plan.actions.map((action) => ({
      action,
      auth: authoriseAction(action, CONTEXT),
    }));
  }, [data]);

  const priorEffects = useMemo(
    () => attempts.flatMap((a) => a.effects),
    [attempts],
  );

  const run = async () => {
    if (!data) return;
    const attempt = await attemptRun({
      plan: data.plan,
      approval,
      payloads: data.payloads,
      context: CONTEXT,
      choices,
      priorEffects: attempts.length ? priorEffects : undefined,
      nowIso: new Date().toISOString(),
    });
    setAttempts((list) => [...list, attempt]);
  };

  return (
    <div className="auto-console">
      <section className="auto-panel" aria-labelledby="in-h">
        <h2 id="in-h">1. 入力</h2>
        <p className="auto-lead">
          {
            "同梱のサンプル文だけを入力に使います。URLを渡して取得させる入口も、式やスクリプトを受け取る入口もありません。"
          }
        </p>
        <div className="auto-scenarios">
          {RELAY_SCENARIOS.map((s) => (
            <label key={s.id} className="auto-choice">
              <input
                type="radio"
                name="scenario"
                value={s.id}
                checked={scenario === s.id}
                onChange={() => {
                  setScenario(s.id);
                  setLoaded({ kind: "idle" });
                  reset();
                }}
              />
              <span>
                <b>{s.label}</b>
                <small>{s.note}</small>
              </span>
            </label>
          ))}
        </div>
        <div className="auto-actions">
          <button
            type="button"
            className="auto-button primary"
            onClick={() => load(scenario)}
            disabled={loaded.kind === "loading"}
          >
            {loaded.kind === "loading" ? "計画を作成中…" : "抽出して計画を作る"}
          </button>
        </div>
        {loaded.kind === "error" && (
          <p className="auto-error" role="alert">
            {loaded.message}
          </p>
        )}
      </section>

      <SchemaPanel />

      {data && (
        <>
          <MappingPanel
            data={data}
            highlight={highlight}
            onHighlight={setHighlight}
          />

          <section className="auto-panel" aria-labelledby="plan-h">
            <h2 id="plan-h">4. 実行計画</h2>
            <dl className="auto-facts">
              <div>
                <dt>runId</dt>
                <dd>
                  <code>{data.plan.runId}</code>
                </dd>
              </div>
              <div>
                <dt>計画の版</dt>
                <dd>v{data.plan.version}</dd>
              </div>
              <div>
                <dt>inputHash</dt>
                <dd>
                  <code>{data.plan.inputHash}</code>
                </dd>
              </div>
              <div>
                <dt>policyVersion</dt>
                <dd>
                  <code>{data.plan.policyVersion}</code>
                </dd>
              </div>
              <div>
                <dt>モード</dt>
                <dd>{data.plan.mode}</dd>
              </div>
            </dl>

            <div
              className="auto-table-scroll"
              tabIndex={0}
              role="region"
              aria-label="実行計画（横スクロールできます）"
            >
              <table className="auto-table">
                <caption className="sr-only">計画された操作</caption>
                <thead>
                  <tr>
                    <th scope="col">操作</th>
                    <th scope="col">対象</th>
                    <th scope="col">payloadHash</th>
                    <th scope="col">idempotencyKey</th>
                    <th scope="col">承認</th>
                  </tr>
                </thead>
                <tbody>
                  {authorisations.map(({ action, auth }) => (
                    <tr
                      key={action.id}
                      data-irreversible={isIrreversible(action.kind)}
                    >
                      <th scope="row">
                        <code>{action.kind}</code>
                        {isIrreversible(action.kind) && (
                          <span className="auto-tag">取り消せない</span>
                        )}
                        <small>{action.summary}</small>
                      </th>
                      <td data-label="対象">
                        <code>{action.targetRef}</code>
                      </td>
                      <td data-label="payloadHash">
                        <code>{action.payloadHash.slice(0, 16)}…</code>
                      </td>
                      <td data-label="idempotencyKey">
                        <code>{action.idempotencyKey.slice(0, 16)}…</code>
                      </td>
                      <td data-label="承認">
                        {/* The planner proposes; authoriseAction decides. Both
                            are shown, because the gap is the point. */}
                        <span>
                          計画の提案: {action.requiresApproval ? "要" : "不要"}
                        </span>
                        <span className="auto-effective">
                          実際: {auth.requiresApproval ? "要" : "不要"} ／{" "}
                          {auth.executable ? "実行可" : "実行不可"}
                        </span>
                        <small>{auth.reason}</small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.plan.missingFields.length > 0 && (
              <div className="auto-subpanel">
                <h3>
                  埋められなかった項目（{data.plan.missingFields.length}）
                </h3>
                <ul className="auto-list">
                  {data.plan.missingFields.map((m) => (
                    <li key={m.field}>
                      <b>{m.label}</b>
                      <span>{m.reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {data.plan.warnings.length > 0 && (
              <div className="auto-subpanel">
                <h3>警告（{data.plan.warnings.length}）</h3>
                <ul className="auto-list">
                  {data.plan.warnings.map((w) => (
                    <li key={w.code} data-severity={w.severity}>
                      <b>{w.severity === "blocking" ? "停止" : "注意"}</b>
                      <span>{w.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <ApprovalPanel
            plan={data.plan}
            selected={selected}
            setSelected={setSelected}
            approval={approval}
            setApproval={setApproval}
            error={approvalError}
            setError={setApprovalError}
          />

          <section className="auto-panel" aria-labelledby="exec-h">
            <h2 id="exec-h">6. 実行・失敗・再実行</h2>
            <p className="auto-lead">
              {
                "模擬アダプターに対して実行します。外へは出ません。失敗と「結果が分からない」は別の状態で、後者は再実行しても二重に実行されません。"
              }
            </p>

            <div
              className="auto-table-scroll"
              tabIndex={0}
              role="region"
              aria-label="実行結果"
            >
              <table className="auto-table">
                <caption className="sr-only">実行の設定と結果</caption>
                <thead>
                  <tr>
                    <th scope="col">操作</th>
                    <th scope="col">相手先の挙動</th>
                    {attempts.map((_, i) => (
                      <th scope="col" key={i}>
                        {i + 1} 回目
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.plan.actions.map((action) => (
                    <tr key={action.id}>
                      <th scope="row">
                        <code>{action.kind}</code>
                      </th>
                      <td data-label="相手先の挙動">
                        <label>
                          <span className="sr-only">
                            {action.kind} の相手先の挙動
                          </span>
                          <select
                            value={choices[action.id] ?? "succeed"}
                            onChange={(e) =>
                              setChoices((c) => ({
                                ...c,
                                [action.id]: e.target.value as OutcomeChoice,
                              }))
                            }
                          >
                            {(
                              ["succeed", "fail", "timeout"] as OutcomeChoice[]
                            ).map((c) => (
                              <option key={c} value={c}>
                                {choiceLabel[c]}
                              </option>
                            ))}
                          </select>
                        </label>
                      </td>
                      {attempts.map((attempt, i) => {
                        const effect = attempt.effects.find(
                          (e) => e.actionId === action.id,
                        );
                        return (
                          <td key={i} data-label={`${i + 1} 回目`}>
                            {effect ? (
                              <span
                                className="auto-outcome"
                                data-status={effect.status}
                              >
                                {outcomeLabel[effect.status]}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="auto-actions">
              <button
                type="button"
                className="auto-button primary"
                onClick={run}
              >
                {attempts.length === 0
                  ? "承認した操作を実行する"
                  : "同じ計画をもう一度実行する（再実行）"}
              </button>
              {attempts.length > 0 && (
                <button
                  type="button"
                  className="auto-button"
                  onClick={() => setAttempts([])}
                >
                  実行結果を消してやり直す
                </button>
              )}
            </div>

            {attempts.length > 1 && (
              <p className="auto-note">
                {
                  "2 回目は同じ idempotencyKey で実行しています。1 回目に成功した操作と、結果が分からなかった操作は、実行せずに前の結果を引き継ぎます。"
                }
              </p>
            )}
          </section>

          <LogPanel attempts={attempts} plan={data.plan} />
        </>
      )}
    </div>
  );
}

// -------------------------------------------------------------- mapping ----

function MappingPanel({
  data,
  highlight,
  onHighlight,
}: {
  data: Technical;
  highlight: string[];
  onHighlight: (ids: string[]) => void;
}) {
  const byId = new Map(data.plan.evidence.map((e) => [e.id, e]));
  const fields = Object.entries(data.extraction.fields);

  return (
    <section className="auto-panel" aria-labelledby="map-h">
      <h2 id="map-h">3. マッピング（原文 → 項目）</h2>
      <p className="auto-lead">
        {`抽出は ${data.extraction.processing === "ai" ? "実AI" : "ルール処理"}（${data.extraction.extractorVersion}）です。項目を選ぶと、その根拠が原文のどこかを示します。根拠のない項目は、規則から導いたものとして区別します。`}
      </p>

      <div className="auto-mapping">
        <ul className="auto-fields">
          {fields.map(([name, field]) => {
            const active = field.evidenceIds.some((id) =>
              highlight.includes(id),
            );
            return (
              <li key={name} data-active={active}>
                <button
                  type="button"
                  onClick={() => onHighlight(active ? [] : field.evidenceIds)}
                  aria-pressed={active}
                  disabled={field.evidenceIds.length === 0}
                >
                  <b>{name}</b>
                  <span>{String(field.value)}</span>
                  <small>
                    {field.evidenceIds.length
                      ? `原文に根拠 ${field.evidenceIds.length} 件`
                      : "規則から導出（原文に該当箇所なし）"}
                  </small>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="auto-source">
          <h3>原文</h3>
          <p className="auto-source-text">
            <Spans
              text={data.sourceText}
              evidence={data.plan.evidence.filter((e) =>
                highlight.includes(e.id),
              )}
            />
          </p>
          {highlight.length === 0 && (
            <p className="auto-note">
              左の項目を選ぶと、その根拠にあたる部分が反転します。
            </p>
          )}
          {highlight.map((id) => {
            const e = byId.get(id);
            return e ? (
              <p key={id} className="auto-note">
                <code>
                  {e.start}–{e.end}
                </code>{" "}
                「{e.quote}」
              </p>
            ) : null;
          })}
        </div>
      </div>
    </section>
  );
}

/** Highlights the evidence spans inside the source, without rewriting it. */
function Spans({ text, evidence }: { text: string; evidence: Evidence[] }) {
  if (evidence.length === 0) return <>{text}</>;
  const ordered = [...evidence].sort((a, b) => a.start - b.start);
  const parts: React.ReactNode[] = [];
  let at = 0;
  ordered.forEach((span, i) => {
    if (span.start > at) parts.push(text.slice(at, span.start));
    parts.push(
      <mark key={`${span.id}-${i}`}>{text.slice(span.start, span.end)}</mark>,
    );
    at = Math.max(at, span.end);
  });
  parts.push(text.slice(at));
  return <>{parts}</>;
}

// ------------------------------------------------------------- approval ----

function ApprovalPanel({
  plan,
  selected,
  setSelected,
  approval,
  setApproval,
  error,
  setError,
}: {
  plan: ActionPlan;
  selected: string[];
  setSelected: (ids: string[]) => void;
  approval: Approval | null;
  setApproval: (a: Approval | null) => void;
  error: string;
  setError: (s: string) => void;
}) {
  return (
    <section className="auto-panel" aria-labelledby="ap-h">
      <h2 id="ap-h">5. 承認</h2>
      <p className="auto-lead">
        {
          "承認は「この計画」ではなく「この中身」に対して行われます。承認後に本文が変われば payloadHash が変わり、同じ承認では実行できません。"
        }
      </p>

      <ul className="auto-approve">
        {plan.actions.map((action) => (
          <li key={action.id}>
            <label>
              <input
                type="checkbox"
                checked={selected.includes(action.id)}
                disabled={!!approval}
                onChange={(e) =>
                  setSelected(
                    e.target.checked
                      ? [...selected, action.id]
                      : selected.filter((id) => id !== action.id),
                  )
                }
              />
              <span>
                <b>{action.kind}</b>
                <small>{action.summary}</small>
              </span>
            </label>
          </li>
        ))}
      </ul>

      {approval ? (
        <div className="auto-subpanel">
          <h3>承認済み</h3>
          <dl className="auto-facts">
            <div>
              <dt>承認者</dt>
              <dd>{approval.approvedBy}</dd>
            </div>
            <div>
              <dt>対象の版</dt>
              <dd>v{approval.planVersion}</dd>
            </div>
            <div>
              <dt>期限</dt>
              <dd>{approval.expiresAt.slice(0, 19).replace("T", " ")}</dd>
            </div>
            <div>
              <dt>紐づけたハッシュ</dt>
              <dd>
                {Object.entries(approval.payloadHashes).map(([id, h]) => (
                  <code key={id}>
                    {id}: {h.slice(0, 12)}…
                  </code>
                ))}
              </dd>
            </div>
          </dl>
          <div className="auto-actions">
            <button
              type="button"
              className="auto-button"
              onClick={() => setApproval(null)}
            >
              承認を取り消す
            </button>
          </div>
        </div>
      ) : (
        <div className="auto-actions">
          <button
            type="button"
            className="auto-button primary"
            onClick={() => {
              const result = recordApproval(plan, {
                tenantId: plan.tenantId,
                runId: plan.runId,
                planVersion: plan.version,
                approvedActionIds: selected,
                approvedBy: "この端末の利用者",
                atIso: new Date().toISOString(),
              });
              if (result.ok) {
                setApproval(result.approval);
                setError("");
              } else setError(result.reason);
            }}
            disabled={selected.length === 0}
          >
            選んだ {selected.length} 件を承認する
          </button>
        </div>
      )}

      {error && (
        <p className="auto-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

// ------------------------------------------------------------------ log ----

function LogPanel({
  attempts,
  plan,
}: {
  attempts: RunAttempt[];
  plan: ActionPlan;
}) {
  const effects: Array<EffectRecord & { attempt: number }> = attempts.flatMap(
    (a, i) => a.effects.map((e) => ({ ...e, attempt: i + 1 })),
  );

  return (
    <section className="auto-panel" aria-labelledby="log-h">
      <h2 id="log-h">7. 出力とログ</h2>
      {effects.length === 0 ? (
        <p className="auto-note">
          まだ実行していません。上で実行すると、操作ごとの結果がここに残ります。
        </p>
      ) : (
        <>
          <div
            className="auto-table-scroll"
            tabIndex={0}
            role="region"
            aria-label="実行ログ"
          >
            <table className="auto-table">
              <caption className="sr-only">実行の記録</caption>
              <thead>
                <tr>
                  <th scope="col">回</th>
                  <th scope="col">操作</th>
                  <th scope="col">結果</th>
                  <th scope="col">相手側ID</th>
                  <th scope="col">説明</th>
                </tr>
              </thead>
              <tbody>
                {effects.map((e, i) => (
                  <tr key={`${e.actionId}-${i}`}>
                    <td data-label="回">{e.attempt}</td>
                    <th scope="row">
                      <code>{e.kind}</code>
                    </th>
                    <td data-label="結果">
                      <span className="auto-outcome" data-status={e.status}>
                        {outcomeLabel[e.status]}
                      </span>
                    </td>
                    <td data-label="相手側ID">
                      {e.externalId ? <code>{e.externalId}</code> : "—"}
                    </td>
                    <td data-label="説明">{e.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="auto-actions">
            <button
              type="button"
              className="auto-button"
              onClick={() =>
                downloadText(
                  JSON.stringify(
                    {
                      runId: plan.runId,
                      planVersion: plan.version,
                      policyVersion: plan.policyVersion,
                      attempts: attempts.map((a, i) => ({
                        attempt: i + 1,
                        status: a.status,
                        effects: a.effects,
                        calls: a.calls,
                      })),
                    },
                    null,
                    2,
                  ),
                  `automation-log-${stamp(new Date().toISOString())}.json`,
                  "application/json",
                )
              }
            >
              ログを書き出す
            </button>
          </div>
        </>
      )}
      <p className="auto-note">
        {"業務側の見え方は "}
        <Link href="/demos/automation">RELAY のデモ</Link>
        {" にあります。同じ実行を、別の粒度で見ているだけです。"}
      </p>
    </section>
  );
}
