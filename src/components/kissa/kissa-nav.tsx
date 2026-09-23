"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useShop } from "./shop-provider";
import { cartTotals } from "@/lib/shop/cart";

/**
 * The shop's navigation, with a live cart count.
 *
 * The count comes from the same cart the order screen checks out, so it is
 * never a badge that agrees with nothing. It is announced politely rather than
 * only changing colour, because "did that go in?" is the question a cart badge
 * exists to answer (指示書 §21).
 */
const LINKS = [
  { href: "/kissa", label: "店舗トップ" },
  { href: "/kissa/menu", label: "メニュー" },
  { href: "/kissa/reserve", label: "席の予約" },
  { href: "/kissa/my", label: "注文・予約の確認" },
];

export function KissaNav() {
  const pathname = usePathname();
  const { state, ready } = useShop();
  const { count } = cartTotals(state.cart);

  return (
    <header className="kissa-header">
      <div className="kissa-header-inner">
        <Link href="/kissa" className="kissa-logo">
          KISSA
          <span>喫茶と焙煎</span>
        </Link>
        <nav aria-label="店舗内">
          <ul>
            {LINKS.map((link) => {
              const active =
                link.href === "/kissa"
                  ? pathname === "/kissa"
                  : pathname.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <Link href="/kissa/order" className="kissa-cart-link">
          カート
          {/* Rendered only after the stored cart is read, so the server and
              client markup agree on first paint. */}
          <span className="kissa-cart-count" aria-hidden="true">
            {ready ? count : 0}
          </span>
          <span className="sr-only" role="status">
            {ready ? `カートに ${count} 点` : "カートを読み込み中"}
          </span>
        </Link>
      </div>
    </header>
  );
}
