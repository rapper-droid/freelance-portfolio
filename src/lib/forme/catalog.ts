import type { Money } from "@/lib/runtime/rules/money";
import type {
  FormeAxis,
  FormeCategory,
  FormeProduct,
  FormeVariant,
} from "./types";

/**
 * What FORME sells (指示書 §16).
 *
 * Six objects with a reason to exist beside each other, not thirty rows of
 * lorem. Each colour has its own picture: three are photographs that already
 * existed in this repository, the rest are drawn inline, and the screens say
 * which is which rather than letting a drawing pass for a product shot.
 *
 * There are no reviews, no awards and no "popular" ordering. Inventing social
 * proof for a fictional shop is the one thing a portfolio demo must not do
 * (指示書 §16), so the sort options are the ones a shop can actually justify.
 */

const yen = (minorUnits: number): Money => ({
  minorUnits,
  scale: 0,
  currency: "JPY",
});

export const FREE = yen(0);

export const CATEGORY_LABELS: Record<FormeCategory, string> = {
  drink: "飲みもの",
  carry: "持ち歩き",
  table: "食卓",
  care: "お手入れ",
};

export const AXIS_LABELS: Record<FormeAxis, string> = {
  color: "カラー",
  size: "サイズ",
};

const colour = (
  id: string,
  label: string,
  swatch: string,
  extra = 0,
): FormeVariant => ({ id, axis: "color", label, swatch, extra: yen(extra) });

const size = (id: string, label: string, extra = 0): FormeVariant => ({
  id,
  axis: "size",
  label,
  extra: yen(extra),
});

export const products: FormeProduct[] = [
  {
    id: "tumbler",
    code: "FORME / 01",
    name: "タンブラー",
    category: "drink",
    summary: "手に馴染むマットな質感。鞄にも収まるすっきりした形。",
    description:
      "保温と保冷のどちらにも使える、ステンレスのタンブラーです。ふたは片手で開けられ、飲み口は薄く仕上げています。塗装は指紋が目立ちにくいマット仕上げ。",
    price: yen(3800),
    variants: [
      colour("tumbler-sage", "セージ", "#829078"),
      colour("tumbler-sand", "サンド", "#bbaa89"),
      colour("tumbler-charcoal", "チャコール", "#505450"),
      size("tumbler-350", "350ml"),
      size("tumbler-500", "500ml", 600),
    ],
    images: {
      "tumbler-sage": [
        {
          src: "/visuals/forme-sage-v1.webp",
          alt: "セージ色のタンブラー。明るい石のデスクに置いた商品イメージ",
          caption: "01 / セージ",
        },
        {
          src: "/visuals/forme-texture-v1.webp",
          alt: "マットな表面とふたの接合部分の拡大イメージ",
          caption: "02 / 質感のディテール",
        },
      ],
      "tumbler-sand": [
        {
          src: "/visuals/forme-sand-v1.webp",
          alt: "サンド色のタンブラー。明るい石のデスクに置いた商品イメージ",
          caption: "01 / サンド",
        },
        {
          src: "/visuals/forme-texture-v1.webp",
          alt: "マットな表面とふたの接合部分の拡大イメージ",
          caption: "02 / 質感のディテール",
        },
      ],
      "tumbler-charcoal": [
        {
          src: "/visuals/forme-charcoal-v1.webp",
          alt: "チャコール色のタンブラー。明るい石のデスクに置いた商品イメージ",
          caption: "01 / チャコール",
        },
        {
          src: "/visuals/forme-texture-v1.webp",
          alt: "マットな表面とふたの接合部分の拡大イメージ",
          caption: "02 / 質感のディテール",
        },
      ],
    },
    spec: [
      ["素材", "ステンレス鋼（内面・外面とも）"],
      ["容量", "350ml / 500ml"],
      ["ふた", "片手で開閉、パッキン交換可"],
      ["食洗機", "使えません（手洗い）"],
    ],
    weightGrams: 280,
    order: 1,
    published: true,
  },
  {
    id: "bottle",
    code: "FORME / 02",
    name: "ボトル",
    category: "drink",
    summary: "一日分の水を、持ち歩くための細身のボトル。",
    description:
      "鞄の側面ポケットに収まる細さで作っています。口が広いので氷が入り、内側に継ぎ目がないため洗いやすい形です。",
    price: yen(4600),
    variants: [
      colour("bottle-sage", "セージ", "#829078"),
      colour("bottle-charcoal", "チャコール", "#505450"),
      size("bottle-500", "500ml"),
      size("bottle-750", "750ml", 700),
    ],
    images: {},
    spec: [
      ["素材", "ステンレス鋼"],
      ["容量", "500ml / 750ml"],
      ["口径", "広口（氷が入ります）"],
      ["食洗機", "使えません（手洗い）"],
    ],
    weightGrams: 320,
    order: 2,
    published: true,
  },
  {
    id: "mug",
    code: "FORME / 03",
    name: "マグ",
    category: "table",
    summary: "毎朝の一杯のための、重心の低いマグ。",
    description:
      "倒れにくい重心と、指がしっかり入る持ち手。電子レンジと食洗機のどちらも使えます。",
    price: yen(2400),
    variants: [
      colour("mug-sand", "サンド", "#bbaa89"),
      colour("mug-charcoal", "チャコール", "#505450"),
    ],
    images: {},
    spec: [
      ["素材", "炻器（せっき）"],
      ["容量", "320ml"],
      ["電子レンジ", "使えます"],
      ["食洗機", "使えます"],
    ],
    weightGrams: 380,
    order: 3,
    published: true,
  },
  {
    id: "lunch-box",
    code: "FORME / 04",
    name: "ランチボックス",
    category: "table",
    summary: "汁気のあるおかずも入れられる、深さのある一段。",
    description:
      "仕切りは外して洗えます。ふたのパッキンは別売りで交換でき、本体だけを長く使える作りです。",
    price: yen(3200),
    variants: [
      colour("lunch-sage", "セージ", "#829078"),
      colour("lunch-sand", "サンド", "#bbaa89"),
    ],
    images: {},
    spec: [
      ["素材", "ポリプロピレン（本体）"],
      ["容量", "800ml"],
      ["電子レンジ", "使えます（ふたを外して）"],
      ["食洗機", "使えます"],
    ],
    weightGrams: 240,
    order: 4,
    published: true,
  },
  {
    id: "tote",
    code: "FORME / 05",
    name: "トート",
    category: "carry",
    summary: "毎日の荷物がそのまま入る、自立する帆布。",
    description:
      "厚手の帆布で、荷物を入れなくても自立します。内側に仕切りはひとつだけ。肩に掛けられる長さの持ち手です。",
    price: yen(5200),
    variants: [
      colour("tote-sand", "サンド", "#bbaa89"),
      colour("tote-charcoal", "チャコール", "#505450"),
      size("tote-s", "S（A4が入ります）"),
      size("tote-m", "M（13インチが入ります）", 900),
    ],
    images: {},
    spec: [
      ["素材", "綿帆布 11号"],
      ["サイズ", "S / M"],
      ["内ポケット", "1つ"],
      ["洗濯", "手洗い"],
    ],
    weightGrams: 520,
    order: 5,
    published: true,
  },
  {
    id: "care-kit",
    code: "FORME / 06",
    name: "お手入れキット",
    category: "care",
    summary: "長く使うための、ブラシとパッキンの替え。",
    description:
      "ボトルとタンブラーの内側を洗うブラシ、ふたのパッキンの替え、目地用の細いブラシが入っています。",
    price: yen(1200),
    variants: [],
    images: {},
    spec: [
      ["内容", "ブラシ2本・パッキン2個"],
      ["対応", "FORME / 01・02 のふた"],
      ["素材", "ナイロン・シリコーン"],
      ["食洗機", "使えます"],
    ],
    weightGrams: 90,
    order: 6,
    published: true,
  },
];

