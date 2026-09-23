import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductMedia } from "@/components/forme/product-media";
import { ART_DISCLOSURE } from "@/components/forme/product-art";
import {
  CATEGORY_LABELS,
  PICKUP_NOTE,
  SHIPPING,
  TAX_NOTE,
  products,
} from "@/lib/forme/catalog";
import { formatMoney } from "@/lib/runtime/rules/money";
import { pageMetadata } from "@/lib/seo";

/**
 * FORME's front page (指示書 §16).
 *
 * Three things a visitor came to do — look at the objects, find the one they
 * want, see what it costs to get it — above anything about the brand.
 */
export const metadata = {
  ...pageMetadata(
    "FORME｜毎日の道具（架空店舗のデモ）",
    "商品一覧・比較・カート・注文・在庫管理まで操作できる、架空のオンラインショップのデモです。実際の注文や配送は発生しません。",
    "/forme",
  ),
  // A fictional shop must not be indexed as a real one (指示書 §22).
  robots: { index: false, follow: true },
};

export default function FormeTop() {
  const featured = [...products].sort((a, b) => a.order - b.order).slice(0, 3);

  return (
    <>
      <section className="forme-hero">
        <div className="forme-hero-copy">
          <span className="forme-eyebrow">FORME / OBJECTS</span>
          <h1>
            少なく持って、
            <br />
            長く使う。
          </h1>
          <p>
            毎日使うものだけを、選べるだけの数で。色とサイズを選ぶと、写真も価格も
            在庫もその組み合わせのものに変わります。
          </p>
          <div className="forme-hero-actions">
            <Link href="/forme/items" className="forme-button">
              商品を見る <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/forme/my" className="forme-button secondary">
              注文・お気に入り
            </Link>
          </div>
        </div>
        <ul className="forme-hero-art" aria-label="取り扱いの一部">
          {featured.map((product) => (
            <li key={product.id}>
              <Link href={`/forme/items/${product.id}`}>
                <ProductMedia product={product} />
                <span>{product.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="forme-section" aria-labelledby="forme-do">
        <h2 id="forme-do">この店でできること</h2>
        <ul className="forme-do-grid">
          <li>
            <h3>選ぶ</h3>
            <p>
              {products.length} 品。分類・検索・並び替えと、3 点までの比較。
              お気に入りはこの端末に残ります。
            </p>
            <Link href="/forme/items">商品一覧へ</Link>
          </li>
          <li>
            <h3>注文する</h3>
            <p>
              カートから受け取り方法を選び、送料まで確認して確定します。支払は
              シミュレーターで、承認・拒否・保留も試せます。
            </p>
            <Link href="/forme/cart">カートへ</Link>
          </li>
          <li>
            <h3>運営する</h3>
            <p>
              在庫の増減、取り扱いの停止、注文の進行と売上。客側の画面と同じ記録を
              動かせます。
            </p>
            <Link href="/forme/admin">運営画面へ</Link>
          </li>
        </ul>
      </section>

      <section
        className="forme-section forme-info"
        aria-labelledby="forme-info"
      >
        <h2 id="forme-info">お届けとお支払い</h2>
        <dl className="forme-info-grid">
          <div>
            <dt>送料</dt>
            <dd>
              全国一律 {formatMoney(SHIPPING.flat)}
              <br />
              <small>
                {formatMoney(SHIPPING.freeAbove)} 以上のお買い上げで無料。
                北海道・東北と九州・沖縄は 300 円を加算します。
              </small>
            </dd>
          </div>
          <div>
            <dt>店頭受け取り</dt>
            <dd>
              送料はかかりません
              <br />
              <small>{PICKUP_NOTE}</small>
            </dd>
          </div>
          <div>
            <dt>価格</dt>
            <dd>
              すべて税込
              <br />
              <small>{TAX_NOTE}</small>
            </dd>
          </div>
          <div>
            <dt>クーポン</dt>
            <dd>
              用意していません
              <br />
              <small>
                条件・期限・併用・上限まで実装していないものを、画面にだけ置かない
                ためです。
              </small>
            </dd>
          </div>
        </dl>
      </section>

      <section className="forme-section" aria-labelledby="forme-cats">
        <h2 id="forme-cats">分類</h2>
        <ul className="forme-chip-row">
          {Object.entries(CATEGORY_LABELS).map(([id, label]) => (
            <li key={id}>
              <Link href={`/forme/items?category=${id}`} className="forme-chip">
                {label}
                <span>{products.filter((p) => p.category === id).length}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="forme-fineprint">{ART_DISCLOSURE}</p>
      </section>
    </>
  );
}
