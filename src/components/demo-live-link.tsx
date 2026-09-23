import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import "./demo-live-link.css";

/**
 * The bridge from a showcase demo to its working version (指示書 §10, §13).
 *
 * Some demos are a look; one of them is a shop you can actually order from.
 * Leaving the working version to be discovered would waste the only thing
 * that separates it from a screenshot, so the demo page says where it is and
 * what can be done there — including the operator's side, which is the half a
 * visitor would never guess exists.
 */

export type LiveRoute = { href: string; label: string; detail: string };

export const liveRoutes: Record<string, { lead: string; routes: LiveRoute[] }> =
  {
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

export function DemoLiveLink({ slug }: { slug: string }) {
  const live = liveRoutes[slug];
  if (!live) return null;

  return (
    <section className="demo-live" aria-labelledby="demo-live-heading">
      <div className="demo-live-inner">
        <p className="demo-live-kicker">
          <span lang="en">WORKING VERSION</span> / 操作できる版
        </p>
        <h2 id="demo-live-heading">画面を動かして試せます</h2>
        <p className="demo-live-lead">{live.lead}</p>
        <ul className="demo-live-routes">
          {live.routes.map((route) => (
            <li key={route.href}>
              <Link href={route.href}>
                <strong>
                  {route.label}
                  <ArrowUpRight size={15} aria-hidden="true" />
                </strong>
                <span>{route.detail}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="demo-live-note">
          架空の店舗です。実際の注文・予約・支払いは発生せず、入力した内容は
          お使いのブラウザの中だけに保存されます。
        </p>
      </div>
    </section>
  );
}
