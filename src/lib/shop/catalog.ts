import type { Money } from "@/lib/runtime/rules/money";
import type { Product, ProductCategory, Seat, Variant } from "./types";

/**
 * KISSA's menu — the one source every screen reads (指示書 §10).
 *
 * The menu, the product page, the cart, the pickup slots and the operator
 * console all derive from this. Nothing keeps a second copy, so changing a
 * price or marking something sold out is visible everywhere at once rather
 * than in whichever array someone remembered to edit.
 *
 * Everything here is a fictional shop. Allergens are recorded only where this
 * fixture actually states them; nothing is inferred from a product's name or
 * its picture, and no nutrition or health claim is made (指示書 §10).
 */

const yen = (amount: number): Money => ({
  minorUnits: amount,
  scale: 0,
  currency: "JPY",
});

const FREE = yen(0);

/** Temperature is offered only by drinks that are genuinely made both ways. */
const hotIced = (): Variant[] => [
  {
    id: "temp-hot",
    axis: "temperature",
    label: "HOT",
    extra: FREE,
    saleState: "on_sale",
  },
  {
    id: "temp-ice",
    axis: "temperature",
    label: "ICED",
    extra: FREE,
    saleState: "on_sale",
  },
];

const sizes = (large: number): Variant[] => [
  {
    id: "size-r",
    axis: "size",
    label: "レギュラー",
    extra: FREE,
    saleState: "on_sale",
  },
  {
    id: "size-l",
    axis: "size",
    label: "ラージ",
    extra: yen(large),
    saleState: "on_sale",
  },
];

const milkAddon = (): Variant[] => [
  {
    id: "addon-oat",
    axis: "addon",
    label: "オーツミルクに変更",
    extra: yen(60),
    saleState: "on_sale",
  },
];

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  coffee: "コーヒー",
  tea: "お茶",
  food: "フード",
  dessert: "デザート",
  seasonal: "季節のおすすめ",
};

export const OPEN_MINUTE = 8 * 60;
export const CLOSE_MINUTE = 19 * 60;
/** Last order relative to closing. */
export const LAST_ORDER_MINUTE = CLOSE_MINUTE - 30;

