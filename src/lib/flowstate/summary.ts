/**
 * FLOWSTATE's weekly summary (指示書 §17「実際の出力」).
 *
 * §17 asks the SaaS page to show the actual output, not a picture of one. So
 * this builds the file the product would send on a Friday, from the sample
 * week below, and the page hands it over as Markdown — a real file that opens
 * in any editor.
 *
 * The numbers are the sample's own. Nothing here is a claim about a customer:
 * there are no customers, and the page says so beside the download.
 */

export type Task = {
  id: string;
  title: string;
  owner: string;
  status: "done" | "doing" | "blocked" | "todo";
  /** Days from the start of the sample week. */
  day: number;
  project: string;
};

export const SAMPLE_WEEK: Task[] = [
  {
    id: "T-101",
    title: "問い合わせ導線の文言を直す",
    owner: "担当A",
    status: "done",
    day: 0,
    project: "サイト改善",
  },
  {
    id: "T-102",
    title: "請求書テンプレートの差し替え",
    owner: "担当B",
    status: "done",
    day: 0,
    project: "経理",
  },
  {
    id: "T-103",
    title: "商品写真の撮り直し",
    owner: "担当A",
    status: "doing",
    day: 1,
    project: "サイト改善",
  },
  {
    id: "T-104",
    title: "在庫の棚卸し",
    owner: "担当C",
    status: "blocked",
    day: 1,
    project: "店舗運営",
  },
  {
    id: "T-105",
    title: "定休日のお知らせを掲載",
    owner: "担当B",
    status: "done",
    day: 2,
    project: "店舗運営",
  },
  {
    id: "T-106",
    title: "問い合わせの一次返信を整える",
    owner: "担当A",
    status: "doing",
    day: 3,
    project: "サポート",
  },
  {
    id: "T-107",
    title: "月次の売上をまとめる",
    owner: "担当C",
    status: "todo",
    day: 4,
    project: "経理",
  },
  {
    id: "T-108",
    title: "配送料の見直し",
    owner: "担当B",
    status: "blocked",
    day: 4,
    project: "店舗運営",
  },
];

export const STATUS_LABELS: Record<Task["status"], string> = {
  done: "完了",
  doing: "進行中",
  blocked: "待ち",
  todo: "未着手",
};

const DAYS = ["月", "火", "水", "木", "金"];

export type WeekSummary = {
  total: number;
  done: number;
  doing: number;
  blocked: number;
  todo: number;
  byProject: Array<{ project: string; total: number; done: number }>;
  blockedTasks: Task[];
};

/** The figures the summary quotes, computed once so the file and the page agree. */
export function summariseWeek(
  tasks: readonly Task[] = SAMPLE_WEEK,
): WeekSummary {
  const count = (status: Task["status"]) =>
    tasks.filter((t) => t.status === status).length;

  const projects = [...new Set(tasks.map((t) => t.project))];
  return {
    total: tasks.length,
    done: count("done"),
    doing: count("doing"),
    blocked: count("blocked"),
    todo: count("todo"),
    byProject: projects.map((project) => ({
      project,
      total: tasks.filter((t) => t.project === project).length,
      done: tasks.filter((t) => t.project === project && t.status === "done")
        .length,
    })),
    blockedTasks: tasks.filter((t) => t.status === "blocked"),
  };
}

/**
 * The file itself.
 *
 * Markdown, because it is readable as text and opens everywhere — and because
 * claiming XLSX or PDF would mean implementing them. §15 is explicit that a
 * format is offered only when it can really be produced and opened.
 */
