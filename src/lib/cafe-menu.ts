/**
 * KISSA — the fictional cafe used by the demo.
 *
 * A real cafe menu, not three placeholder rows: the point of this demo is to
 * show a client what their own shop's site would contain, and a shop with
 * three drinks does not look like a shop.
 *
 * Everything here is invented for the demo. Prices are plausible Tokyo cafe
 * prices so the layout is exercised with realistic strings (four digits, a
 * yen sign, "〜" ranges), not so anyone can buy anything.
 */

export type Temp = "HOT" | "ICE" | "HOT / ICE";

export type MenuItem = {
  /** Latin name, used as the heading. */
  name: string;
  /** Japanese name, shown beneath. */
  jp: string;
  note: string;
  price: number;
  temp?: Temp;
  /** Which glyph to draw. See components/cafe-art.tsx. */
  art:
    | "espresso"
    | "latte"
    | "cappuccino"
    | "drip"
    | "matcha"
    | "seasonal-drink"
    | "toast"
    | "sandwich"
    | "cake"
    | "pastry"
    | "breakfast"
    | "seasonal-food";
  tag?: "人気" | "季節限定" | "おすすめ";
};

export const coffeeMenu: MenuItem[] = [
  {
    name: "Espresso",
    jp: "エスプレッソ",
    note: "浅めの焙煎で、果実のような酸を残して。",
    price: 450,
    temp: "HOT",
    art: "espresso",
  },
  {
    name: "Cafe Latte",
    jp: "カフェラテ",
    note: "ミルクの甘さが立つよう、少し濃いめに。",
    price: 620,
    temp: "HOT / ICE",
    art: "latte",
    tag: "人気",
  },
  {
    name: "Cappuccino",
    jp: "カプチーノ",
    note: "泡は細かく、飲み終わりまで温かく。",
    price: 620,
    temp: "HOT",
    art: "cappuccino",
  },
  {
    name: "Hand Drip",
    jp: "ハンドドリップ",
    note: "その日の豆から選べます。淹れる時間も、どうぞ。",
    price: 680,
    temp: "HOT / ICE",
    art: "drip",
    tag: "おすすめ",
  },
  {
    name: "Matcha Latte",
    jp: "抹茶ラテ",
    note: "京都の石臼挽き。甘さは控えめに。",
    price: 680,
    temp: "HOT / ICE",
    art: "matcha",
  },
  {
    name: "Seasonal Drink",
    jp: "季節のドリンク",
    note: "秋は和栗とほうじ茶。月替わりでご用意します。",
    price: 720,
    temp: "HOT / ICE",
    art: "seasonal-drink",
    tag: "季節限定",
  },
];

export const foodMenu: MenuItem[] = [
  {
    name: "Butter Toast",
    jp: "バタートースト",
    note: "厚切りのパンに、発酵バターをたっぷりと。",
    price: 480,
    art: "toast",
  },
  {
    name: "Sandwich",
    jp: "たまごサンド",
    note: "ふんわり焼いた卵を、やわらかいパンで。",
    price: 780,
    art: "sandwich",
    tag: "人気",
  },
  {
    name: "Cheese Cake",
    jp: "チーズケーキ",
    note: "ひと口ずつ、ゆっくりと。珈琲に寄り添う濃さ。",
    price: 620,
    art: "cake",
  },
  {
    name: "Croissant",
    jp: "クロワッサン",
    note: "朝に焼いて、その日のうちに。",
    price: 420,
    art: "pastry",
  },
  {
    name: "Morning Set",
    jp: "モーニングセット",
    note: "トースト・たまご・サラダと、お好きな一杯。11時まで。",
    price: 980,
    art: "breakfast",
    tag: "おすすめ",
  },
  {
    name: "Seasonal Tart",
    jp: "季節のタルト",
    note: "季節の果実と、香ばしい生地。",
    price: 720,
    art: "seasonal-food",
    tag: "季節限定",
  },
];

/** Shown large in the recommended block. */
export const featured = coffeeMenu[3];

export const store = {
  name: "KISSA",
  reading: "キッサ",
  tagline: "COFFEE & QUIET MOMENTS",
  hours: [
    { days: "月 – 金", time: "8:00 – 19:00" },
    { days: "土 – 日", time: "9:00 – 18:00" },
    { days: "水", time: "定休日" },
  ],
  address: "東京都◯◯区◯◯ 1-2-3 ◯◯ビル 1F",
  access: "◯◯駅 東口から徒歩4分",
  seats: "店内 18席 / テラス 6席",
  tel: "03-0000-0000",
} as const;

export const yen = (n: number) => `¥${n.toLocaleString("ja-JP")}`;
