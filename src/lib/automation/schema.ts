import {
  actionKinds,
  executionModes,
  inputSources,
  irreversibleActionKinds,
  outputTargets,
  processingKinds,
  runStatuses,
  type ActionKind,
} from "../runtime/types";

/**
 * The contract, read off the contract (指示書 §17 Automation／API).
 *
 * A technical screen that lists "the statuses a run can have" in hand-written
 * markup is a screenshot of a contract, not the contract: the day somebody
 * adds a status, the page keeps telling visitors the old set. So every列 here
 * is derived from the exported constants the runtime actually enforces, and a
 * unit test fails if a value gains a name without gaining a description.
 *
 * What this screen is *not*: a canvas of nodes joined by lines. Lines do not
 * tell you which effects cannot be taken back, which key makes a retry safe,
 * or what an approval is bound to. Those are the things an engineer asks, so
 * those are the things it shows.
 */

export type EnumField = {
  value: string;
  label: string;
  /** Why it exists. Not a restatement of the name. */
  note: string;
  /** Marks a value with consequences a reader must not miss. */
  flag?: string;
};

export type EnumSet = {
  id: string;
  title: string;
  /** The exported constant this is read from, so a reader can go and check. */
  source: string;
  description: string;
  values: EnumField[];
};

const describe = <T extends string>(
  values: readonly T[],
  notes: Record<T, { label: string; note: string; flag?: string }>,
): EnumField[] =>
  values.map((value) => ({
    value,
    label: notes[value].label,
    note: notes[value].note,
    flag: notes[value].flag,
  }));

