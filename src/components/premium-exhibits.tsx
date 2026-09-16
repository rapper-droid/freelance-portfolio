import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  Layers,
  Code2,
  CircleCheck,
  Mail,
  Workflow,
  MousePointer2,
} from "lucide-react";
import type { CategoryId } from "@/lib/portfolio";
import { previewPath } from "@/lib/preview";

export function HeroExhibit() {
  return (
    <aside
      className="hero-exhibit"
      aria-label="TETSU WORKSの制作体験"
      data-reveal="image"
    >
      <div className="exhibit-index">
        <span>IDEAS, MADE REAL.</span>
        <span>01 — 11</span>
      </div>
      <Link href="/projects/cafe" className="exhibit-photo">
        <Image
          src="/visuals/kissa-ritual-v2.webp"
          alt="KISSA制作デモのコーヒーと焼き菓子。店舗の世界観を伝える写真"
          width={1440}
          height={960}
          sizes="(max-width: 700px) 90vw, 46vw"
          priority
        />
        <span className="exhibit-photo-label">
          <span>
            KISSA<small>HOSPITALITY / WEB EXPERIENCE</small>
          </span>
          <ArrowUpRight size={24} />
        </span>
      </Link>
      <Link
        href="/projects/inbox"
        className="exhibit-interface"
        aria-label="SMART INBOXの制作概要を見る"
      >
        <div className="exhibit-app-top">
          <span className="exhibit-app-icon">
            <Mail size={16} />
          </span>
          <b>SMART INBOX</b>
          <span>SUPPORT DESK</span>
        </div>
        <div className="exhibit-app-row">
          <span className="exhibit-avatar">S</span>
          <div>
            <b>今日の対応を、ひとつの場所で。</b>
            <small>受付 → 整理 → 確認 → 返信案</small>
          </div>
          <ArrowUpRight size={18} />
        </div>
        <div className="exhibit-app-bottom">
          <span>
            <i /> 人が判断する、自動化。
          </span>
          <span>INTERACTIVE DEMO ↗</span>
        </div>
      </Link>
      <p className="exhibit-caption">TETSU WORKS / 自主制作のWeb・業務ツール</p>
    </aside>
  );
}

export function WorksExhibit() {
  return (
    <div className="works-exhibit" aria-label="制作例のプレビュー">
      <Link href="/projects/cafe" className="works-exhibit-main">
        <Image
          src="/visuals/kissa-space-v2.webp"
          alt="KISSA — 自然光と木の質感を伝える店舗サイトの制作例"
          width={1440}
          height={960}
          priority
          sizes="(max-width: 700px) 90vw, 44vw"
        />
        <div>
          <span>01 / WEB EXPERIENCE</span>
          <b>
            KISSA <ArrowUpRight size={22} />
          </b>
        </div>
      </Link>
      <Link href="/projects/inbox" className="works-exhibit-tool">
        <div>
          <span>02 / WORKFLOW</span>
          <ArrowUpRight size={18} />
        </div>
        <Image
          src={previewPath("inbox", "desktop")}
          alt="SMART INBOXの実際に操作できる業務画面"
          width={1440}
          height={1000}
          sizes="(max-width: 700px) 80vw, 32vw"
        />
        <b>SMART INBOX</b>
      </Link>
      <span className="exhibit-stamp">
        DESIGN
        <br />
        BUILD
        <br />
        DELIVER.
      </span>
    </div>
  );
}

const categoryArt: Record<
  CategoryId,
  { slug: string; mode: string; label: string; title: string; steps: string[] }
> = {
  web: {
    slug: "cafe",
    mode: "editorial",
    label: "WEB EXPERIENCE",
    title: "世界観から、来店のきっかけまで。",
    steps: ["情報設計", "デザイン", "実装・公開準備"],
  },
  lp: {
    slug: "saas",
    mode: "screen",
    label: "LANDING EXPERIENCE",
    title: "読む流れが、行動につながる。",
    steps: ["価値を伝える", "不安を解く", "次の行動へ"],
  },
  coding: {
    slug: "creative",
    mode: "code",
    label: "DESIGN TO CODE",
    title: "細部まで、意図のある実装。",
    steps: ["構造", "スタイル", "インタラクション"],
  },
  nextjs: {
    slug: "saas",
    mode: "screen",
    label: "PRODUCT FOUNDATION",
    title: "育てていける、Webの土台。",
    steps: ["画面設計", "データの接続", "品質確認"],
  },
  responsive: {
    slug: "cafe",
    mode: "devices",
    label: "EVERY SCREEN, CONSIDERED",
    title: "どの画面にも、ちょうどいい。",
    steps: ["Desktop", "Tablet", "Mobile"],
  },
  improvement: {
    slug: "improvement",
    mode: "compare",
    label: "BEFORE → BETTER",
    title: "いまの価値を、伝わる形へ。",
    steps: ["課題を見つける", "優先して直す", "変化を確認する"],
  },
  ec: {
    slug: "ec",
    mode: "product",
    label: "PRODUCT EXPERIENCE",
    title: "触れられないものを、伝える。",
    steps: ["質感", "選びやすさ", "購入の導線"],
  },
  apps: {
    slug: "inbox",
    mode: "screen",
    label: "WORK, IN FOCUS",
    title: "毎日使うから、迷わない。",
    steps: ["一覧", "状況の把握", "次の操作"],
  },
  api: {
    slug: "booking",
    mode: "flow",
    label: "CONNECTED SYSTEMS",
    title: "別々の道具を、一つの流れに。",
    steps: ["入力・認証", "変換・接続", "結果・再試行"],
  },
  automation: {
    slug: "automation",
    mode: "flow",
    label: "HUMAN IN THE LOOP",
    title: "くり返しは仕組みに、判断は人に。",
    steps: ["受付", "分類・下書き", "人の確認"],
  },
  design: {
    slug: "creative",
    mode: "poster",
    label: "A DISTINCT POINT OF VIEW",
    title: "らしさは、細部に宿る。",
    steps: ["方向性", "ビジュアル", "フォーマット展開"],
  },
  qa: {
    slug: "qa",
    mode: "quality",
    label: "BUILT. CHECKED. DELIVERED.",
    title: "最後のひと手間が、信頼になる。",
    steps: ["操作確認", "修正・再確認", "記録・引き継ぎ"],
  },
};

