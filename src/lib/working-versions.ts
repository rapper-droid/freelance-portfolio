/**
 * Which showcase demos have a version you can actually operate, and where it
 * is (指示書 §10, §13).
 *
 * Most of the eleven demos are a screen. Two of them are shops: KISSA takes
 * orders and books tables, FORME counts stock and ships nothing until it is
 * paid for. That difference is the whole point, so it lives here as data —
 * the panel on a demo page, the third action on a card, and the test that
 * checks the catalogue does not deny what these routes do all read the same
 * record.
 */

export type LiveRoute = { href: string; label: string; detail: string };

/** What the panel promises at the bottom, when the shop wording does not fit. */
export const DEFAULT_LIVE_NOTE =
  "架空の店舗です。実際の注文・予約・支払いは発生せず、入力した内容はお使いのブラウザの中だけに保存されます。";

export const liveRoutes: Record<
  string,
  { lead: string; routes: LiveRoute[]; note?: string }
> = {
  csv: {
    lead: "この制作例には、実際に使える業務ツールがあります。CSVを読み込み、列の意味を一度決めて保存すると、次のファイルからは質問なしで集計し、前回との差と読み取れなかった行だけを示します。読み取れない行はその場で直せます。ファイルは端末から出ません。",
    routes: [
      {
        href: "/report",
        label: "REPORT FLOW を開く",
        detail: "サンプル3週分・手元のCSVどちらでも",
      },
      {
        href: "/report/recipes",
        label: "保存したルールを見る",
        detail: "列の対応・通貨・重複条件・版",
      },
      {
        href: "/report/history",
        label: "処理の履歴を見る",
        detail: "合計・集計件数・例外の数",
      },
    ],
    note: "架空の店舗ではなく、道具です。読み込んだファイルはこの端末から出ず、サーバーへの送信も外部サービスへの連携もありません。作ったルールと履歴はブラウザの中だけに保存されます。",
  },
  automation: {
    lead: "この制作例には、同じ実行基盤を契約の粒度で見る技術画面があります。抽出の根拠が原文のどこか、実行計画のハッシュと冪等キー、承認が何に紐づくか、失敗と「結果が分からない」の違い、再実行がどう扱われるかを、同じ 1 回の実行で追えます。",
    routes: [
      {
        href: "/automation",
        label: "技術画面を開く",
        detail: "計画・承認・冪等性・失敗・再実行",
      },
      {
        href: "/demos/inbox",
        label: "運用側の画面を見る",
        detail: "確認済みの案件が届くところ",
      },
    ],
    note: "実行は端末内の模擬アダプターに対して行います。メール送信や予約確定など外へ出る操作は、計画と承認までで実行されません。任意のコード実行も、任意のURL取得もありません。",
  },
  ec: {
    lead: "この制作例には、実際に操作できる店舗サイトがあります。色やサイズを選ぶと写真・価格・在庫が連動し、カートから送料を含めた金額を確認して注文できます。運営画面では在庫を動かし、注文を進め、未払いのまま発送できないことも確かめられます。",
    routes: [
      {
        href: "/forme",
        label: "店舗サイトを開く",
        detail: "FORME（架空店舗）のトップ",
      },
      {
        href: "/forme/items",
        label: "商品を選んで買う",
        detail: "6 品・絞り込み・比較・お気に入り",
      },
      {
        href: "/forme/my",
        label: "注文とお気に入りを見る",
        detail: "注文の状況・支払・取消",
      },
      {
        href: "/forme/admin",
        label: "運営画面を見る",
        detail: "在庫の増減・取り扱い停止・発送・売上",
      },
    ],
  },
  cafe: {
    lead: "この制作例には、実際に操作できる店舗サイトがあります。メニューを選んでカートに入れ、受取時間を決めて注文し、席を予約して変更まで行えます。運営側の画面では、同じ記録を店の立場から動かせます。",
    routes: [
      {
        href: "/kissa",
        label: "店舗サイトを開く",
        detail: "KISSA（架空店舗）のトップ",
      },
      {
        href: "/kissa/menu",
        label: "メニューから注文する",
        detail: "14 品・温度やサイズの選択・カート",
      },
      {
        href: "/kissa/reserve",
        label: "席を予約する",
        detail: "空席の確認・仮押さえ・確定",
      },
      {
        href: "/kissa/admin",
        label: "運営画面を見る",
        detail: "注文の進行・席の状況・売り切れの切り替え",
      },
    ],
  },
};

/**
 * The single entry a card or a list can offer. Cards have room for one link,
 * not four, and the first route is always the shop's front door.
 */
export function workingEntry(slug: string): LiveRoute | null {
  return liveRoutes[slug]?.routes[0] ?? null;
}
