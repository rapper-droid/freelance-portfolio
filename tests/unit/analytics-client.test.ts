import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
const state = vi.hoisted(() => ({
  pathname: "/",
  effect: undefined as undefined | (() => void | (() => void)),
}));
vi.mock("react", () => ({
  useEffect: (effect: typeof state.effect) => {
    state.effect = effect;
  },
}));
vi.mock("next/navigation", () => ({ usePathname: () => state.pathname }));
import { Analytics } from "../../src/components/analytics";

describe("sales funnel client visibility and privacy", () => {
  let notify: (
    entries: {
      isIntersecting: boolean;
      target: { hasAttribute: (s: string) => boolean };
    }[],
  ) => void;
  let cleanup: void | (() => void);
  const fetchMock = vi.fn().mockResolvedValue({ ok: true });
  const storage = vi.fn();
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_ANALYTICS_ENABLED", "true");
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("navigator", { doNotTrack: "0" });
    vi.stubGlobal("location", {
      search: "?utm_source=crowdworks&private=do-not-send",
    });
    vi.stubGlobal("sessionStorage", { getItem: () => null, setItem: storage });
    vi.stubGlobal("document", {
      querySelectorAll: vi.fn(() => []),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: typeof notify) {
          notify = cb;
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    fetchMock.mockClear();
    storage.mockClear();
    state.pathname = "/";
  });
  afterEach(() => {
    cleanup?.();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
  function mount(path = "/") {
    state.pathname = path;
    Analytics();
    cleanup = state.effect?.();
  }
  function visible(attribute: string, isIntersecting = true) {
    notify([
      { isIntersecting, target: { hasAttribute: (s) => s === attribute } },
    ]);
  }
  function payloads() {
    return fetchMock.mock.calls.map((c) => JSON.parse(c[1].body));
  }
  it("measures price and delivery separately, once each, only when visible", () => {
    mount();
    visible("data-price-info", false);
    expect(payloads().map((p) => p.event)).toEqual(["portfolio_visit"]);
    visible("data-price-info");
    visible("data-price-info");
    visible("data-delivery-info");
    visible("data-delivery-info");
    expect(payloads().map((p) => p.event)).toEqual([
      "portfolio_visit",
      "portfolio_price_view",
      "portfolio_delivery_info_view",
    ]);
    expect(payloads().every((p) => p.source === "crowdworks")).toBe(true);
    expect(JSON.stringify(payloads())).not.toContain("do-not-send");
  });
  it("distinguishes all works from category and project landings", () => {
    mount("/works");
    expect(payloads().map((p) => p.event)).toEqual(["portfolio_visit"]);
    cleanup?.();
    fetchMock.mockClear();
    mount("/works/lp");
    expect(payloads().map((p) => [p.event, p.category])).toEqual([
      ["portfolio_visit", "lp"],
      ["portfolio_category_view", "lp"],
    ]);
    cleanup?.();
    fetchMock.mockClear();
    mount("/projects/inbox");
    expect(payloads().map((p) => [p.event, p.project])).toEqual([
      ["portfolio_visit", "inbox"],
      ["portfolio_project_open", "inbox"],
    ]);
  });
  it("counts the showcase demo and the working shop as different clicks", () => {
    // The card for KISSA carries both links. Folding them into one event would
    // hide the only number that says whether anyone reaches the real shop.
    mount("/works");
    const handler = (
      document.addEventListener as unknown as {
        mock: { calls: [string, (e: { target: unknown }) => void][] };
      }
    ).mock.calls.find(([type]) => type === "click")![1];

    // A click whose nearest matching ancestor carries only this attribute.
    const clicked = (attribute: string, slug: string) => ({
      target: {
        closest: (selector: string) =>
          selector.includes(attribute) ? { getAttribute: () => slug } : null,
      },
    });

    handler(clicked("data-live-demo", "cafe"));
    handler(clicked("data-working-version", "cafe"));
    expect(payloads().map((p) => [p.event, p.project])).toEqual([
      ["portfolio_visit", undefined],
      ["portfolio_live_demo_click", "cafe"],
      ["portfolio_working_version_click", "cafe"],
    ]);
  });
  it.each(["disabled", "dnt", "gpc"])(
    "does not send or store when %s",
    (mode) => {
      if (mode === "disabled")
        vi.stubEnv("NEXT_PUBLIC_ANALYTICS_ENABLED", "false");
      else
        vi.stubGlobal(
          "navigator",
          mode === "dnt" ? { doNotTrack: "1" } : { globalPrivacyControl: true },
        );
      mount();
      expect(document.querySelectorAll).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
      expect(storage).not.toHaveBeenCalled();
    },
  );
});