export const productById = (id: string) => products.find((p) => p.id === id);

export const variantById = (product: FormeProduct, id: string) =>
  product.variants.find((v) => v.id === id);

export const axesOf = (product: FormeProduct): FormeAxis[] => [
  ...new Set(product.variants.map((v) => v.axis)),
];

export const variantsOn = (product: FormeProduct, axis: FormeAxis) =>
  product.variants.filter((v) => v.axis === axis);

/** The colour a product is currently showing, or null when it has no colours. */
export const colourOf = (
  product: FormeProduct,
  variantIds: readonly string[],
): string | null =>
  variantIds.find((id) => variantById(product, id)?.axis === "color") ??
  variantsOn(product, "color")[0]?.id ??
  null;

/**
 * Shipping, stated once (指示書 §16).
 *
 * One flat rate, free above a threshold, nothing for collection. No coupons,
 * no points and no membership tiers: §16 says to implement those only if the
 * conditions, expiry, stacking and caps are implemented too, and a discount
 * that exists only as a field is exactly the kind of thing this demo is
 * meant to argue against.
 */
export const SHIPPING = {
  flat: yen(600),
  freeAbove: yen(8000),
  pickup: FREE,
};

/** Prices include consumption tax, as Japanese consumer pricing requires. */
export const TAX_NOTE =
  "表示価格はすべて税込です。この体験では消費税を別途加算しません。";

export const REGIONS = [
  "北海道・東北",
  "関東",
  "中部",
  "近畿",
  "中国・四国",
  "九州・沖縄",
] as const;

/**
 * Regions the flat rate does not cover.
 *
 * A shop that charges one price to everywhere including Okinawa is a shop
 * that has not thought about shipping. The surcharge is small, stated, and
 * applied by the same function that computes the total.
 */
export const REGION_SURCHARGE: Record<string, Money> = {
  "北海道・東北": yen(300),
  "九州・沖縄": yen(300),
};

export const PICKUP_NOTE =
  "店頭受け取りは架空の店舗を想定した選択肢です。実際に受け取れる場所はありません。";

export const IMAGE_DISCLOSURE =
  "写真は FORME / 01 のみ。ほかの商品のビジュアルはこのサイト内で描いた図版で、実物の写真ではありません。";
