"use client";
import { downloadText as download } from "@/lib/runtime/download";
import { useEffect, useMemo, useRef, useState } from "react";
import "@/app/showcase.css";
import "@/app/cafe-demo.css";
import Image from "next/image";
import { ArrowUpRight, Check, Plus, X, Download } from "lucide-react";
import { CafeArt, AccessMap } from "./cafe-art";
import {
  coffeeMenu,
  foodMenu,
  featured,
  store,
  yen,
  type MenuItem,
} from "@/lib/cafe-menu";
import { FlowstateLp } from "./flowstate-lp";
import { RefineCompare } from "./refine-compare";
import { StillStudio } from "./still-studio";
import { OpsProvider } from "./ops/ops-provider";
import { RelayWorkspace } from "./ops/relay-workspace";
import { OPS_REFERENCE_ISO } from "@/lib/ops/types";
import {
  BOOKING_REFERENCE_ISO,
  bookingLabel,
  bookingSeedFor,
  bookingTimes,
  bookingWeek,
  bookingWeekday,
  validateBooking,
  qaItems,
  deliveryManifest,
  type Booking,
} from "@/lib/showcase";
function MenuCard({
  item,
  large = false,
}: {
  item: MenuItem;
  large?: boolean;
}) {
  return (
    <article className={`menu-card${large ? " menu-card--large" : ""}`}>
      <span className="menu-card-art">
        <CafeArt art={item.art} />
      </span>
      <div className="menu-card-body">
        <div className="menu-card-head">
          <h3>{item.name}</h3>
          {item.tag ? (
            <span className="menu-tag" data-tag={item.tag}>
              {item.tag}
            </span>
          ) : null}
        </div>
        <p className="menu-card-jp">{item.jp}</p>
        <p className="menu-card-note">{item.note}</p>
        <p className="menu-card-foot">
          <b>{yen(item.price)}</b>
          {item.temp ? <span className="menu-temp">{item.temp}</span> : null}
        </p>
      </div>
    </article>
  );
}

