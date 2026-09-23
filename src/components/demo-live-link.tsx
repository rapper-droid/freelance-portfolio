import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { liveRoutes } from "@/lib/working-versions";
import "./demo-live-link.css";

/**
 * The bridge from a showcase demo to its working version (指示書 §10, §13).
 *
 * Some demos are a look; two of them are shops you can actually order from.
 * Leaving the working version to be discovered would waste the only thing
 * that separates it from a screenshot, so the demo page says where it is and
 * what can be done there — including the operator's side, which is the half a
 * visitor would never guess exists.
 *
 * The routes themselves live in `@/lib/working-versions`, because the card on
 * /works and the catalogue's own honesty tests need the same list.
 */

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
          {
            "架空の店舗です。実際の注文・予約・支払いは発生せず、入力した内容はお使いのブラウザの中だけに保存されます。"
          }
        </p>
      </div>
    </section>
  );
}
