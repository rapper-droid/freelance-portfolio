export type Customer = {
  id: string;
  name: string;
  contact: string;
  status: "見込み" | "取引中" | "休止";
  revenue: number;
};
export type History = { id: string; text: string; at: string };
export type AdminData = { customers: Customer[]; history: History[] };
export const initialAdmin: AdminData = {
  customers: [
    {
      id: "C001",
      name: "サンプルデザイン",
      contact: "デモ担当A",
      status: "取引中",
      revenue: 30000,
    },
    {
      id: "C002",
      name: "架空商店",
      contact: "デモ担当B",
      status: "取引中",
      revenue: 15000,
    },
    {
      id: "C003",
      name: "デモ制作室",
      contact: "デモ担当C",
      status: "見込み",
      revenue: 0,
    },
    {
      id: "C004",
      name: "サンプル企画",
      contact: "デモ担当D",
      status: "取引中",
      revenue: 25000,
    },
    {
      id: "C005",
      name: "架空ラボ",
      contact: "デモ担当E",
      status: "休止",
      revenue: 10000,
    },
    {
      id: "C006",
      name: "デモワークス",
      contact: "デモ担当F",
      status: "見込み",
      revenue: 0,
    },
  ],
  history: [],
};
export function isAdminData(value: unknown): value is AdminData {
  if (!value || typeof value !== "object") return false;
  const d = value as AdminData;
  return (
    Array.isArray(d.customers) &&
    d.customers.length <= 1000 &&
    d.customers.every(
      (c) =>
        c &&
        typeof c.id === "string" &&
        c.id.length > 0 &&
        typeof c.name === "string" &&
        c.name.trim().length > 0 &&
        c.name.length <= 80 &&
        typeof c.contact === "string" &&
        c.contact.trim().length > 0 &&
        c.contact.length <= 80 &&
        ["見込み", "取引中", "休止"].includes(c.status) &&
        Number.isInteger(c.revenue) &&
        c.revenue >= 0 &&
        c.revenue <= 999999999,
    ) &&
    new Set(d.customers.map((c) => c.id)).size === d.customers.length &&
    Array.isArray(d.history) &&
    d.history.length <= 30 &&
    d.history.every(
      (h) =>
        h &&
        typeof h.id === "string" &&
        typeof h.text === "string" &&
        typeof h.at === "string" &&
        Number.isFinite(Date.parse(h.at)),
    )
  );
}
