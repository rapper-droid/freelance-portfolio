"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { PortfolioEvent } from "@/lib/analytics";
let session: { id: string; source: string; created: number } | undefined;
function visitContext() {
  if (!session || Date.now() - session.created > 1800000) {
    try {
      const previous = JSON.parse(
        sessionStorage.getItem("portfolio-visit") || "null",
      );
      if (previous && Date.now() - previous.created < 1800000)
        session = previous;
    } catch {
      /* Session storage may be unavailable. */
    }
    if (!session || Date.now() - session.created > 1800000) {
      const source = new URLSearchParams(location.search).get("utm_source");
      session = {
        id: crypto.randomUUID(),
        source:
          source === "crowdworks" || source === "lancers"
            ? source
            : source
              ? "other"
              : "direct",
        created: Date.now(),
      };
      try {
        sessionStorage.setItem("portfolio-visit", JSON.stringify(session));
      } catch {}
    }
  }
  return { session: session.id, source: session.source };
}
export function track(
  event: PortfolioEvent,
  ids: { category?: string; project?: string } = {},
) {
  if (
    process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== "true" ||
    navigator.doNotTrack === "1" ||
    (navigator as Navigator & { globalPrivacyControl?: boolean })
      .globalPrivacyControl
  )
    return;
  const payload = {
    event,
    ...visitContext(),
    ...(ids.category ? { category: ids.category } : {}),
    ...(ids.project ? { project: ids.project } : {}),
  };

  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
    credentials: "omit",
  }).catch(() => {});
}
export function Analytics() {
  const pathname = usePathname();
  useEffect(() => {
    const [, kind, id] = pathname.split("/");
    const ids =
      kind === "works"
        ? { category: id }
        : kind === "projects"
          ? { project: id }
          : {};
    track("portfolio_visit", ids);
    if (kind === "works") track("portfolio_category_view", ids);
    if (kind === "projects") track("portfolio_project_open", ids);
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          track("portfolio_delivery_info_view", ids);
          track("portfolio_price_view", ids);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    const delivery = document.querySelector(
      "[data-delivery-info], .price-grid",
    );
    if (delivery) observer.observe(delivery);
    function click(e: MouseEvent) {
      if ((e.target as Element)?.closest?.('a[href$="#contact"]'))
        track("portfolio_contact_open", ids);
      const link = (e.target as Element)?.closest?.("a[data-live-demo]");
      if (link)
        track("portfolio_live_demo_click", {
          project: link.getAttribute("data-live-demo") ?? undefined,
        });
    }
    document.addEventListener("click", click);
    return () => {
      observer.disconnect();
      document.removeEventListener("click", click);
    };
  }, [pathname]);
  return null;
}
