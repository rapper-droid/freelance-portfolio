"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowUpRight,
  Check,
  Plus,
  X,
  Download,
  ArrowRight,
} from "lucide-react";
import { WorkspaceVisual } from "./project-visuals";
import { classify, replyDraft } from "@/lib/inbox";
import {
  bookingSeed,
  bookingTimes,
  validateBooking,
  qaItems,
  deliveryManifest,
  creativeSvg,
  type Booking,
} from "@/lib/showcase";
function download(text: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function CafeDemo() {
  const [kind, setKind] = useState("Coffee");
  const menu: Record<string, string[][]> = {
    Coffee: [
      ["House blend", "柔らかな甘さ、ナッツの余韻。", "¥650"],
      ["Cafe latte", "エスプレッソと、なめらかなミルク。", "¥750"],
      ["Single origin", "豆の個性を、ハンドドリップで。", "¥850"],
    ],
    Food: [
      ["季節のタルト", "季節の果実と、香ばしい生地。", "¥780"],
      ["バタートースト", "厚切りのパンに、発酵バター。", "¥580"],
      ["チーズケーキ", "ひと口ずつ、ゆっくりと。", "¥720"],
    ],
  };
  return (
    <div className="cafe-demo showcase">
      <nav className="demo-local-nav" aria-label="カフェデモ内">
        <b>KISSA</b>
        <a href="#cafe-story">Our story</a>
        <a href="#cafe-menu">Menu</a>
      </nav>
      <section className="cafe-hero">
        <div>
          <span className="eyebrow">COFFEE & QUIET MOMENTS</span>
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
          <a href="#cafe-menu" className="cafe-link">
            メニューを見る <ArrowUpRight size={17} />
          </a>
        </div>
        <div className="cafe-hero-art">
          <Image
            src="/visuals/kissa-coffee-v1.webp"
            alt="ラテアートのコーヒーと焼き菓子、奥に温かなカフェのカウンター"
            width={1200}
            height={800}
            sizes="(max-width: 700px) 90vw, 45vw"
            preload
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
      <figure className="cafe-space-photo">
        <Image
          src="/visuals/kissa-interior-v1.webp"
          alt="自然光が差し込む、木の家具と落ち着いたカウンターの店内イメージ"
          width={1200}
          height={800}
          sizes="(max-width: 700px) 100vw, 85vw"
        />
        <figcaption>A PLACE TO SLOW DOWN / AI生成の架空店舗イメージ</figcaption>
      </figure>
      <section className="cafe-menu" id="cafe-menu" data-feature>
        <div className="demo-section-heading">
          <div>
            <span className="eyebrow">THE MENU</span>
            <h2>今日の、気分で。</h2>
          </div>
          <div className="segmented" aria-label="メニュー種類">
            {["Coffee", "Food"].map((s) => (
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
        <div className="menu-items">
          {menu[kind].map(([name, desc, price], i) => (
            <article key={name}>
              <span className="menu-number">0{i + 1}</span>
              <h3>{name}</h3>
              <p>{desc}</p>
              <b>{price}</b>
            </article>
          ))}
        </div>
        <p className="demo-fineprint">
          架空店舗のメニュー・税込想定価格です。店舗営業・飲食販売は行っていません。
        </p>
      </section>
      <div className="cafe-hours">
        <b>KISSA</b>
        <span>想定営業時間 10:00–18:00 / 水曜定休</span>
        <span>SELF-INITIATED PROJECT</span>
      </div>
    </div>
  );
}
export function SaasDemo() {
  const [annual, setAnnual] = useState(false);
  return (
    <div className="saas-demo showcase">
      <nav className="demo-local-nav" aria-label="SaaSデモ内">
        <b>◈ FLOWSTATE</b>
        <a href="#folio-features">機能</a>
        <a href="#folio-pricing">プラン</a>
      </nav>
      <section className="saas-hero">
        <span className="saas-pill">A CALMER WAY TO WORK</span>
        <h2>
          仕事を整える。
          <br />
          <span>余裕が生まれる。</span>
        </h2>
        <p>
          タスクも、プロジェクトも、次の一歩も。
          <br />
          チームの見通しをひとつにするワークスペース。
        </p>
        <a href="#folio-pricing" className="button primary">
          プランを比較する <ArrowRight size={17} />
        </a>
        <div className="saas-product">
          <WorkspaceVisual />
        </div>
      </section>
      <section className="demo-content-section" id="folio-features">
        <span className="eyebrow">LESS NOISE. MORE FOCUS.</span>
        <h2>必要なことが、必要な場所に。</h2>
        <div className="demo-three-columns">
          {[
            ["01", "見通せる", "タスクの状況と次のアクションを、一覧で把握。"],
            ["02", "まとまる", "プロジェクトの情報をひとつの場所に整理。"],
            ["03", "迷わない", "誰が、何を、いつまでに。役割を明快に。"],
          ].map(([n, t, d]) => (
            <article key={n}>
              <span>{n}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="demo-content-section" id="folio-pricing" data-feature>
        <div className="demo-section-heading">
          <h2>チームに合う、シンプルなプラン。</h2>
          <div className="segmented">
            <button aria-pressed={!annual} onClick={() => setAnnual(false)}>
              月額
            </button>
            <button aria-pressed={annual} onClick={() => setAnnual(true)}>
              年額
            </button>
          </div>
        </div>
        <div className="demo-three-columns folio-plans">
          {[
            ["Personal", 0, "個人のタスク整理"],
            ["Team", annual ? 980 : 1200, "小さなチームの進行管理"],
            ["Studio", annual ? 1980 : 2400, "複数プロジェクトの運用"],
          ].map(([name, price, desc]) => (
            <article
              key={name}
              className={name === "Team" ? "recommended" : ""}
            >
              <span>{name}</span>
              <h3>
                ¥{Number(price).toLocaleString("ja-JP")}
                <small> / 月・人</small>
              </h3>
              <p>{desc}</p>
              <p className="demo-fineprint">
                {annual && price
                  ? `年払い ¥${(Number(price) * 12).toLocaleString("ja-JP")} / 人`
                  : "月単位の想定料金"}
              </p>
              <p>
                ✓ タスク整理
                <br />✓ プロジェクト一覧
                <br />✓ ステータス管理
              </p>
            </article>
          ))}
        </div>
        <p className="demo-fineprint">
          架空SaaSの想定プラン・税込価格です。実際のサービス利用や契約はできません。
        </p>
      </section>
      <section className="demo-content-section faq">
        <h2>よくある質問</h2>
        {[
          [
            "これは利用できるサービスですか？",
            "SaaSの魅力を伝えるための自主制作LPです。プロダクト画面はデザインプレビューで、登録・課金はありません。",
          ],
          [
            "どの端末で見られますか？",
            "LPはPC・タブレット・スマートフォンに合わせて表示を調整しています。",
          ],
          [
            "自社サービスのLPとして依頼できますか？",
            "このポートフォリオの相談文を使い、ご利用中のクラウドソーシングサービスのメッセージでご相談ください。",
          ],
        ].map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </section>
    </div>
  );
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
export function AutomationDemo() {
  const [input, setInput] = useState(
    "本日からフォームが動かず業務が停止しています。至急確認をお願いします。",
  );
  const [result, setResult] = useState<ReturnType<typeof classify> | null>(
    null,
  );
  const [draft, setDraft] = useState("");
  const [approved, setApproved] = useState(false);
  const [notice, setNotice] = useState("");
  return (
    <div className="automation-demo showcase">
      <div className="app-demo-heading">
        <span className="eyebrow">RELAY / SUPPORT OPERATIONS</span>
        <h2>自動化に、人の判断を。</h2>
        <p>
          AI導入を想定した体験デモ。現在はキーワード・定型文でローカル処理します。
        </p>
      </div>
      <ol className="relay-flow">
        {["受付", "分類", "下書き", "人の確認"].map((s, i) => (
          <li
            key={s}
            className={i === 0 || (result && i < 3) || approved ? "done" : ""}
          >
            <span>0{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>
      <div className="relay-workspace" data-feature>
        <section>
          <span className="eyebrow">01 / INPUT</span>
          <h3>問い合わせ内容</h3>
          <label>
            テスト用の問い合わせ
            <textarea
              rows={6}
              maxLength={2000}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setResult(null);
                setDraft("");
                setApproved(false);
                setNotice("");
              }}
            />
          </label>
          <button
            className="button primary"
            disabled={!input.trim()}
            onClick={() => {
              setResult(classify(input));
              setDraft(
                replyDraft({
                  id: 1,
                  name: "サンプルのお客様",
                  subject: "",
                  body: input,
                  date: "",
                  status: "未対応",
                  owner: "未割当",
                }),
              );
              setApproved(false);
              setNotice(
                "分類と返信下書きを作成しました。担当者が確認してください。",
              );
            }}
          >
            分類・下書きを実行 <ArrowRight size={16} />
          </button>
          <p className="demo-fineprint">
            入力内容は外部送信しません。実際の個人情報は入力しないでください。
          </p>
        </section>
        <section>
          <span className="eyebrow">02 / REVIEW</span>
          <h3>担当者の確認</h3>
          {result ? (
            <>
              <div className="relay-result">
                <span>
                  分類 <b>{result.category}</b>
                </span>
                <span>
                  緊急度 <b>{result.urgency}</b>
                </span>
              </div>
              <label>
                返信下書き
                <textarea
                  rows={8}
                  aria-label="返信下書き"
                  value={draft}
                  maxLength={4000}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    setApproved(false);
                    setNotice("変更した下書きを再確認してください。");
                  }}
                />
              </label>
              <div className="showcase-actions">
                <button
                  className="button primary"
                  disabled={!draft.trim() || approved}
                  onClick={() => {
                    setApproved(true);
                    setNotice("確認済みにしました。メールは送信されません。");
                  }}
                >
                  内容を確認済みにする
                </button>
                <button
                  className="button secondary"
                  onClick={() => {
                    setApproved(false);
                    setNotice(
                      "下書きを差し戻しました。編集して再確認してください。",
                    );
                  }}
                >
                  差し戻す
                </button>
              </div>
            </>
          ) : (
            <div className="relay-empty">
              問い合わせを入力して実行すると、
              <br />
              分類結果と返信下書きが表示されます。
            </div>
          )}
          <p role="status">{notice}</p>
        </section>
      </div>
      <details className="api-contract">
        <summary>API連携を実装する場合のデータ契約例</summary>
        <p>
          接続設計サンプルです。以下のAPIは公開・接続されていません。実装時は認証・入力検証・タイムアウト・コスト上限・人の確認を設けます。
        </p>
        <pre>
          {JSON.stringify(
            {
              request: { ticketId: "demo-001", text: "匿名化した本文" },
              response: {
                category: "support",
                draft: "要確認の返信案",
                requiresHumanReview: true,
              },
              failure: { code: "UPSTREAM_UNAVAILABLE", retryable: true },
            },
            null,
            2,
          )}
        </pre>
      </details>
    </div>
  );
}
export function BookingDemo() {
  const [rows, setRows] = useState(bookingSeed),
    [date, setDate] = useState("2026-09-18"),
    [query, setQuery] = useState("");
  const [name, setName] = useState(""),
    [time, setTime] = useState("10:00"),
    [service, setService] = useState("スタジオ利用"),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [remove, setRemove] = useState<Booking | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const confirm = useRef<HTMLDialogElement>(null);
  const filtered = rows
    .filter((r) => r.date === date && r.name.includes(query))
    .sort((a, b) => a.time.localeCompare(b.time));
  return (
    <div className="booking-demo showcase">
      <div className="app-demo-heading">
        <span className="eyebrow">DAYBOOK / STUDIO MANAGEMENT</span>
        <h2>今日の予定を、心地よく。</h2>
        <p>2026年9月18日〜24日の架空予約。変更はこの画面内のみです。</p>
      </div>
      <div className="booking-toolbar">
        <label>
          表示日
          <select value={date} onChange={(e) => setDate(e.target.value)}>
            {[18, 19, 20, 21, 22, 23, 24].map((d) => (
              <option value={`2026-09-${d}`} key={d}>
                9月{d}日
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
            {rows.filter((r) => r.date === date).length}
            <small> 件</small>
          </b>
        </div>
        <div>
          <span>空き時間枠</span>
          <b>
            {8 - rows.filter((r) => r.date === date).length}
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
          <h3>{date.replaceAll("-", " / ")} の予約</h3>
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
        <p>{date} / 架空の名前でお試しください。</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const item = { date, time, name: name.trim(), service };
            const problem = validateBooking(rows, item);
            if (problem) {
              setError(problem);
              return;
            }
            setRows([...rows, { ...item, id: crypto.randomUUID() }]);
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
              setRows(rows.filter((r) => r.id !== remove?.id));
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
export function ImprovementDemo() {
  const [after, setAfter] = useState(true);
  return (
    <div className="improvement-demo showcase">
      <div className="app-demo-heading">
        <span className="eyebrow">REFINE / BEFORE & AFTER</span>
        <h2>伝わる順番に、整える。</h2>
        <p>
          同じ情報を、異なるレイアウトで比較。架空ページの改善サンプルです。
        </p>
      </div>
      <div className="segmented improvement-toggle">
        <button aria-pressed={!after} onClick={() => setAfter(false)}>
          Before
        </button>
        <button aria-pressed={after} onClick={() => setAfter(true)}>
          After
        </button>
      </div>
      <section
        className={`comparison-site ${after ? "is-after" : "is-before"}`}
        data-feature
      >
        <header>
          GREEN ROOM <span>暮らしの整理サポート</span>
        </header>
        <div>
          <span>SPACE FOR WHAT MATTERS</span>
          <h2>
            暮らしに、
            <br />
            余白をつくる。
          </h2>
          <p>
            整理収納のオンライン相談。
            <br />
            自分に合う、片付けの仕組みを一緒に考えます。
          </p>
          <a href="#refine-notes" className="button primary">
            改善したポイントを見る <ArrowRight size={16} />
          </a>
        </div>
        <aside>
          <div className="room-art">
            <span />
            <span />
            <span />
          </div>
        </aside>
        <footer>サービス紹介 / 相談の流れ / よくある質問</footer>
      </section>
      <section className="demo-content-section" id="refine-notes">
        <h2>
          {after ? "After：読み手の順番で設計" : "Before：改善前の課題を再現"}
        </h2>
        <div className="demo-three-columns">
          {[
            [
              "情報階層",
              after
                ? "見出し → 説明 → 行動を一方向に整理。"
                : "同じ強さの情報が並び、主役が曖昧。",
            ],
            [
              "余白・配置",
              after
                ? "適切な行長と余白で、内容を追いやすく。"
                : "コンテンツが詰まり、読み進めにくい配置。",
            ],
            [
              "モバイル",
              after
                ? "縦一列に並べ替え、CTAのタップ領域を確保。"
                : "重要な操作への案内が埋もれやすい構成。",
            ],
          ].map(([t, d]) => (
            <article key={t}>
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
        <p className="demo-fineprint">
          改善方針を見せる比較です。売上・CVR・速度などの実測改善値は主張していません。
        </p>
      </section>
    </div>
  );
}
export function CreativeDemo() {
  const [style, setStyle] = useState(0),
    [ratio, setRatio] = useState("square");
  const titles = ["MAKE ROOM.", "SLOW DAYS.", "LESS. BETTER."];
  return (
    <div className="creative-demo showcase">
      <div className="app-demo-heading">
        <span className="eyebrow">STILL / STUDIO — CREATIVE COLLECTION</span>
        <h2>らしさを、展開する。</h2>
        <p>
          3つの方向性 × 3つのフォーマット。オリジナルSVGで制作した広告サンプル。
        </p>
      </div>
      <div className="creative-workspace">
        <section className="creative-controls">
          <h3>アートディレクション</h3>
          <div className="creative-style-buttons">
            {titles.map((t, i) => (
              <button
                key={t}
                aria-pressed={style === i}
                onClick={() => setStyle(i)}
              >
                <span>0{i + 1}</span>
                {t}
              </button>
            ))}
          </div>
          <label>
            フォーマット
            <select value={ratio} onChange={(e) => setRatio(e.target.value)}>
              <option value="square">SNS投稿 / 1080 × 1080</option>
              <option value="portrait">ストーリー / 1080 × 1920</option>
              <option value="landscape">広告バナー / 1200 × 630</option>
            </select>
          </label>
          <p>
            見出し・図形・余白を一貫したルールで展開。用途に合わせて比率を調整できます。
          </p>
          <button
            className="button primary"
            onClick={() =>
              download(
                creativeSvg(style, ratio),
                `still-${style + 1}-${ratio}.svg`,
                "image/svg+xml",
              )
            }
          >
            <Download size={16} />
            SVGをダウンロード
          </button>
          <p className="demo-fineprint">
            全素材は本サイトの自主制作。架空の広告で、配信実績ではありません。
          </p>
        </section>
        <div className="creative-preview" data-feature>
          <Image
            unoptimized
            src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(creativeSvg(style, ratio))}`}
            alt={`${titles[style]} / ${ratio}の広告クリエイティブ`}
            width={ratio === "landscape" ? 1200 : 1080}
            height={
              ratio === "portrait" ? 1920 : ratio === "landscape" ? 630 : 1080
            }
          />
        </div>
      </div>
    </div>
  );
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