export function CafeDemo() {
  const [kind, setKind] = useState<"Coffee" | "Food">("Coffee");
  const menu = kind === "Coffee" ? coffeeMenu : foodMenu;
  return (
    <div className="cafe-demo showcase">
      <nav className="demo-local-nav" aria-label="カフェデモ内">
        <b>KISSA</b>
        <a href="#cafe-story">Our story</a>
        <a href="#cafe-menu">Menu</a>
        <a href="#cafe-access">Access</a>
      </nav>
      <section className="cafe-hero">
        <div>
          <span className="eyebrow">{store.tagline}</span>
          <h2>
            余白を、
            <br />
            一杯。
          </h2>
          <p>
            忙しい日々に、小さな深呼吸を。
            <br />
            香りと静けさを味わう、街の片隅。
          </p>
          {/* Hours and location in the hero, not only in the footer. On a
              restaurant site these are the two things a visitor came for. */}
          <dl className="cafe-hero-facts">
            <div>
              <dt>OPEN</dt>
              <dd>
                {store.hours[0].days} {store.hours[0].time}
                <span>
                  {store.hours[1].days} {store.hours[1].time} ／ 水曜定休
                </span>
              </dd>
            </div>
            <div>
              <dt>ACCESS</dt>
              <dd>
                {store.access}
                <span>{store.seats}</span>
              </dd>
            </div>
          </dl>
          <div className="cafe-hero-actions">
            <a href="#cafe-menu" className="cafe-link cafe-link--primary">
              メニューを見る <ArrowUpRight size={17} />
            </a>
            <a href="#cafe-access" className="cafe-link">
              アクセス <ArrowUpRight size={16} />
            </a>
          </div>
        </div>
        <div className="cafe-hero-art">
          <Image
            src="/visuals/kissa-ritual-v2.webp"
            alt="窓辺の木のテーブルに置かれた、ラテアートの一杯とクロワッサン"
            width={1440}
            height={960}
            sizes="(max-width: 700px) 90vw, 45vw"
            priority
            fetchPriority="high"
          />
        </div>
        <span className="cafe-vertical">A LITTLE PAUSE. A BETTER DAY.</span>
      </section>
      <section className="cafe-story" id="cafe-story">
        <span className="eyebrow">OUR PHILOSOPHY</span>
        <h2>
          何もしない時間も、
          <br />
          大切なひととき。
        </h2>
        <p>
          豆を挽く音。カップを包む手の温かさ。
          <br />
          いつもの一日に、少しだけ違う景色を。
          <br />
          KISSAは、そんな場所を想像してつくりました。
        </p>
      </section>
      <section className="cafe-menu" id="cafe-menu" data-feature>
        <div className="demo-section-heading">
          <div>
            <span className="eyebrow">THE MENU</span>
            <h2>今日の、気分で。</h2>
          </div>
          <div className="segmented" aria-label="メニュー種類">
            {(["Coffee", "Food"] as const).map((s) => (
              <button
                key={s}
                aria-pressed={kind === s}
                onClick={() => setKind(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="cafe-menu-layout">
          <figure className="cafe-menu-editorial">
            <Image
              key={kind}
              src={
                kind === "Coffee"
                  ? "/visuals/kissa-drip-v2.webp"
                  : "/visuals/kissa-food-v2.webp"
              }
              alt={
                kind === "Coffee"
                  ? "陶器のドリッパーで一杯ずつ淹れるコーヒー"
                  : "厚切りバタートーストと、卵のサンドイッチ"
              }
              width={1440}
              height={960}
              sizes="(max-width: 700px) 90vw, 40vw"
            />
            <figcaption>
              <span>
                {kind === "Coffee"
                  ? "BREWED, ONE CUP AT A TIME."
                  : "SOMETHING WARM, SOMETHING GOOD."}
              </span>
              <span>KISSA MENU</span>
            </figcaption>
          </figure>
          <div className="menu-grid">
            {menu.map((item) => (
              <MenuCard key={item.name} item={item} />
            ))}
          </div>
        </div>
        <p className="demo-fineprint">
          架空店舗のメニュー・税込想定価格です。店舗営業・飲食販売は行っていません。
        </p>
      </section>

      {/* The one thing to order if you only order one thing. Given room so
          the page has a focal point rather than an even grid of equals. */}
      <section className="cafe-pick" aria-labelledby="cafe-pick-h">
        <div>
          <span className="eyebrow">TODAY&apos;S PICK</span>
          <h2 id="cafe-pick-h">迷ったら、これを。</h2>
          <p>
            その日届いた豆から一杯ずつ。淹れている時間も含めて、
            <br />
            KISSAで過ごす時間の一部だと思っています。
          </p>
          <div className="cafe-pick-details">
            <div>
              <b>{featured.name}</b>
              <small>{featured.jp}</small>
            </div>
            <span>{yen(featured.price)}</span>
          </div>
        </div>
        <Image
          className="cafe-pick-photo"
          src="/visuals/kissa-drip-v2.webp"
          alt="おすすめのハンドドリップ。陶器のドリッパーとコーヒーサーバー"
          width={1440}
          height={960}
          sizes="(max-width: 700px) 90vw, 45vw"
        />
      </section>

      <section className="cafe-space" aria-labelledby="cafe-space-h">
        <span className="eyebrow">THE SHOP</span>
        <h2 id="cafe-space-h">こういう場所です。</h2>
        <div className="cafe-space-grid">
          <figure className="cafe-space-main">
            <Image
              src="/visuals/kissa-space-v2.webp"
              alt="自然光が差し込む、木の家具と落ち着いたカウンターの店内"
              width={1440}
              height={960}
              sizes="(max-width: 700px) 100vw, 60vw"
              loading="lazy"
            />
            <figcaption>店内 / 窓際の席</figcaption>
          </figure>
          <figure>
            <Image
              src="/visuals/kissa-food-v2.webp"
              alt="木のテーブルで楽しむ、トーストとサンドイッチの軽食"
              width={1440}
              height={960}
              sizes="(max-width: 700px) 100vw, 35vw"
              loading="lazy"
            />
            <figcaption>ひと休みの、軽食</figcaption>
          </figure>
        </div>
        <p className="demo-fineprint">
          掲載写真はAI生成による架空店舗のイメージです。実在の店舗ではありません。
        </p>
      </section>

      <section className="cafe-access" id="cafe-access">
        <div className="cafe-access-info">
          <span className="eyebrow">ACCESS</span>
          <h2>行き方と、開いている時間。</h2>
          <dl>
            <div>
              <dt>営業時間</dt>
              <dd>
                {store.hours.map((h) => (
                  <span key={h.days}>
                    {h.days}　{h.time}
                  </span>
                ))}
              </dd>
            </div>
            <div>
              <dt>住所</dt>
              <dd>
                <span>{store.address}</span>
                <span>{store.access}</span>
              </dd>
            </div>
            <div>
              <dt>席数</dt>
              <dd>
                <span>{store.seats}</span>
              </dd>
            </div>
            <div>
              <dt>電話</dt>
              <dd>
                <span>{store.tel}</span>
              </dd>
            </div>
          </dl>
        </div>
        <div className="cafe-access-map">
          <AccessMap />
          <p className="demo-fineprint">
            架空店舗のため、地図は概略図です。実在の住所ではありません。
          </p>
        </div>
      </section>

      <div className="cafe-hours">
        <b>{store.name}</b>
        <span>
          {store.hours[0].days} {store.hours[0].time} ／ 水曜定休
        </span>
        <span>SELF-INITIATED PROJECT</span>
      </div>
    </div>
  );
}
/**
 * FLOWSTATE (指示書 §17).
 *
 * The page moved to its own file when it gained the sections §17 asks for:
 * before and after, the actual downloadable output, adoption steps, and a
 * table of what is connected and what is not.
 */
export function SaasDemo() {
  return <FlowstateLp />;
}

export function EcDemo() {
  const colors = [
    { name: "Sage", label: "セージ", value: "#829078" },
    { name: "Sand", label: "サンド", value: "#bbaa89" },
    { name: "Charcoal", label: "チャコール", value: "#505450" },
  ];
  const [color, setColor] = useState(0),
    [quantity, setQuantity] = useState(1),
    [cart, setCart] = useState<{ color: number; quantity: number } | null>(
      null,
    );
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <div className="ec-demo showcase">
      <nav className="demo-local-nav" aria-label="商品デモ内">
        <b>FORME / OBJECTS</b>
        <a href="#product-details">Details</a>
        <button
          onClick={() => dialog.current?.showModal()}
          className="plain-button"
        >
          カート ({cart?.quantity ?? 0})
        </button>
      </nav>
      <section className="ec-product">
        <div
          className="ec-product-art"
          style={{
            backgroundColor:
              color === 1 ? "#eee7d8" : color === 2 ? "#dce0dc" : "#e1e6db",
          }}
        >
          <span className="eyebrow">
            FORME / 01 — {colors[color].name.toUpperCase()}
          </span>
          <Image
            className="product-photo"
            src={`/visuals/forme-${colors[color].name.toLowerCase()}-v1.webp`}
            alt={`${colors[color].label}のタンブラー。明るい石のデスクに置いた商品イメージ`}
            width={1200}
            height={800}
            sizes="(max-width: 700px) 90vw, 43vw"
            preload={color === 0}
          />
          <span className="art-bottomline">LESS, BUT BETTER.</span>
        </div>
        <div className="ec-product-info" data-feature>
          <span className="eyebrow">EVERYDAY ESSENTIALS</span>
          <h2>
            心地よさを、
            <br />
            持ち歩く。
          </h2>
          <p>FORME / 01 タンブラー</p>
          <strong className="product-price">
            ¥3,800 <small>税込・架空価格</small>
          </strong>
          <p>
            手に馴染むかたち。暮らしに溶け込む色。
            <br />
            毎日を少し整える、シンプルな道具。
          </p>
          <fieldset className="color-options">
            <legend>カラー：{colors[color].label}</legend>
            {colors.map((c, i) => (
              <button
                key={c.name}
                aria-label={c.label}
                aria-pressed={color === i}
                style={{ background: c.value }}
                onClick={() => setColor(i)}
              >
                {color === i && <Check size={19} />}
              </button>
            ))}
          </fieldset>
          <label className="quantity-label">
            数量
            <select
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <p>
            小計 <b>¥{(3800 * quantity).toLocaleString("ja-JP")}</b>
          </p>
          <button
            className="button primary"
            onClick={() => {
              setCart({ color, quantity });
              dialog.current?.showModal();
            }}
          >
            デモカートに追加 <Plus size={17} />
          </button>
          <p className="demo-fineprint">
            決済・注文は発生しません。架空商品の操作デモです。
          </p>
        </div>
      </section>
      <section className="demo-content-section" id="product-details">
        <div className="product-editorial">
          <figure>
            <Image
              src="/visuals/forme-sage-v1.webp"
              alt="ノートと並べてデスクに置いたセージ色のタンブラー"
              width={1200}
              height={800}
              sizes="(max-width: 700px) 90vw, 55vw"
            />
            <figcaption>01 / EVERYDAY — 暮らしに馴染む</figcaption>
          </figure>
          <figure>
            <Image
              src="/visuals/forme-texture-v1.webp"
              alt="マットな表面とふたの接合部分の拡大イメージ"
              width={480}
              height={720}
              sizes="(max-width: 700px) 65vw, 25vw"
            />
            <figcaption>02 / TEXTURE — 質感のディテール</figcaption>
          </figure>
        </div>
        <span className="eyebrow">THOUGHTFUL BY DESIGN</span>
        <h2>ずっと使いたくなる、理由。</h2>
        <div className="demo-three-columns">
          {[
            ["01 / TEXTURE", "手に馴染むマットな質感"],
            ["02 / FORM", "鞄にも収まる、すっきりした形"],
            ["03 / COLOR", "暮らしに馴染む3つの色"],
          ].map(([s, t]) => (
            <article key={s}>
              <span>{s}</span>
              <h3>{t}</h3>
            </article>
          ))}
        </div>
        <p className="demo-fineprint">
          商品画像はAI生成のコンセプトです。想定商品仕様：容量350ml・ステンレス製。商品企画のデモであり実物の性能を保証するものではありません。
        </p>
      </section>
      <dialog ref={dialog} className="modal" aria-labelledby="cart-title">
        <button
          className="modal-close icon-button"
          aria-label="カートを閉じる"
          onClick={() => dialog.current?.close()}
        >
          <X size={20} />
        </button>
        <h2 id="cart-title">デモカート</h2>
        {cart ? (
          <>
            <p>FORME / 01 — {colors[cart.color].label}</p>
            <p>
              {cart.quantity}点 / ¥
              {(3800 * cart.quantity).toLocaleString("ja-JP")}
            </p>
            <button className="button secondary" onClick={() => setCart(null)}>
              商品を削除
            </button>
          </>
        ) : (
          <p>カートは空です。</p>
        )}
        <p className="demo-fineprint">
          このデモには決済・注文確定機能はありません。
        </p>
        <button
          className="button primary"
          onClick={() => dialog.current?.close()}
        >
          商品に戻る
        </button>
      </dialog>
    </div>
  );
}
/**
 * RELAY (指示書 §14).
 *
 * The workspace moved to components/ops so it can share the case record with
 * SMART INBOX and ADMIN; this is the provider it needs, nothing more.
 */
export function AutomationDemo() {
  return (
    <OpsProvider referenceIso={OPS_REFERENCE_ISO}>
      <RelayWorkspace />
    </OpsProvider>
  );
}

export function BookingDemo() {
  // Today is read once per mount, on the client, so the server and the browser
  // agree on first paint and the demo still moves with the calendar.
  // Seeded from a fixed instant so the server renders a full week, then
  // re-derived from today after mount. Rendering nothing until then would
  // leave the demo blank to anyone without JavaScript.
  const [session, setSession] = useState<{ nowIso: string; rows: Booking[] }>(
    () => ({
      nowIso: BOOKING_REFERENCE_ISO,
      rows: bookingSeedFor(BOOKING_REFERENCE_ISO),
    }),
  );
  const [rows, setRows] = useState<Booking[] | null>(null),
    [picked, setPicked] = useState(""),
    [query, setQuery] = useState("");
  const [name, setName] = useState(""),
    [time, setTime] = useState("10:00"),
    [service, setService] = useState("スタジオ利用"),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [remove, setRemove] = useState<Booking | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const confirm = useRef<HTMLDialogElement>(null);

  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const nowIso = new Date().toISOString();
    setSession({ nowIso, rows: bookingSeedFor(nowIso) });
  }, []);

  const week = useMemo(() => bookingWeek(session.nowIso), [session]);
  // Derived rather than stored, so the first render after mount does not need
  // a second state write to choose a day.
  const current = rows ?? session.rows;
  const date = picked || week[0] || "";

  const filtered = current
    .filter((r) => r.date === date && r.name.includes(query))
    .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="booking-demo showcase">
      <div className="app-demo-heading">
        <span className="eyebrow">DAYBOOK / STUDIO MANAGEMENT</span>
        <h2>
          <span>今日の予定を、</span>
          <span>心地よく。</span>
        </h2>
        <p>
          {bookingLabel(week[0])}〜{bookingLabel(week[week.length - 1])}
          の架空予約。変更はこの画面内のみです。
        </p>
      </div>
      <nav className="booking-week" aria-label="表示週">
        {week.map((key) => (
          <button
            key={key}
            aria-label={`${bookingLabel(key)}を表示`}
            aria-pressed={date === key}
            onClick={() => setPicked(key)}
          >
            <span>{bookingWeekday(key)}</span>
            <b>{Number(key.slice(8))}</b>
            <small>{current.filter((row) => row.date === key).length}件</small>
          </button>
        ))}
      </nav>
      <div className="booking-toolbar">
        <label>
          表示日
          <select value={date} onChange={(e) => setPicked(e.target.value)}>
            {week.map((key) => (
              <option value={key} key={key}>
                {bookingLabel(key)}
              </option>
            ))}
          </select>
        </label>
        <label>
          予約名で検索
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="サンプル"
          />
        </label>
        <button
          className="button primary"
          onClick={() => {
            setName("");
            setTime("10:00");
            setError("");
            dialog.current?.showModal();
          }}
        >
          <Plus size={17} />
          予約を追加
        </button>
      </div>
      <div className="booking-stats">
        <div>
          <span>選択日の予約</span>
          <b>
            {current.filter((r) => r.date === date).length}
            <small> 件</small>
          </b>
        </div>
        <div>
          <span>空き時間枠</span>
          <b>
            {8 - current.filter((r) => r.date === date).length}
            <small> 枠</small>
          </b>
        </div>
        <div>
          <span>営業枠</span>
          <b>10:00–18:00</b>
        </div>
      </div>
      <section className="booking-list" data-feature>
        <div className="demo-section-heading">
          <h3>
            {bookingLabel(date)}（{bookingWeekday(date)}）の予約
          </h3>
          <span>架空データ</span>
        </div>
        {filtered.map((r) => (
          <article key={r.id}>
            <time>{r.time}</time>
            <div>
              <b>{r.name}</b>
              <p>{r.service} / 60分</p>
            </div>
            <span className="booking-badge">予約済み</span>
            <button
              className="button secondary"
              aria-label={`${r.name}の予約を取り消す`}
              onClick={() => {
                setRemove(r);
                confirm.current?.showModal();
              }}
            >
              取消
            </button>
          </article>
        ))}
        {!filtered.length && (
          <p className="relay-empty">該当する予約はありません。</p>
        )}
      </section>
      <p role="status" className="demo-fineprint">
        {notice}
      </p>
      <dialog ref={dialog} className="modal" aria-labelledby="booking-title">
        <button
          className="modal-close icon-button"
          aria-label="予約入力を閉じる"
          onClick={() => dialog.current?.close()}
        >
          <X size={18} />
        </button>
        <h2 id="booking-title">予約を追加</h2>
        <p>{bookingLabel(date)} / 架空の名前でお試しください。</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const item = { date, time, name: name.trim(), service };
            const problem = validateBooking(current, item, session.nowIso);
            if (problem) {
              setError(problem);
              return;
            }
            setRows([...current, { ...item, id: crypto.randomUUID() }]);
            setNotice("予約を追加しました。再読み込みで初期化されます。");
            dialog.current?.close();
          }}
        >
          <label>
            予約名
            <input
              required
              maxLength={40}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            開始時間
            <select value={time} onChange={(e) => setTime(e.target.value)}>
              {bookingTimes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>
            プラン
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
            >
              <option>スタジオ利用</option>
              <option>撮影プラン</option>
            </select>
          </label>
          {error && <p role="alert">{error}</p>}
          <button className="button primary" type="submit">
            予約を保存
          </button>
        </form>
      </dialog>
      <dialog ref={confirm} className="modal" aria-labelledby="cancel-title">
        <h2 id="cancel-title">予約を取り消しますか？</h2>
        <p>
          {remove?.name} / {remove?.time}
        </p>
        <div className="showcase-actions">
          <button
            className="button secondary"
            onClick={() => confirm.current?.close()}
          >
            戻る
          </button>
          <button
            className="button primary"
            onClick={() => {
              setRows(current.filter((r) => r.id !== remove?.id));
              setNotice("予約を取り消しました。");
              confirm.current?.close();
            }}
          >
            取消を確定
          </button>
        </div>
      </dialog>
    </div>
  );
}
/**
 * REFINE (指示書 §17).
 *
 * The comparison moved to its own file when it gained a width switch, a
 * reading-order overlay and a focus-order overlay; it is now a thing you
 * inspect rather than a picture of two layouts.
 */