export const products: readonly Product[] = [
  {
    id: "drip-house",
    category: "coffee",
    name: "ハウスドリップ",
    summary: "浅煎りの酸味をやわらげた、毎日飲める一杯。",
    description:
      "中深煎りのブレンドを、湯温を落としてゆっくり落としています。冷めても輪郭が残るよう、粉はやや粗挽き。ミルクを足しても負けません。",
    price: yen(480),
    variants: [...hotIced(), ...sizes(80)],
    saleState: "on_sale",
    prepMinutes: 4,
    order: 10,
    artId: "drip-house",
    allergens: [],
    caffeine: "regular",
  },
  {
    id: "latte",
    category: "coffee",
    name: "カフェラテ",
    summary: "ミルクの甘みを主役にした、やさしい濃度。",
    description:
      "エスプレッソは短めに抽出し、60℃台で仕上げたミルクと合わせています。オーツミルクへの変更もできます。",
    price: yen(560),
    variants: [...hotIced(), ...sizes(80), ...milkAddon()],
    saleState: "on_sale",
    prepMinutes: 5,
    order: 20,
    artId: "latte",
    allergens: ["乳"],
    caffeine: "regular",
  },
  {
    id: "espresso",
    category: "coffee",
    name: "エスプレッソ",
    summary: "短く落として、余韻を長く。",
    description:
      "その日の豆に合わせて抽出時間を調整しています。砂糖を添えてお出しします。",
    price: yen(420),
    // No temperature axis: this is served one way.
    variants: [],
    saleState: "on_sale",
    prepMinutes: 3,
    order: 30,
    artId: "espresso",
    allergens: [],
    caffeine: "regular",
  },
  {
    id: "cold-brew",
    category: "coffee",
    name: "水出しコーヒー",
    summary: "一晩かけて落とした、角のない苦み。",
    description:
      "16時間かけて水出ししています。氷が溶けても薄まりにくい濃度で作り置きしています。",
    price: yen(540),
    variants: sizes(80),
    saleState: "on_sale",
    prepMinutes: 2,
    order: 40,
    artId: "cold-brew",
    allergens: [],
    caffeine: "regular",
  },
  {
    id: "hojicha-latte",
    category: "tea",
    name: "ほうじ茶ラテ",
    summary: "香ばしさとミルクの、落ち着いた甘さ。",
    description:
      "自家焙煎のほうじ茶を濃いめに出し、ミルクと合わせています。甘さは控えめです。",
    price: yen(540),
    variants: [...hotIced(), ...milkAddon()],
    saleState: "on_sale",
    prepMinutes: 5,
    order: 50,
    artId: "hojicha-latte",
    allergens: ["乳"],
    caffeine: "low",
  },
  {
    id: "sencha",
    category: "tea",
    name: "煎茶",
    summary: "一煎目は低温で、二煎目は熱く。",
    description:
      "急須でお出しします。お湯のおかわりをお持ちしますので、二煎目まで楽しめます。",
    price: yen(460),
    variants: [],
    saleState: "on_sale",
    prepMinutes: 4,
    order: 60,
    artId: "sencha",
    allergens: [],
    caffeine: "low",
  },
  {
    id: "herbal-tea",
    category: "tea",
    name: "ハーブティー",
    summary: "カモミールとレモングラスの、軽い後味。",
    description:
      "ノンカフェインです。夕方以降にもおすすめしています。お湯のおかわりができます。",
    price: yen(500),
    variants: hotIced(),
    saleState: "on_sale",
    prepMinutes: 5,
    order: 70,
    artId: "herbal-tea",
    allergens: [],
    caffeine: "none",
  },
  {
    id: "toast-set",
    category: "food",
    name: "厚切りトーストセット",
    summary: "四枚切りを、バターと小さなサラダで。",
    description:
      "近所のパン屋の食パンを四枚切りで焼いています。バターとあんこを選べます。サラダが付きます。",
    price: yen(680),
    variants: [
      {
        id: "addon-butter",
        axis: "addon",
        label: "バター",
        extra: FREE,
        saleState: "on_sale",
      },
      {
        id: "addon-anko",
        axis: "addon",
        label: "あんこ",
        extra: yen(80),
        saleState: "on_sale",
      },
    ],
    saleState: "on_sale",
    prepMinutes: 8,
    // Breakfast only; the pickup slots respect this.
    servedFrom: 8 * 60,
    servedTo: 11 * 60,
    order: 80,
    artId: "toast-set",
    allergens: ["小麦", "乳"],
  },
  {
    id: "sandwich",
    category: "food",
    name: "玉子サンド",
    summary: "だし巻きを挟んだ、やわらかい一皿。",
    description:
      "だし巻き玉子を焼きたてで挟みます。作り置きをしないため、少しお時間をいただきます。",
    price: yen(780),
    variants: [],
    saleState: "on_sale",
    prepMinutes: 12,
    servedFrom: 11 * 60,
    order: 90,
    artId: "sandwich",
    allergens: ["小麦", "卵", "乳"],
  },
  {
    id: "curry",
    category: "food",
    name: "スパイスカレー",
    summary: "辛さより香り。数種類のスパイスを重ねて。",
    description:
      "鶏と玉ねぎを長めに煮込み、仕上げにスパイスを重ねています。辛さは控えめです。",
    price: yen(1080),
    variants: [],
    saleState: "on_sale",
    prepMinutes: 10,
    servedFrom: 11 * 60,
    servedTo: 15 * 60,
    order: 100,
    artId: "curry",
    allergens: ["乳"],
  },
  {
    id: "cheesecake",
    category: "dessert",
    name: "バスクチーズケーキ",
    summary: "表面は香ばしく、中はとろりと。",
    description:
      "高温で短時間焼いています。冷やしてお出ししますが、少し置くと口当たりが変わります。",
    price: yen(620),
    variants: [],
    saleState: "on_sale",
    prepMinutes: 3,
    order: 110,
    artId: "cheesecake",
    allergens: ["乳", "卵", "小麦"],
  },
  {
    id: "pudding",
    category: "dessert",
    name: "かためのプリン",
    summary: "蒸してしっかり、苦めのカラメルで。",
    description:
      "卵を多めに使い、すが立たない温度で蒸しています。カラメルは苦めです。",
    price: yen(520),
    variants: [],
    // Demonstrates the sold-out path end to end.
    saleState: "sold_out",
    prepMinutes: 2,
    order: 120,
    artId: "pudding",
    allergens: ["乳", "卵"],
  },
  {
    id: "seasonal-citrus",
    category: "seasonal",
    name: "季節の柑橘ソーダ",
    summary: "皮ごと搾った、澄んだ苦み。",
    description:
      "その時期の柑橘を皮ごと搾り、無糖のソーダで割っています。仕入れにより果実が変わります。",
    price: yen(620),
    variants: sizes(80),
    saleState: "on_sale",
    prepMinutes: 4,
    order: 130,
    artId: "seasonal-citrus",
    allergens: [],
    caffeine: "none",
  },
  {
    id: "seasonal-mont-blanc",
    category: "seasonal",
    name: "和栗のモンブラン",
    summary: "しぼりたてを、その場で。",
    description:
      "注文をいただいてから絞ります。数に限りがあり、なくなり次第終了します。",
    price: yen(880),
    variants: [],
    saleState: "on_sale",
    prepMinutes: 7,
    order: 140,
    artId: "seasonal-mont-blanc",
    allergens: ["乳", "卵"],
  },
] as const;

export const productById = (id: string) => products.find((p) => p.id === id);

export const variantById = (product: Product, id: string) =>
  product.variants.find((v) => v.id === id);

/** Seats the shop can actually offer, with the pairs that cannot coexist. */
export const seats: readonly Seat[] = [
  { id: "counter-1", label: "カウンター 1", capacity: 1 },
  { id: "counter-2", label: "カウンター 2", capacity: 1 },
  { id: "table-a", label: "テーブル A", capacity: 2 },
  { id: "table-b", label: "テーブル B", capacity: 2 },
  // The large table is made by joining A and B, so it excludes both.
  {
    id: "table-ab",
    label: "テーブル A+B（連結）",
    capacity: 4,
    conflictsWith: ["table-a", "table-b"],
  },
  { id: "window", label: "窓際ソファ", capacity: 3 },
] as const;

export const seatById = (id: string) => seats.find((s) => s.id === id);

/**
 * Opening hours as one statement every screen reads.
 *
 * Typed rather than `as const`: the day and date lists are membership sets, so
 * they need to accept any number or date string at the call site.
 */
export const HOURS: {
  openMinute: number;
  closeMinute: number;
  lastOrderMinute: number;
  /** 0 = Sunday. Closed Wednesdays. */
  businessDays: readonly number[];
  closedDates: readonly string[];
  /** Minutes held between sittings for clearing the table. */
  turnaroundMinutes: number;
  defaultStayMinutes: number;
} = {
  openMinute: OPEN_MINUTE,
  closeMinute: CLOSE_MINUTE,
  lastOrderMinute: LAST_ORDER_MINUTE,
  businessDays: [0, 1, 2, 4, 5, 6],
  closedDates: ["2026-09-30"],
  turnaroundMinutes: 15,
  defaultStayMinutes: 90,
};
