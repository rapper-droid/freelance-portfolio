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
          source === "crowdworks" ||
          source === "lancers" ||
          source === "coconala"
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
  ids: { category?: string; project?: string; offer?: string } = {},
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
    ...(ids.offer ? { offer: ids.offer } : {}),
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
    if (
      process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== "true" ||
      navigator.doNotTrack === "1" ||
      (navigator as Navigator & { globalPrivacyControl?: boolean })
        .globalPrivacyControl
    )
      return;
    const [, kind, id] = pathname.split("/");
    const ids =
      kind === "works"
        ? { category: id }
        : kind === "projects"
          ? { project: id }
          : kind === "services" && id
            ? { offer: id }
            : {};
    track("portfolio_visit", ids);
    if (kind === "services" && id) track("service_view", ids);
    if (kind === "works" && id) track("portfolio_category_view", ids);
    if (kind === "projects") track("portfolio_project_open", ids);
    const seen = new Set<PortfolioEvent>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const events: PortfolioEvent[] = [];
          if (entry.target.hasAttribute("data-delivery-info"))
            events.push("portfolio_delivery_info_view");
          if (entry.target.hasAttribute("data-price-info"))
            events.push("portfolio_price_view");
          for (const event of events) {
            if (!seen.has(event)) {
              track(event, ids);
              seen.add(event);
            }
          }
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.2 },
    );
    document
      .querySelectorAll("[data-delivery-info], [data-price-info]")
      .forEach((el) => observer.observe(el));
    function click(e: MouseEvent) {
      if ((e.target as Element)?.closest?.('a[href$="#contact"]'))
        track("portfolio_contact_open", ids);
      const link = (e.target as Element)?.closest?.("a[data-live-demo]");
      if (link)
        track("portfolio_live_demo_click", {
          project: link.getAttribute("data-live-demo") ?? undefined,
        });
      const working = (e.target as Element)?.closest?.(
        "a[data-working-version]",
      );
      if (working)
        track("portfolio_working_version_click", {
          project: working.getAttribute("data-working-version") ?? undefined,
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
