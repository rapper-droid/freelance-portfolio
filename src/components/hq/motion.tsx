"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** Decoration only: content, destinations and focus never wait for animation. */
export function HqMotion() {
  const pathname = usePathname();
  useEffect(() => {
    const hero = document.querySelector<HTMLElement>(".hq-assembly");
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stop = () => {
      if (timer) clearTimeout(timer);
      hero?.removeAttribute("data-arrival");
    };
    if (hero && !media.matches) {
      try {
        if (!sessionStorage.getItem("tsudowa-hq-arrival-v1")) {
          sessionStorage.setItem("tsudowa-hq-arrival-v1", "seen");
          hero.setAttribute("data-arrival", "once");
          timer = setTimeout(stop, 1650);
        }
      } catch {
        /* Storage denied: keep the static, complete composition. */
      }
    }
    media.addEventListener("change", stop);
    return () => {
      stop();
      media.removeEventListener("change", stop);
    };
  }, [pathname]);
  return null;
}

export function HqNavigation() {
  const menu = useRef<HTMLDetailsElement>(null);
  const path = usePathname();
  useEffect(() => {
    if (menu.current) menu.current.open = false;
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape" && menu.current?.open) {
        menu.current.open = false;
        menu.current.querySelector("summary")?.focus();
      }
    }
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [path]);
  const links = (
    <>
      <Link prefetch={false} href="/works">
        WORKS <span>制作を頼む</span>
      </Link>
      <Link prefetch={false} href="/lab">
        LAB <span>別の世界をのぞく</span>
      </Link>
      <Link prefetch={false} href="/history">
        BUILD LOG <span>制作の記録</span>
      </Link>
      <Link prefetch={false} href="/#contact">
        CONTACT <span>問い合わせ</span>
      </Link>
    </>
  );
  return (
    <>
      <nav className="hq-nav" aria-label="TSUDOWA メインナビゲーション">
        {links}
      </nav>
      <details
        className="hq-mobile-menu"
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
        <nav aria-label="モバイルナビゲーション">{links}</nav>
      </details>
    </>
  );
}
