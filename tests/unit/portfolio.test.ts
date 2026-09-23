import { describe, it, expect } from "vitest";
import { categories, projects, projectsFor } from "../../src/lib/portfolio";
import {
  bookingSeedFor,
  bookingWeek,
  bookingWeekday,
  validateBooking,
  qaItems,
  deliveryManifest,
  creativeSvg,
} from "../../src/lib/showcase";
import { safeEvent, posthogPayload } from "../../src/lib/analytics";
import { redactError } from "../../src/lib/monitoring";
describe("catalog routes", () => {
  it("covers all required categories with valid projects", () => {
    expect(categories).toHaveLength(12);
    expect(new Set(projects.map((p) => p.slug)).size).toBe(projects.length);
    expect(projects.filter((p) => p.featured)).toHaveLength(8);
    for (const c of categories)
      expect(projectsFor(c.id).length).toBeGreaterThan(0);
    for (const p of projects) {
      expect(
        p.categories.every((id) => categories.some((c) => c.id === id)),
      ).toBe(true);
      expect(p.deliverables.length).toBeGreaterThan(0);
      expect(p.limitation.length).toBeGreaterThan(0);
    }
  });
});
describe("booking conflicts", () => {
  // Any instant works: the week is derived from it, so the test is not
  // pinned to a calendar that expires.
  const NOW = "2026-09-23T01:00:00.000Z";
  const week = bookingWeek(NOW);
  const rows = bookingSeedFor(NOW);

  it("rejects occupied slots and invalid input", () => {
    const base = {
      date: week[0],
      time: "10:00",
      name: "テスト",
      service: "スタジオ利用",
    };
    expect(validateBooking(rows, base, NOW)).toContain("予約があります");
    expect(validateBooking(rows, { ...base, time: "12:00" }, NOW)).toBe("");
    expect(validateBooking(rows, { ...base, name: " " }, NOW)).not.toBe("");
    expect(
      validateBooking(rows, { ...base, date: "2026-10-18" }, NOW),
    ).not.toBe("");
    expect(validateBooking(rows, { ...base, time: "25:00" }, NOW)).not.toBe("");
  });

  it("follows the calendar instead of a fixed week", () => {
    // The demo is judged from whenever it is opened, so today must be the
    // first day on offer and a year later must produce a different week.
    expect(week[0]).toBe("2026-09-23");
    expect(week).toHaveLength(7);
    expect(bookingWeekday("2026-09-23")).toBe("WED");
    expect(bookingWeek("2027-03-02T01:00:00.000Z")[0]).toBe("2027-03-02");
  });

  it("places its sample bookings inside the week it shows", () => {
    for (const row of rows) expect(week).toContain(row.date);
  });
});
describe("delivery and creative output", () => {
  it("does not release an incomplete manifest", () => {
    expect(() => deliveryManifest(qaItems.slice(1))).toThrow();
    expect(deliveryManifest(qaItems).kind).toBe("SELF-INITIATED DEMO");
  });
  it("exports bounded original SVG in each format", () => {
    expect(creativeSvg(0, "portrait")).toContain('height="1920"');
    expect(creativeSvg(2, "landscape")).toContain('height="630"');
    expect(creativeSvg(99, "<script>")).not.toContain("<script>");
  });
});
describe("privacy boundaries", () => {
  it("only accepts known events and public IDs", () => {
    expect(safeEvent({ event: "identify" })).toBeNull();
    expect(
      safeEvent({ event: "portfolio_project_open", project: "private-email" }),
    ).toBeNull();
    expect(
      safeEvent({
        event: "portfolio_category_view",
        category: "lp",
        text: "private",
      }),
    ).toEqual({ event: "portfolio_category_view", category: "lp" });
  });
  it("builds a personless event without input data", () => {
    const payload = posthogPayload(
      { event: "portfolio_copy_contact_message", message: "private" },
      "test-key",
      "random-id",
    );
    expect(JSON.stringify(payload)).not.toContain("private");
    expect(payload?.properties.$process_person_profile).toBe(false);
    expect(payload?.properties.$ip).toBe("0.0.0.0");
  });
  it("reconstructs Sentry events without messages, URLs or user data", () => {
    const event = {
      event_id: "id",
      message: "private",
      user: { email: "private" },
      request: { url: "private" },
      extra: { text: "private" },
      exception: {
        values: [
          {
            type: "TypeError",
            value: "private",
            stacktrace: {
              frames: [
                {
                  filename:
                    "https://example.test/_next/static/chunks/app.js?private",
                  lineno: 10,
                },
                { filename: "https://private.test/secret" },
              ],
            },
          },
        ],
      },
    };
    const result = redactError(event);
    expect(JSON.stringify(result)).not.toContain("private");
    expect(JSON.stringify(result)).not.toContain("https://");
    expect(result.exception.values[0].stacktrace.frames[0].filename).toBe(
      "app.js",
    );
  });
});
