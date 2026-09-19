"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { ContactLink } from "./contact-link";

const sections = [
  ["/works#works", "制作例", "WORKS"],
  ["/works#services", "サービス", "SERVICES"],
  ["/works#pricing", "料金", "PRICE"],
  ["/works#process", "進め方", "PROCESS"],
  ["/works#faq", "よくある質問", "FAQ"],
] as const;

const parent = [
  ["/", "TSUDOWA ホーム"],
  ["/lab", "TSUKUTTA LAB"],
  ["/history", "BUILD LOG"],
] as const;

/**
 * TETSU WORKS navigation. Desktop shows the sections inline; below 1024px a
 * native <details> menu keeps every destination reachable without
 * JavaScript. The contact CTA stays visible at every width.
 */
export function WorksNavigation() {
  const menu = useRef<HTMLDetailsElement>(null);
  const path = usePathname();
  const shownPath = useRef(path);
  useEffect(() => {
    // Close after a client navigation only: a menu opened while the page was
    // still hydrating must stay open.
    if (shownPath.current === path) return;
    shownPath.current = path;
    if (menu.current) menu.current.open = false;
  }, [path]);
  useEffect(() => {
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape" && menu.current?.open) {
        menu.current.open = false;
        menu.current.querySelector("summary")?.focus();
      }
    }
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, []);
  return (
    <>
      <nav className="works-nav" aria-label="TETSU WORKS メインナビゲーション">
        {sections.map(([href, label]) => (
          <Link key={href} href={href} prefetch={false}>
            {label}
          </Link>
        ))}
      </nav>
      <ContactLink className="nav-cta">
        相談する <ArrowUpRight size={16} aria-hidden="true" />
      </ContactLink>
      <details
        className="works-menu"
        ref={menu}
        onClick={(event) => {
          if ((event.target as Element).closest("a") && menu.current)
            menu.current.open = false;
        }}
      >
        <summary aria-label="メニュー">
          <span>MENU</span>
          <i aria-hidden="true" />
        </summary>
        <div className="works-menu-panel">
          <nav aria-label="TETSU WORKS モバイルナビゲーション">
            {sections.map(([href, label, en]) => (
              <Link key={href} href={href} prefetch={false}>
                {label}
                <small lang="en">{en}</small>
              </Link>
            ))}
          </nav>
          <nav className="works-menu-parent" aria-label="TSUDOWA">
            {parent.map(([href, label]) => (
              <Link key={href} href={href} prefetch={false}>
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </details>
    </>
  );
}