export const enumSets: EnumSet[] = [
  {
    id: "executionModes",
    title: "実行モード",
    source: "runtime/types.ts · executionModes",
    description:
      "どこまで届いてよいか。外へ出る操作は customer_live と実接続がそろったときだけ実行されます。",
    values: describe(executionModes, {
      sample: {
        label: "sample",
        note: "公開デモ。外部へ出る操作は計画までで、実行しません。",
      },
      private_pilot: {
        label: "private_pilot",
        note: "限定検証。接続済みの宛先にだけ、承認を経て届きます。",
      },
      customer_live: {
        label: "customer_live",
        note: "本番。取り消せない操作が実際に実行されうる唯一のモードです。",
        flag: "取り消せない操作が実行されうる",
      },
    }),
  },
  {
    id: "actionKinds",
    title: "操作の種類",
    source: "runtime/types.ts · actionKinds",
    description:
      "閉じた集合です。計画を作る側が新しい種類を発明することはできません。",
    values: describe(actionKinds, {
      "case.upsert": {
        label: "case.upsert",
        note: "案件記録の作成・更新。内部の記録なので取り消せます。",
      },
      "reply.draft": {
        label: "reply.draft",
        note: "返信の下書き作成。送信ではありません。",
      },
      "mail.send": {
        label: "mail.send",
        note: "メール送信。届いたものは取り消せません。",
      },
      "calendar.hold": {
        label: "calendar.hold",
        note: "仮押さえ。期限切れで自動的に解放されます。",
      },
      "calendar.confirm": {
        label: "calendar.confirm",
        note: "予約の確定。相手に通知が出るため取り消せません。",
      },
      "calendar.update": {
        label: "calendar.update",
        note: "確定済み予約の変更。同上。",
      },
      "report.generate": {
        label: "report.generate",
        note: "集計結果の生成。再実行で同じものが作れます。",
      },
      "artifact.store": {
        label: "artifact.store",
        note: "生成物の保存。内部なので作り直せます。",
      },
    }).map((field) =>
      irreversibleActionKinds.includes(field.value as ActionKind)
        ? { ...field, flag: "取り消せない" }
        : field,
    ),
  },
  {
    id: "runStatuses",
    title: "実行の状態",
    source: "runtime/types.ts · runStatuses",
    description:
      "失敗と「結果が分からない」を別の状態にしています。タイムアウトした送信は、失敗した送信ではありません。",
    values: describe(runStatuses, {
      received: { label: "received", note: "受け付けた。まだ何もしていない。" },
      queued: {
        label: "queued",
        note: "受け付けたが、まだ抽出も計画も始めていない。",
      },
      processing: { label: "processing", note: "抽出と計画を作っている。" },
      needs_info: {
        label: "needs_info",
        note: "足りない情報があるため、人に聞くまで進まない。",
      },
      awaiting_approval: {
        label: "awaiting_approval",
        note: "計画はできた。人の承認を待っている。",
      },
      executing: { label: "executing", note: "承認された操作を実行中。" },
      completed: { label: "completed", note: "全部成功した。" },
      partially_failed: {
        label: "partially_failed",
        note: "一部だけ失敗した。成功した分は再実行しない。",
      },
      outcome_unknown: {
        label: "outcome_unknown",
        note: "応答が返らず、届いたかどうか分からない。再送すると二重になりうる。",
        flag: "再実行は危険",
      },
      failed: {
        label: "failed",
        note: "実行できなかった。安全に再試行できる。",
      },
      cancelled: { label: "cancelled", note: "人が止めた。" },
    }),
  },
  {
    id: "processingKinds",
    title: "処理方式",
    source: "runtime/types.ts · processingKinds",
    description:
      "工程ごとに表示します。ルール処理の結果をAIの成果として見せないための区別です。",
    values: describe(processingKinds, {
      deterministic: {
        label: "deterministic",
        note: "規則による処理。同じ入力なら必ず同じ出力になります。",
      },
      ai: {
        label: "ai",
        note: "実際にAIを呼んだ工程。鍵が未設定のときは使われません。",
      },
      replay: {
        label: "replay",
        note: "前回の結果をそのまま使った工程。新しく生成していません。",
      },
    }),
  },
  {
    id: "inputSources",
    title: "入力元",
    source: "runtime/types.ts · inputSources",
    description: "許可された入力だけを受け取ります。任意のURLは取得しません。",
    values: describe(inputSources, {
      sample: { label: "sample", note: "この画面に同梱したサンプル文。" },
      user_file: {
        label: "user_file",
        note: "利用者が選んだファイル。端末の外へ出しません。",
      },
      approved_web_form: {
        label: "approved_web_form",
        note: "許可済みのフォーム受信。",
      },
      connected_mailbox: {
        label: "connected_mailbox",
        note: "接続済みメールボックス。未接続なので現在は使われません。",
        flag: "未接続",
      },
    }),
  },
  {
    id: "outputTargets",
    title: "出力先",
    source: "runtime/types.ts · outputTargets",
    description:
      "生成物がどこへ行くか。外部ツールへの配信は別の承認が要ります。",
    values: describe(outputTargets, {
      browser: { label: "browser", note: "画面とダウンロードのみ。" },
      test_area: {
        label: "test_area",
        note: "本番と分けた検証用の置き場。誤って顧客へ届くことがない。",
      },
      connected_tool: {
        label: "connected_tool",
        note: "接続済みの外部ツール。未接続なので現在は使われません。",
        flag: "未接続",
      },
    }),
  },
];

export type RecordField = {
  name: string;
  type: string;
  note: string;
};

export type RecordShape = {
  id: string;
  title: string;
  source: string;
  description: string;
  fields: RecordField[];
};

/**
 * The three records the console actually manipulates. Described by hand
 * because a field's *reason* is not derivable from its type — but each one is
 * checked against the runtime by the unit test, so a rename cannot rot here
 * unnoticed.
 */
