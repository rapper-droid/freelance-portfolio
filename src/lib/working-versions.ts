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

export const liveRoutes: Record<string, { lead: string; routes: LiveRoute[] }> =
  {
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