export function weeklyMarkdown(
  tasks: readonly Task[] = SAMPLE_WEEK,
  generatedAtIso = new Date().toISOString(),
): string {
  const s = summariseWeek(tasks);
  const stamp = generatedAtIso.slice(0, 10);

  const lines = [
    "# 今週のまとめ（FLOWSTATE サンプル）",
    "",
    `作成日: ${stamp}`,
    "",
    "> このファイルは架空SaaSのデモが生成したサンプルです。実在の案件・担当者・",
    "> 取引先の情報は含まれていません。",
    "",
    "## 件数",
    "",
    `- 全体: ${s.total} 件`,
    `- 完了: ${s.done} 件`,
    `- 進行中: ${s.doing} 件`,
    `- 待ち: ${s.blocked} 件`,
    `- 未着手: ${s.todo} 件`,
    "",
    "## プロジェクト別",
    "",
    "| プロジェクト | 件数 | 完了 |",
    "| --- | ---: | ---: |",
    ...s.byProject.map(
      (row) => `| ${row.project} | ${row.total} | ${row.done} |`,
    ),
    "",
  ];

  if (s.blockedTasks.length) {
    lines.push(
      "## 来週に持ち越す、待ちの項目",
      "",
      ...s.blockedTasks.map(
        (t) => `- ${t.id} ${t.title}（${t.owner}・${t.project}）`,
      ),
      "",
    );
  }

  lines.push(
    "## 明細",
    "",
    "| ID | 曜日 | 項目 | 担当 | 状態 |",
    "| --- | --- | --- | --- | --- |",
    ...tasks.map(
      (t) =>
        `| ${t.id} | ${DAYS[t.day] ?? "—"} | ${t.title} | ${t.owner} | ${STATUS_LABELS[t.status]} |`,
    ),
    "",
  );

  return lines.join("\n");
}

/** What the product would need, and what this demo actually has. */
export type Capability = {
  area: string;
  covered: string;
  /** Written as the permission would be requested, not as a shrug. */
  permission: string;
  /** Always false here; the page states it rather than implying otherwise. */
  connected: boolean;
  note: string;
};

export const CAPABILITIES: Capability[] = [
  {
    area: "タスクと進行",
    covered: "作成・担当・状態・期日",
    permission: "この画面のデータのみ（外部権限なし）",
    connected: true,
    note: "このデモの中で実際に動いています。",
  },
  {
    area: "週次まとめの書き出し",
    covered: "Markdown での出力",
    permission: "ブラウザのダウンロードのみ",
    connected: true,
    note: "下のボタンで実際にファイルが作られます。",
  },
  {
    area: "メール通知",
    covered: "未実装",
    permission: "送信ドメインの認証、送信先の同意",
    connected: false,
    note: "送信は行いません。接続には送信元ドメインの設定が要ります。",
  },
  {
    area: "カレンダー連携",
    covered: "未実装",
    permission: "カレンダーの読み取り（書き込みなし）",
    connected: false,
    note: "認証情報が必要なため、このデモでは接続していません。",
  },
  {
    area: "チャット通知",
    covered: "未実装",
    permission: "チャンネルへの投稿",
    connected: false,
    note: "投稿先を持たないため、接続していません。",
  },
  {
    area: "シングルサインオン",
    covered: "未実装",
    permission: "ID プロバイダーとの信頼関係",
    connected: false,
    note: "このデモにログインはありません。",
  },
];

/** How a team would start, written as steps rather than as a promise. */
export const ADOPTION_STEPS: Array<{ title: string; detail: string }> = [
  {
    title: "1. いまのやり方を書き出す",
    detail:
      "使っている表やメモをそのまま持ち込みます。移行のために整える作業は不要です。",
  },
  {
    title: "2. 一つのプロジェクトだけで試す",
    detail:
      "全社で始めません。二週間、一つのプロジェクトだけで回して、合わなければ戻せます。",
  },
  {
    title: "3. 週次のまとめを自動で受け取る",
    detail:
      "金曜に今週のまとめが出ます。書式はこのページで実際に書き出せるものと同じです。",
  },
  {
    title: "4. 必要なものだけつなぐ",
    detail:
      "カレンダーやチャットは、必要だと分かってから接続します。最初から全部つなぎません。",
  },
];
