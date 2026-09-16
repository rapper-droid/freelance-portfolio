"use client";
import { useEffect } from "react";

/**
 * TANEBI signature effects runtime.
 *
 * Two jobs only: mark elements as they first enter the viewport, and track
 * the pointer for the hero's warm glow. Everything visual lives in CSS.
 *
 * FAIL-SAFE BY CONSTRUCTION. Content is visible by default; the hidden
 * pre-reveal state exists only while <html data-reveal-ready="on">, and this file
 * is the only thing that sets that attribute. If the script never runs, is
 * blocked, or throws, every section simply renders as static content. That
 * ordering matters more than the effect does — a scroll animation that fails
 * closed leaves a blank page, and this is a site people are meant to hire
 * someone through.
 */
export function Effects() {
  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    // Reveal ------------------------------------------------------------
    let observer: IntersectionObserver | null = null;

    const startReveal = () => {
      if (observer || reduced.matches) return;
      const targets = document.querySelectorAll<HTMLElement>("[data-reveal]");
      if (targets.length === 0) return;
      root.setAttribute("data-reveal-ready", "on");
      observer = new IntersectionObserver(
        (entries, obs) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add("is-in");
            // Once. Section 26.5: re-firing on every scroll direction change
            // is what makes this kind of page feel like a template.
            obs.unobserve(entry.target);
          }
        },
        { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
      );
      targets.forEach((t) => observer!.observe(t));
    };

    const stopReveal = () => {
      observer?.disconnect();
      observer = null;
      root.removeAttribute("data-reveal-ready");
      // Anything still waiting becomes visible immediately rather than
      // staying hidden because the preference changed mid-scroll.
      document
        .querySelectorAll<HTMLElement>("[data-reveal]")
        .forEach((t) => t.classList.add("is-in"));
    };

    // Hero pointer glow -------------------------------------------------
    // Desktop pointers only: on touch there is no hover, and a glow that
    // follows taps reads as a rendering fault.
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let hero: HTMLElement | null = null;
    let frame = 0;
    let pending: { x: number; y: number } | null = null;

    const paint = () => {
      frame = 0;
      if (!hero || !pending) return;
      hero.style.setProperty("--pointer-x", `${pending.x}%`);
      hero.style.setProperty("--pointer-y", `${pending.y}%`);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!hero) return;
      const r = hero.getBoundingClientRect();
      pending = {
        x: ((e.clientX - r.left) / r.width) * 100,
        y: ((e.clientY - r.top) / r.height) * 100,
      };
      // One write per frame. Reading layout on every pointermove, or setting
      // React state, is how this effect would start costing real frames.
      if (!frame) frame = requestAnimationFrame(paint);
    };

    const startPointer = () => {
      if (hero || reduced.matches || !finePointer.matches) return;
      hero = document.querySelector<HTMLElement>(".sales-hero");
      if (!hero) return;
      hero.setAttribute("data-pointer", "on");
      hero.addEventListener("pointermove", onPointerMove, { passive: true });
    };

    const stopPointer = () => {
      if (!hero) return;
      hero.removeEventListener("pointermove", onPointerMove);
      hero.removeAttribute("data-pointer");
      hero.style.removeProperty("--pointer-x");
      hero.style.removeProperty("--pointer-y");
      hero = null;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };

    const apply = () => {
      if (reduced.matches) {
        stopReveal();
        stopPointer();
      } else {
        startReveal();
        startPointer();
      }
    };

    apply();
    reduced.addEventListener("change", apply);
    finePointer.addEventListener("change", apply);

    return () => {
      reduced.removeEventListener("change", apply);
      finePointer.removeEventListener("change", apply);
      observer?.disconnect();
      observer = null;
      root.removeAttribute("data-reveal-ready");
      stopPointer();
    };
  }, []);

  return null;
}
