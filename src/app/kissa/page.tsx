import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductArt } from "@/components/kissa/product-art";
import { CATEGORY_LABELS, HOURS, products, seats } from "@/lib/shop/catalog";
import { pageMetadata } from "@/lib/seo";

/**
 * The shop's front page (指示書 §10).
 *
 * Three jobs, stated plainly: look at the menu, book a table, order for
 * collection. A cafe's site is not an essay, and the things a visitor came to
 * do are above the reading.
 */
export const metadata = {
  ...pageMetadata(
    "KISSA｜喫茶と焙煎（架空店舗のデモ）",
    "メニュー・席の予約・テイクアウト注文まで操作できる、架空のカフェのデモです。実際の注文や予約は発生しません。",
    "/kissa",
  ),
  // A fictional shop must not be indexed as a real one (指示書 §22).
  robots: { index: false, follow: true },
};

const minuteLabel = (minute: number) =>
  `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export default function KissaTop() {
  const featured = products
    .filter((p) => p.category === "seasonal" || p.id === "latte")
    .slice(0, 3);
  const closedDays = WEEKDAYS.filter(
    (_, index) => !HOURS.businessDays.includes(index),
  );

  return (
    <>
      <section className="kissa-hero">
        <div className="kissa-hero-copy">
          <span className="kissa-eyebrow">KISSA / 喫茶と焙煎</span>
          <h1>
            一杯のために、
            <br />
            席をひとつ空けています。
          </h1>
          <p>
            自家焙煎のコーヒーと、朝のトースト。
            席の予約も、受け取りのご注文も、この画面から進められます。
          </p>
          <div className="kissa-hero-actions">
            <Link href="/kissa/menu" className="kissa-button">
              メニューを見る <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/kissa/reserve" className="kissa-button secondary">
              席を予約する
            </Link>
          </div>
        </div>
        <ul className="kissa-hero-art" aria-label="本日のおすすめ">
          {featured.map((product) => (
            <li key={product.id}>
              <Link href={`/kissa/menu/${product.id}`}>
                <ProductArt product={product} />
                <span>{product.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="kissa-section" aria-labelledby="kissa-do">
        <h2 id="kissa-do">この店でできること</h2>
        <ul className="kissa-do-grid">
          <li>
            <h3>メニューを見る</h3>
            <p>
              {products.length}{" "}
              品。温度やサイズを選び、そのままカートへ入れられます。
            </p>
            <Link href="/kissa/menu">メニューへ</Link>
          </li>
          <li>
            <h3>席を予約する</h3>
            <p>
              人数と時間を選ぶと、空いている席だけが表示されます。変更・取消もできます。
            </p>
            <Link href="/kissa/reserve">予約へ</Link>
          </li>
          <li>
            <h3>受け取りで注文する</h3>
            <p>調理時間と営業時間から、受け取れる時間だけをご案内します。</p>
            <Link href="/kissa/order">カートへ</Link>
          </li>
        </ul>
      </section>

      <section
        className="kissa-section kissa-info"
        aria-labelledby="kissa-info"
      >
        <h2 id="kissa-info">店舗のご案内</h2>
        <dl className="kissa-info-grid">
          <div>
            <dt>営業時間</dt>
            <dd>
              {minuteLabel(HOURS.openMinute)} – {minuteLabel(HOURS.closeMinute)}
              <br />
              <small>
                テイクアウトの最終受付 {minuteLabel(HOURS.lastOrderMinute)}
              </small>
            </dd>
          </div>
          <div>
            <dt>定休日</dt>
            <dd>
              {closedDays.join("・")}曜日
              {HOURS.closedDates.length > 0 && (
                <>
                  <br />
                  <small>臨時休業：{HOURS.closedDates.join("、")}</small>
                </>
              )}
            </dd>
          </div>
          <div>
            <dt>席</dt>
            <dd>
              {seats.filter((s) => s.id !== "table-ab").length} 席
              <br />
              <small>
                テーブル A と B は連結して 4 名でもご利用いただけます。
              </small>
            </dd>
          </div>
          <div>
            <dt>所在地</dt>
            <dd>
              {/* A fictional shop states that it is fictional rather than
                  borrowing a real address (指示書 §10). */}
              架空の店舗のため住所はありません。
              <br />
              <small>設備・動線のデザイン例としてご覧ください。</small>
            </dd>
          </div>
        </dl>
      </section>

      <section className="kissa-section" aria-labelledby="kissa-cats">
        <h2 id="kissa-cats">メニューの分類</h2>
        <ul className="kissa-chip-row">
          {Object.entries(CATEGORY_LABELS).map(([id, label]) => (
            <li key={id}>
              <Link href={`/kissa/menu?category=${id}`} className="kissa-chip">
                {label}
                <span>{products.filter((p) => p.category === id).length}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
