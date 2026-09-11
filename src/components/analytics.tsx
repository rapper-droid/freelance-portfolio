"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { PortfolioEvent } from "@/lib/analytics";
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
    if (kind === "works") track("portfolio_category_view", ids);
    if (kind === "projects") track("portfolio_project_open", ids);
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          track("portfolio_delivery_info_view", ids);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    const delivery = document.querySelector("[data-delivery-info]");
    if (delivery) observer.observe(delivery);
    function click(e: MouseEvent) {
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
