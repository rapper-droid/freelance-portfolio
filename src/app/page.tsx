import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  FileSpreadsheet,
  Inbox,
  LayoutDashboard,
  Code2,
  Workflow,
  PanelsTopLeft,
  Command,
  ShieldCheck,
} from "lucide-react";
import { Header, Footer } from "@/components/site";
import { Contact } from "@/components/contact";
const demos = [
  {
    id: "csv",
    n: "01",
    title: "CSV AUTOMATOR",
    name: "面倒なデータ整理を、ワンクリックで。",
    description:
      "読み込み・重複除去・整形・集計・書き出し。毎回のExcel作業を、ひとつの流れに。",
    tags: ["CSV加工", "重複除去", "集計"],
    Icon: FileSpreadsheet,
  },
  {
    id: "inbox",
    n: "02",
    title: "SMART INBOX",
    name: "問い合わせを整理して、対応をスムーズに。",
    description:
      "内容に応じた分類と優先度の判定。返信案の作成まで、問い合わせ対応をサポート。",
    tags: ["自動分類", "対応管理", "返信案"],
    Icon: Inbox,
  },
  {
    id: "admin",
    n: "03",
    title: "ADMIN DASHBOARD",
    name: "顧客も売上も、ひと目でわかる管理画面。",
    description:
      "顧客情報の追加・編集からステータス管理まで。小さな業務に、ちょうどいい仕組みを。",
    tags: ["顧客管理", "CRUD", "ブラウザ保存"],
    Icon: LayoutDashboard,
  },
];
function Preview({ type }: { type: string }) {
  return (
    <div className={`preview preview-${type}`} aria-hidden="true">
      <div className="mini-top">
        <span className="mini-dots">● ● ●</span>
        <span>
          {type === "csv"
            ? "CSV Automator"
            : type === "inbox"
              ? "Smart Inbox"
              : "Overview"}
        </span>
        <span className="mini-avatar">W</span>
      </div>
      {type === "csv" ? (
        <>
          <div className="mini-stats">
            <div>
              <small>処理前</small>
              <strong>
                125<span> 件</span>
              </strong>
            </div>
            <ArrowRight size={19} />
            <div>
              <small>処理後</small>
              <strong className="green">
                98<span> 件</span>
              </strong>
            </div>
            <span className="mini-badge">✓ 27件の重複を除去</span>
          </div>
          <div className="mini-table">
            <div>
              注文ID<span>顧客名</span>
              <span>金額</span>
              <span>状態</span>
            </div>
            {["001", "002", "003"].map((n, i) => (
              <div key={n}>
                ORD-{n}
                <span>サンプル顧客{i + 1}</span>
                <span>¥{i ? "12,000" : "5,000"}</span>
                <span className="green">完了</span>
              </div>
            ))}
          </div>
        </>
      ) : type === "inbox" ? (
        <div className="mini-inbox">
          <aside>
            すべて <b>6</b>
            <br />
            <br />
            未対応 <b>3</b>
            <br />
            <br />
            対応中 <b>2</b>
          </aside>
          <div>
            {[
              "フォームが動かない",
              "請求書の宛名変更について",
              "契約更新の相談",
            ].map((t, i) => (
              <div className="mini-mail" key={t}>
                <span className={`tiny-tag ${i === 0 ? "orange" : ""}`}>
                  {["緊急", "請求", "契約"][i]}
                </span>
                <b>{t}</b>
                <small>内容を自動で分類しました</small>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="mini-kpis">
            {[
              ["顧客数", "6"],
              ["取引中", "3"],
              ["累計売上", "¥80,000"],
            ].map(([a, b]) => (
              <div key={a}>
                <small>{a}</small>
                <strong>{b}</strong>
              </div>
            ))}
          </div>
          <div className="mini-chart">
            <div>
              <small>売上内訳</small>
              <div className="bars">
                {[38, 68, 48, 92, 60, 80, 100, 75, 90, 65, 110, 85].map(
                  (h, i) => (
                    <span key={i} style={{ height: h }} />
                  ),
                )}
              </div>
            </div>
            <div className="mini-donut">
              <span>
                6<small>顧客</small>
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
export default function Home() {
  return (
    <>
      <Header />
      <main id="main">
        <section className="hero">
          <div className="hero-copy">
            <div className="availability">
              <span /> SMALL TASKS, REAL SOLUTIONS
            </div>
            <h1>
              小さな改善で、
              <br />
              仕事はもっと
              <br />
              <span>軽くなる。</span>
            </h1>
            <p className="hero-subtitle">Web開発・業務自動化を短納期で対応</p>
            <p className="hero-description">
              Webの修正も、繰り返す手作業も。
              <br />
              必要な機能を、使いやすい形に。
              <br />
              小規模な案件から、丁寧に仕上げます。
            </p>
            <div className="hero-actions">
              <Link className="button primary" href="#works">
                制作デモを見る <ArrowUpRight size={18} />
              </Link>
              <Link className="text-link" href="#services">
                対応可能な業務 <ArrowRight size={16} />
              </Link>
            </div>
            <div className="hero-checks">
              <span>
                <Check /> 小規模案件歓迎
              </span>
              <span>
                <Check /> 既存コードの修正OK
              </span>
            </div>
          </div>
          <div className="hero-art">
            <div className="art-caption">
              <span className="eyebrow">FROM MANUAL TO SIMPLE</span>
              <span>01 — 03</span>
            </div>
            <div className="workflow-card">
              <span className="app-icon">
                <Workflow />
              </span>
              <div>
                <small>いつもの手作業を</small>
                <strong>シンプルな仕組みに。</strong>
              </div>
              <span className="live-dot" />
            </div>
            <div className="hero-dashboard">
              <div className="dashboard-header">
                <span>
                  <Command size={15} /> WORKSPACE
                </span>
                <span className="pill">DEMO</span>
              </div>
              <div className="dashboard-title">
                業務の、ひとつ先へ。<span>繰り返す作業をまとめて自動化</span>
              </div>
              <div className="task-flow">
                <div>
                  <FileSpreadsheet />
                  <span>データ読込</span>
                </div>
                <ArrowRight />
                <div className="flow-active">
                  <Workflow />
                  <span>自動処理</span>
                </div>
                <ArrowRight />
                <div>
                  <Check />
                  <span>完了</span>
                </div>
              </div>
              <div className="processing-result">
                <span className="check-circle">
                  <Check />
                </span>
                <div>
                  <strong>データの整理が完了しました</strong>
                  <span>重複除去・表記統一・CSV出力</span>
                </div>
                <span className="green">✓</span>
              </div>
              <div className="hero-metrics">
                <div>
                  <small>読み込み</small>
                  <strong>
                    125 <span>件</span>
                  </strong>
                </div>
                <div>
                  <small>整理後</small>
                  <strong>
                    98 <span>件</span>
                  </strong>
                </div>
                <div>
                  <small>重複を除去</small>
                  <strong className="green">
                    27 <span>件</span>
                  </strong>
                </div>
              </div>
            </div>
            <div className="floating-note">
              <ShieldCheck size={19} />
              <span>設計からテスト・納品まで</span>
              <Check size={16} />
            </div>
            <p className="art-footnote">自主制作デモの処理例です</p>
          </div>
        </section>
        <div className="tech-strip">
          <span>IDEAS INTO WORKING TOOLS</span>
          <p>
            Next.js <i>/</i> TypeScript <i>/</i> React <i>/</i> 業務自動化{" "}
            <i>/</i> API連携
          </p>
        </div>
        <section id="works" className="section works-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">SELECTED DEMOS</span>
              <h2>触ってわかる、できること。</h2>
            </div>
            <p>
              すべてブラウザで操作できる自主制作デモ。
              <br />
              あなたの業務に置き換えて、お試しください。
            </p>
          </div>
          <div className="demo-grid">
            {demos.map(({ id, n, title, name, description, tags, Icon }) => (
              <Link className="demo-card" href={`/demos/${id}`} key={id}>
                <Preview type={id} />
                <div className="demo-card-body">
                  <div className="demo-label">
                    <span>
                      <Icon size={16} /> {title}
                    </span>
                    <small>{n}</small>
                  </div>
                  <h3>{name}</h3>
                  <p>{description}</p>
                  <div className="card-tags">
                    {tags.map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                  <div className="card-link">
                    デモを操作する <ArrowUpRight size={19} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <p className="demo-disclaimer">
            <ShieldCheck size={15} />{" "}
            掲載内容はすべて自主制作です。実際の顧客情報・受託実績は含みません。
          </p>
        </section>
        <section id="services" className="section services-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">WHAT I CAN HELP WITH</span>
              <h2>
                「ここだけお願い」にも、
                <br />
                お応えします。
              </h2>
            </div>
            <p>
              大きな開発でなくても大丈夫。
              <br />
              いま困っていることから、一緒に整理します。
            </p>
          </div>
          <div className="service-grid">
            {[
              {
                Icon: Code2,
                title: "Webサイト・アプリの修正",
                text: "表示崩れ、バグ、使いにくい画面を改善。既存コードへの機能追加も。",
                tags: "React / Next.js / TypeScript",
                examples: "レスポンシブ対応 · フォーム · テスト追加",
              },
              {
                Icon: Workflow,
                title: "手作業の自動化・データ加工",
                text: "CSVの整形・集計など、繰り返す作業を減らす小さなツールを制作。",
                tags: "ブラウザ処理 / CSV / JavaScript",
                examples: "重複除去 · 表記統一 · ダウンロード",
              },
              {
                Icon: PanelsTopLeft,
                title: "管理画面・業務ツール",
                text: "顧客情報や問い合わせをひとつに。業務に合わせたシンプルな画面を設計。",
                tags: "Next.js / React / localStorage",
                examples: "顧客管理 · 検索・絞り込み · 対応履歴",
              },
            ].map(({ Icon, title, text, tags, examples }) => (
              <article className="service" key={title}>
                <Icon size={25} />
                <h3>{title}</h3>
                <p>{text}</p>
                <small>{examples}</small>
                <div>{tags}</div>
              </article>
            ))}
          </div>
          <div className="scope-note">
            <b>そのほかのご相談</b>
            <p>
              Python・GAS /
              Googleスプレッドシート・Excel加工・API連携・公開情報の取得も、対象環境や利用条件を確認して対応可否を整理します。これらの外部連携は本デモには含みません。
            </p>
          </div>
        </section>
        <section className="section process-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">HOW WE WORK</span>
              <h2>小さく始めて、きちんと完成。</h2>
            </div>
            <p>
              要件が固まっていなくても大丈夫。
              <br />
              確認のタイミングを設け、認識を揃えて進めます。
            </p>
          </div>
          <ol className="process">
            {[
              ["相談", "課題やご希望を伺います"],
              ["要件整理", "範囲・費用・納期を確認"],
              ["実装", "まず動く形を提示"],
              ["確認", "実際の操作で確認"],
              ["修正", "合意した範囲で調整"],
              ["納品", "使い方とソースをお渡し"],
            ].map(([a, b], i) => (
              <li key={a}>
                <span>0{i + 1}</span>
                <h3>{a}</h3>
                <p>{b}</p>
              </li>
            ))}
          </ol>
        </section>
        <section id="profile" className="section profile-section">
          <div className="profile-mark">
            <Command size={54} />
            <span>BUILD WITH CARE.</span>
          </div>
          <div>
            <span className="eyebrow">ABOUT / 開発のスタンス</span>
            <h2>
              動くだけでなく、
              <br />
              安心して使えるところまで。
            </h2>
            <p>
              Web開発・業務自動化を中心に、小規模な改善・修正・ツール制作に取り組んでいます。要件を整理し、実際に動く成果物として仕上げることを重視しています。
            </p>
            <p>
              開発支援ツールも活用しながら、設計・実装・テスト・画面確認まで一貫して実施。操作方法がわかるドキュメントとともに、扱いやすい形でお渡しします。
            </p>
            <div className="feature-tags">
              <span>設計・要件整理</span>
              <span>実装・品質確認</span>
              <span>使い方のドキュメント</span>
            </div>
          </div>
        </section>
        <Contact />
      </main>
      <Footer />
    </>
  );
}
