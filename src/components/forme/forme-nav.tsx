"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, ShoppingBag } from "lucide-react";
import { useForme } from "./forme-provider";
import { cartTotals } from "@/lib/forme/cart";

/**
 * FORME's navigation, with a cart count that agrees with the cart.
 *
 * Rendered as zero until the stored cart has been read, so the server and the
 * browser produce the same markup; the count is announced politely as well as
 * shown, because "did that go in?" is the question a badge exists to answer.
 */
const LINKS = [
  { href: "/forme", label: "トップ" },
  { href: "/forme/items", label: "商品一覧" },
  { href: "/forme/my", label: "注文・お気に入り" },
];

export function FormeNav() {
  const pathname = usePathname();
  const { state, ready } = useForme();
  const { count } = cartTotals(state.cart);
  const favourites = ready ? state.favourites.length : 0;

  return (
    <header className="forme-header">
      <div className="forme-header-inner">
        <Link href="/forme" className="forme-logo">
          FORME
          <span>OBJECTS</span>
        </Link>
        <nav aria-label="店内">
          <ul>
            {LINKS.map((link) => {
              const active =
                link.href === "/forme"
                  ? pathname === "/forme"
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
        <div className="forme-header-actions">
          <Link href="/forme/my" className="forme-header-count">
            <Heart size={16} aria-hidden="true" />
            <span aria-hidden="true">{favourites}</span>
            <span className="sr-only">お気に入り {favourites} 件</span>
          </Link>
          <Link href="/forme/cart" className="forme-cart-link">
            <ShoppingBag size={16} aria-hidden="true" />
            <span className="forme-cart-count" aria-hidden="true">
              {ready ? count : 0}
            </span>
            <span className="sr-only" role="status">
              {ready ? `カートに ${count} 点` : "カートを読み込み中"}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