export function ImprovementDemo() {
  return <RefineCompare />;
}

/**
 * STILL / STUDIO (指示書 §17).
 *
 * The editor moved to its own file: it is now a design that can be written,
 * cropped and exported rather than three fixed posters, and that did not fit
 * beside seven other demos in one module.
 */
export function CreativeDemo() {
  return <StillStudio />;
}

export function QaDemo() {
  const [checked, setChecked] = useState<string[]>([]),
    [notice, setNotice] = useState("");
  return (
    <div className="qa-demo showcase">
      <div className="app-demo-heading">
        <span className="eyebrow">SHIP / CHECK — DELIVERY WORKSPACE</span>
        <h2>
          <span>最後の確認まで、</span>
          <span>つくる。</span>
        </h2>
        <p>納品前チェックの操作体験です。実際の自動テストは実行しません。</p>
      </div>
      <div className="qa-workspace" data-feature>
        <section>
          <div className="demo-section-heading">
            <h3>納品前の確認項目</h3>
            <span>
              {checked.length} / {qaItems.length}
            </span>
          </div>
          <progress
            aria-label="確認項目の進捗"
            value={checked.length}
            max={qaItems.length}
          />
          <div className="qa-checklist">
            {qaItems.map((s, i) => (
              <label key={s}>
                <input
                  type="checkbox"
                  checked={checked.includes(s)}
                  onChange={(e) => {
                    setChecked(
                      e.target.checked
                        ? [...checked, s]
                        : checked.filter((v) => v !== s),
                    );
                    setNotice("");
                  }}
                />
                <span>0{i + 1}</span>
                {s}
              </label>
            ))}
          </div>
          <button
            className="button secondary"
            onClick={() => {
              setChecked([]);
              setNotice("チェックを初期化しました。");
            }}
          >
            チェックをリセット
          </button>
        </section>
        <section className="delivery-package">
          <span className="eyebrow">YOUR HANDOVER PACKAGE</span>
          <h3>納品されるもの。</h3>
          <ul>
            {[
              "src/ — ソースコード",
              "public/ — 画像・素材",
              "package.json — 依存関係",
              ".env.example — 環境変数の例",
              "README.md — 起動・更新手順",
              "docs/QA.md — 確認記録",
            ].map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <button
            className="button primary"
            disabled={checked.length !== qaItems.length}
            onClick={() => {
              download(
                JSON.stringify(deliveryManifest(checked), null, 2),
                "delivery-manifest-demo.json",
                "application/json",
              );
              setNotice(
                "デモ用マニフェストを出力しました。実際の検証証明ではありません。",
              );
            }}
          >
            <Download size={16} />
            納品マニフェストを出力
          </button>
          <p className="demo-fineprint">
            すべての項目を確認すると出力できます。マニフェストはこの操作の記録であり、実テスト結果ではありません。
          </p>
        </section>
      </div>
      <p role="status" className="demo-fineprint">
        {notice}
      </p>
    </div>
  );
}