export function CategoryExhibit({ id }: { id: CategoryId }) {
  const art = categoryArt[id];
  const flow = art.mode === "flow";
  return (
    <figure
      className={`category-exhibit exhibit-${art.mode}`}
      data-reveal="image"
    >
      <div className="exhibit-topline">
        <span>{art.label}</span>
        <span>BY TETSU WORKS</span>
      </div>
      <div className="category-art-stage">
        {art.mode === "editorial" ? (
          <>
            <Image
              className="category-editorial-image"
              src="/visuals/kissa-ritual-v2.webp"
              alt="店舗の空気感を伝えるKISSAの制作イメージ"
              width={1440}
              height={960}
              priority
              sizes="(max-width: 700px) 90vw, 44vw"
            />
            <span className="category-photo-title">
              KISSA<small>COFFEE & QUIET MOMENTS</small>
            </span>
          </>
        ) : art.mode === "product" ? (
          <Image
            className="category-product-image"
            src="/visuals/forme-sage-v1.webp"
            alt="FORMEの商品を質感とともに紹介するビジュアル"
            width={1200}
            height={1200}
            priority
            sizes="(max-width: 700px) 85vw, 42vw"
          />
        ) : flow ? (
          <div className="exhibit-flow">
            <div className="flow-source">
              <Mail size={25} />
              <span>
                REQUEST<small>新しい依頼</small>
              </span>
              <span className="flow-pulse" />
            </div>
            <span className="flow-connector" />
            <div className="flow-transform">
              <Workflow size={28} />
              <div>
                <small>
                  {id === "api" ? "CONNECT & TRANSFORM" : "CLASSIFY & PREPARE"}
                </small>
                <b>
                  {id === "api"
                    ? "データを、使える形へ。"
                    : "必要な情報が、揃って届く。"}
                </b>
              </div>
            </div>
            <div className="flow-destinations">
              <div>
                <CircleCheck size={18} />
                <b>{id === "api" ? "処理結果" : "確認する"}</b>
                <small>{id === "api" ? "結果を記録" : "判断は人に"}</small>
              </div>
              <div>
                <Layers size={18} />
                <b>{id === "api" ? "再試行" : "引き継ぐ"}</b>
                <small>{id === "api" ? "失敗にも備える" : "次の担当へ"}</small>
              </div>
            </div>
          </div>
        ) : art.mode === "quality" ? (
          <div className="quality-exhibit">
            <CircleCheck size={60} strokeWidth={1} />
            <b>
              DELIVERY
              <br />
              CONFIDENCE.
            </b>
            <div>
              {[
                "操作 / Keyboard",
                "表示 / Responsive",
                "引継ぎ / Documents",
              ].map((text) => (
                <span key={text}>
                  <Check size={16} />
                  {text}
                </span>
              ))}
            </div>
            <small>納品時に確認する観点</small>
          </div>
        ) : art.mode === "code" ? (
          <div className="code-exhibit">
            <Code2 size={24} />
            <div className="code-layout">
              <div>
                <span>HEADER</span>
                <b>
                  IDEA TO
                  <br />
                  INTERFACE.
                </b>
                <i />
                <i />
              </div>
              <aside>
                <span>01 / STRUCTURE</span>
                <span>02 / STYLE</span>
                <span>03 / BEHAVIOR</span>
                <MousePointer2 size={24} />
              </aside>
            </div>
            <small>意味のある構造から、触れられる体験へ。</small>
          </div>
        ) : (
          <>
            <Image
              className="category-screen"
              src={previewPath(art.slug, "desktop")}
              alt={`${art.title} 実装済み制作デモの画面`}
              width={1440}
              height={1000}
              priority
              sizes="(max-width: 700px) 85vw, 42vw"
            />
            {art.mode === "devices" && (
              <Image
                className="category-phone"
                src={previewPath(art.slug, "mobile")}
                alt="同じ制作例のスマートフォン表示"
                width={390}
                height={844}
                sizes="(max-width: 700px) 25vw, 12vw"
              />
            )}
            {art.mode === "compare" && (
              <span className="category-overlay">情報の順番 × 余白 × 導線</span>
            )}
          </>
        )}
      </div>
      <figcaption>
        <b>{art.title}</b>
        <ol>
          {art.steps.map((step, i) => (
            <li key={step}>
              <span>0{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </figcaption>
    </figure>
  );
}

export function DeliveryRibbon() {
  return (
    <div className="delivery-ribbon">
      <span>
        <Layers size={18} />
        設計から実装まで
      </span>
      <span>
        <CircleCheck size={18} />
        触って確かめられる制作例
      </span>
      <Link href="/#contact">
        TETSU WORKSに相談する <ArrowRight size={16} />
      </Link>
    </div>
  );
}