export const recordShapes: RecordShape[] = [
  {
    id: "ActionPlan",
    title: "実行計画",
    source: "runtime/types.ts · ActionPlan",
    description:
      "抽出の結果ではなく、これから何をするかの一覧です。承認はこれに対して行われます。",
    fields: [
      { name: "runId", type: "string", note: "この実行の識別子。" },
      {
        name: "version",
        type: "number",
        note: "計画の版。内容が変われば上がり、古い承認は効かなくなります。",
      },
      {
        name: "inputHash",
        type: "string",
        note: "入力そのもののハッシュ。同じ入力かどうかの判定に使います。",
      },
      {
        name: "policyVersion",
        type: "string",
        note: "どの規則で作られた計画か。後から説明するために残します。",
      },
      { name: "mode", type: "ExecutionMode", note: "どこまで届いてよいか。" },
      {
        name: "evidence",
        type: "Evidence[]",
        note: "抽出の根拠。原文の位置と引用で、言い換えではありません。",
      },
      {
        name: "missingFields",
        type: "MissingField[]",
        note: "埋められなかった項目と、その理由。",
      },
      {
        name: "warnings",
        type: "Warning[]",
        note: "blocking は needs_info を強制します。",
      },
      {
        name: "actions",
        type: "PlannedAction[]",
        note: "実行する操作の一覧。",
      },
    ],
  },
  {
    id: "PlannedAction",
    title: "計画された操作",
    source: "runtime/types.ts · PlannedAction",
    description: "1 つの操作。承認と冪等性はこの単位で効きます。",
    fields: [
      { name: "kind", type: "ActionKind", note: "閉じた集合のどれか。" },
      { name: "targetRef", type: "string", note: "どこに対する操作か。" },
      {
        name: "payloadHash",
        type: "string",
        note: "中身のハッシュ。承認はこの値に紐づきます。",
      },
      {
        name: "idempotencyKey",
        type: "string",
        note: "同じ鍵の再実行は、二度目の実行になりません。",
      },
      {
        name: "requiresApproval",
        type: "boolean",
        note: "計画側の提案。実際の可否は authoriseAction が環境から計算し直します。",
      },
    ],
  },
  {
    id: "EffectRecord",
    title: "実行の記録",
    source: "runtime/types.ts · EffectRecord",
    description: "外の世界で何が起きたか。計画ではなく結果です。",
    fields: [
      {
        name: "status",
        type: "succeeded | failed | outcome_unknown | skipped",
        note: "failed と outcome_unknown を分けます。後者は再送が二重配信になりえます。",
      },
      {
        name: "externalId",
        type: "string?",
        note: "相手側の識別子。突き合わせの唯一の安全な根拠です。",
      },
      {
        name: "idempotencyKey",
        type: "string",
        note: "計画の鍵と同じもの。再実行時の照合に使います。",
      },
      { name: "detail", type: "string", note: "人が読むための説明。" },
      {
        name: "at",
        type: "string",
        note: "実行を試みた時刻。あとから相手側の記録と突き合わせるための起点。",
      },
    ],
  },
];

/** What this console will not do, stated where an engineer will look. */
export const boundaries: Array<{ title: string; detail: string }> = [
  {
    title: "任意のコードは実行しません",
    detail:
      "実行できるのは上の「操作の種類」にある 8 種類だけで、この一覧はコードの閉じた集合そのものです。式やスクリプトを受け取る入口はありません。",
  },
  {
    title: "任意のURLは取得しません",
    detail:
      "入力は同梱サンプルと、この画面から選んだファイルだけです。URLを渡して取得させる機能はありません。",
  },
  {
    title: "外へ出る操作は、ここでは実行されません",
    detail:
      "このコンソールは sample モードで動きます。mail.send・calendar.confirm・calendar.update は計画と承認までで、実行は customer_live と実接続がそろったときだけです。",
  },
  {
    title: "処理はこの端末の中で完結します",
    detail:
      "計画の作成は同じサイトの /api/flow が行い、承認・実行・再実行の判定はブラウザ内の模擬アダプターで行います。入力文はサーバーに保存されません。",
  },
];
