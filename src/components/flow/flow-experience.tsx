"use client";

import { useCallback, useId, useMemo, useRef, useState } from "react";
import { track } from "@/components/analytics";
import { DEMO_NOW_LABEL, SCENARIOS } from "@/lib/runtime/scenarios";
import type { ModeNotice, StageLabel } from "@/lib/runtime/present";
import { FlowHandoff } from "./flow-handoff";
import { FlowResult, type FlowResponse } from "./flow-result";

/**
 * The public sample's controls (指示書 §05, §12).
 *
 * What the visitor does is choose a situation and press once. There is no
 * sign-up, no connection step and no empty form: the sample text is already
 * in the box, editable but not required. Each press posts to `/api/flow`,
 * where the real runtime runs — this component renders a result, it does not
 * reimplement the logic.
 *
 * The steps advance on the response, not on a timer, and the second and third
 * steps of each track are the point: the follow-up message that does not
 * repeat its questions, and the file whose columns moved.
 */

type Track = "relay" | "daybook" | "report";

const TRACKS: Array<{
  id: Track;
  kicker: string;
  title: string;
  description: string;
}> = [
  {
    id: "relay",
    kicker: "RELAY",
    title: "見積の相談が届いた",
    description:
      "読む・過去を探す・要件を転記する・確認質問を考える・返信の冒頭を書く。ここまでを先に進めます。",
  },
  {
    id: "daybook",
    kicker: "DAYBOOK",
    title: "予約の相談が届いた",
    description:
      "候補を出す・空きを確認する・準備時間を足す・文案を書く。変更が来たときの後始末まで。",
  },
  {
    id: "report",
    kicker: "REPORT FLOW",
    title: "今週の売上ファイルが届いた",
    description:
      "列を対応づける・重複を見る・集計する・前回と比べる。二回目は説明し直しません。",
  },
];

const stepsOf = (t: Track) => SCENARIOS.filter((s) => s.workflow === t);

export function FlowExperience({ notice }: { notice: ModeNotice }) {
  const [current, setCurrent] = useState<Track | null>(null);
  const [step, setStep] = useState(0);
  const [text, setText] = useState("");
  const [result, setResult] = useState<FlowResponse | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  // Carried between steps so week 2 reuses week 1's decisions (指示書 §09-1).
  const recipe = useRef<unknown>(null);
  const resultsId = useId();

  // Stable across renders so the callbacks below are not rebuilt every time.
  const steps = useMemo(() => (current ? stepsOf(current) : []), [current]);
  const scenario = steps[step];

  const choose = useCallback((next: Track) => {
    setCurrent(next);
    setStep(0);
    setResult(null);
    setStatus("");
    recipe.current = null;
    const first = stepsOf(next)[0];
    setText(first?.body ?? "");
    track("scenario_started");
  }, []);

  const run = useCallback(
    /**
     * `bodyOverride` exists because advancing a step sets the next message and
     * runs it in the same tick. A state update is not visible to this closure
     * until the next render, so reading `text` here would send the previous
     * step's message under the next step's name.
     */
    async (index: number, bodyOverride?: string) => {
      const target = steps[index];
      if (!target) return;
      const body = bodyOverride ?? text;
      setBusy(true);
      setStatus("処理中です。完了すると結果が表示されます。");
      try {
        const response = await fetch("/api/flow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scenario: target.id,
            ...(target.workflow === "report"
              ? { recipe: recipe.current ?? undefined }
              : { text: body.trim() || target.body }),
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          setStatus(data?.message ?? "処理できませんでした。");
          setResult(null);
          return;
        }
        if (data.workflow === "report" && data.recipe)
          recipe.current = data.recipe;
        setResult(data as FlowResponse);
        setStep(index);
        setStatus("");
        track(index === 0 ? "first_result_seen" : "second_run_completed");
      } catch {
        // The typed text is kept so nothing has to be written twice (指示書 §12).
        setStatus(
          "通信に失敗しました。入力はそのまま残っています。もう一度お試しください。",
        );
      } finally {
        setBusy(false);
      }
    },
    [steps, text],
  );

  const advance = useCallback(() => {
    const next = step + 1;
    const target = steps[next];
    if (!target) return;
    if (target.workflow === "report") {
      void run(next);
      return;
    }
    // The next message is both shown in the box and sent, in one tick.
    setText(target.body);
    void run(next, target.body);
  }, [run, step, steps]);

  return (
    <div className="flow-experience">
      <p className="flow-clock">{DEMO_NOW_LABEL}</p>

      <section className="flow-notice" aria-labelledby={`${resultsId}-mode`}>
        <h2 id={`${resultsId}-mode`}>{notice.heading}</h2>
        <p>{notice.body}</p>
        {notice.blocked.length > 0 && (
          <ul className="flow-blocked">
            {notice.blocked.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        )}
      </section>

      <h2 className="sr-only">はじめる状況を選ぶ</h2>
      <ul className="flow-entries">
        {TRACKS.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              className="flow-entry"
              aria-pressed={current === t.id}
              onClick={() => choose(t.id)}
            >
              <span className="flow-entry-kicker flow-entry-mark">
                {t.kicker}{" "}
              </span>
              <strong>{t.title}</strong>
              <span>{t.description}</span>
            </button>
          </li>
        ))}
      </ul>

      {current && scenario && (
        <>
          <h2 className="sr-only">{scenario.trigger}</h2>
          {scenario.workflow === "report" ? (
            <p className="flow-empty">
              届いたファイル：<strong>{scenario.label}</strong>
              <br />
              {scenario.note}
            </p>
          ) : (
            <label className="flow-input">
              <span>
                {scenario.trigger}（{scenario.label}）— 文面は編集できます
              </span>
              <textarea
                value={text}
                maxLength={2000}
                rows={4}
                onChange={(e) => setText(e.target.value)}
              />
            </label>
          )}

          <div className="flow-controls">
            <button
              type="button"
              className="flow-button"
              disabled={busy}
              onClick={() => void run(step)}
            >
              {busy
                ? "処理中…"
                : result
                  ? "もう一度この段階を実行"
                  : "仕事が進むところを見る"}
            </button>
            {result && steps[step + 1] && (
              <button
                type="button"
                className="flow-button secondary"
                disabled={busy}
                onClick={advance}
              >
                次：{steps[step + 1].label}
              </button>
            )}
            <p className="flow-status" role="status" aria-live="polite">
              {status}
            </p>
          </div>

          <p className="flow-fineprint">
            {scenario.note}{" "}
            {
              "入力した文章はこのリクエスト内で処理し、保存しません。外部のAIには送信しません。実在の個人情報は入力しないでください。"
            }
          </p>
        </>
      )}

      {result && <FlowResult result={result} />}
      {result && current && <FlowHandoff workflow={current} />}
    </div>
  );
}

export type { StageLabel };
