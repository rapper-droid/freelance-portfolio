import { authorisePlan, type AuthorisationContext } from "./approval";
import { extractorAvailability } from "./extract/registry";
import type {
  ActionPlan,
  ExecutionMode,
  InputSource,
  OutputTarget,
  ProcessingKind,
  Run,
} from "./types";

/**
 * What the interface is allowed to say about a run (指示書 §06).
 *
 * One label for the whole thing would hide the part that matters. A run can
 * read a fictional sample, process it with ordinary code, and reach nothing
 * outside — and all three of those facts have to be visible separately,
 * because the honest version of "AI が処理しました" is usually "ルール処理が
 * 動き、AI は動いていません".
 *
 * Everything here is derived from the run and the environment. No screen may
 * construct its own badge.
 */

export type StageLabel = {
  /** Where the input came from. */
  input: { value: InputSource; label: string };
  /** How it was processed. */
  processing: { value: ProcessingKind; label: string };
  /** Where the output went. */
  output: { value: OutputTarget; label: string };
  /** What reached outside, if anything. */
  external: {
    value:
      | "none"
      | "draft"
      | "awaiting_approval"
      | "executed"
      | "partially_failed"
      | "outcome_unknown";
    label: string;
  };
};

const INPUT_LABELS: Record<InputSource, string> = {
  sample: "架空サンプル",
  user_file: "利用者のファイル",
  approved_web_form: "許可済みWebフォーム",
  connected_mailbox: "接続済みメール",
};

const PROCESSING_LABELS: Record<ProcessingKind, string> = {
  deterministic: "通常プログラム",
  ai: "実AI処理",
  replay: "保存済み実行記録の再生",
};

const OUTPUT_LABELS: Record<OutputTarget, string> = {
  browser: "ブラウザ内",
  test_area: "テスト領域",
  connected_tool: "接続済み業務ツール",
};

/**
 * Derives the four labels from what actually happened.
 *
 * `external` is read from the effect records rather than from the run's
 * status, because the status is a summary and this field is a claim about the
 * outside world (指示書 O10).
 */
export function stageLabels(run: Run): StageLabel {
  const effects = run.effects;
  const executed = effects.some(
    (e) =>
      e.status === "succeeded" &&
      !e.kind.startsWith("case") &&
      !e.kind.startsWith("reply"),
  );
  const unknown = effects.some((e) => e.status === "outcome_unknown");
  const failed = effects.some((e) => e.status === "failed");

  const external: StageLabel["external"] = unknown
    ? { value: "outcome_unknown", label: "結果未確認" }
    : failed && executed
      ? { value: "partially_failed", label: "一部失敗" }
      : executed
        ? { value: "executed", label: "実行済み" }
        : run.status === "awaiting_approval"
          ? { value: "awaiting_approval", label: "承認待ち" }
          : effects.length || run.plan
            ? { value: "draft", label: "下書きまで" }
            : { value: "none", label: "なし" };

  const processing: ProcessingKind = run.plan?.policyVersion.includes("claude")
    ? "ai"
    : "deterministic";

  return {
    input: { value: run.inputSource, label: INPUT_LABELS[run.inputSource] },
    processing: { value: processing, label: PROCESSING_LABELS[processing] },
    output: {
      value: run.mode === "sample" ? "browser" : "test_area",
      label: OUTPUT_LABELS[run.mode === "sample" ? "browser" : "test_area"],
    },
    external,
  };
}

export type ActionView = {
  id: string;
  kind: string;
  summary: string;
  targetRef: string;
  requiresApproval: boolean;
  executable: boolean;
  reason: string;
};

/** The approval card's contents: every action with the reason it can or cannot run. */
export function planView(
  plan: ActionPlan,
  context: AuthorisationContext,
): ActionView[] {
  const authorisations = authorisePlan(plan, context);
  return plan.actions.map((action, i) => ({
    id: action.id,
    kind: action.kind,
    summary: action.summary,
    targetRef: action.targetRef,
    requiresApproval: authorisations[i].requiresApproval,
    executable: authorisations[i].executable,
    reason: authorisations[i].reason,
  }));
}

export type ModeNotice = {
  mode: ExecutionMode;
  heading: string;
  body: string;
  /** Present only when something genuinely cannot run here. */
  blocked: string[];
};

/**
 * The sentence shown before anyone starts, listing what is not connected.
 *
 * It is built from the environment, so a missing credential appears here
 * automatically rather than through someone remembering to update a paragraph
 * (指示書 A07, D02).
 */
export function modeNotice(
  mode: ExecutionMode,
  env: Record<string, string | undefined> = process.env,
): ModeNotice {
  const ai = extractorAvailability(env);
  const blocked: string[] = [];
  if (!ai.ai) blocked.push(`実AI処理：${ai.aiBlockedReason}未稼働です。`);
  if (mode === "sample") {
    blocked.push(
      "メール送信・カレンダー登録：公開サンプルでは実行しません（下書きまで）。",
    );
    return {
      mode,
      heading: "PUBLIC SAMPLE / 架空データの体験",
      body: "架空スタジオのデータを、この場でサーバー側の通常プログラムが処理します。登録も接続も不要です。入力した文章は保存せず、外部のAIにも送りません。",
      blocked,
    };
  }
  if (mode === "private_pilot")
    return {
      mode,
      heading: "PRIVATE PILOT / 所有者の検証環境",
      body: "所有者が許可した入力とテスト領域だけを使って、処理から結果確認までを検証します。",
      blocked,
    };
  return {
    mode,
    heading: "CUSTOMER LIVE / 顧客環境",
    body: "権限・同意・費用・処理ルール・障害時対応が確定した環境です。",
    blocked,
  };
}
