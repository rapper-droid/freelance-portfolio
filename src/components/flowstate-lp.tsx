"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Download, X } from "lucide-react";
import { WorkspaceVisual } from "./project-visuals";
import {
  ADOPTION_STEPS,
  CAPABILITIES,
  SAMPLE_WEEK,
  STATUS_LABELS,
  summariseWeek,
  weeklyMarkdown,
} from "@/lib/flowstate/summary";

/**
 * FLOWSTATE — the SaaS page, with the parts that were missing (指示書 §17).
 *
 * §17 lists what a service page owes a reader: what it does, what changes
 * when you use it, **the actual output**, how you would adopt it, what it
 * covers, what permissions it would want, what it connects to, and a route
 * into something real.
 *
 * The output is the part worth insisting on. The weekly summary below is
 * generated from the sample week and downloaded as a file that opens — not a
 * screenshot of a file. The capability table says plainly which connections
 * exist here (two) and which do not (four), because a feature list that does
 * not distinguish them is a list of intentions.
 *
 * The pricing stays fictional and says so twice: once beside the figures and
 * once in the questions.
 */

function download(text: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const BEFORE_AFTER: Array<[string, string, string]> = [
  [
    "金曜の夕方",
    "三つの表とチャットを遡って、今週なにが終わったかを思い出す。",
    "今週のまとめが出来ている。読んで直すだけ。",
  ],
  [
    "止まっている仕事",
    "誰かが気づくまで止まったまま。気づくのはたいてい月曜。",
    "「待ち」として先に上がる。理由と担当が一緒に見える。",
  ],
  [
    "引き継ぎ",
    "口頭とメモ。抜けたものは翌週に分かる。",
    "同じまとめを渡せる。抜けたかどうかは書式で分かる。",
  ],
];

export function FlowstateLp() {
  const [annual, setAnnual] = useState(false);
  const [notice, setNotice] = useState("");
  const summary = summariseWeek();

  return (
    <div className="saas-demo showcase">
      <nav className="demo-local-nav" aria-label="SaaSデモ内">
        <b>◈ FLOWSTATE</b>
        <a href="#folio-features">機能</a>
        <a href="#folio-output">出力</a>
        <a href="#folio-scope">対応範囲</a>
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
        <a href="#folio-output" className="button primary">
          実際の出力を見る <ArrowRight size={17} />
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

      <section className="demo-content-section" id="folio-before">
        <h2>使う前と、使ったあと</h2>
        <div className="flowstate-compare">
          {BEFORE_AFTER.map(([when, before, after]) => (
            <article key={when}>
              <h3>{when}</h3>
              <p className="flowstate-before">
                <X size={14} aria-hidden="true" /> {before}
              </p>
              <p className="flowstate-after">
                <Check size={14} aria-hidden="true" /> {after}
              </p>
            </article>
          ))}
        </div>
        <p className="demo-fineprint">
          作業の流れの説明です。時間短縮率や削減額は測定していないため、数値は
          書いていません。
        </p>
      </section>

      <section className="demo-content-section" id="folio-output" data-feature>
        <div className="demo-section-heading">
          <h2>実際の出力</h2>
          <span>サンプルの一週間から生成</span>
        </div>
        <p>
          金曜に届くまとめです。下の表とまったく同じ内容が、そのままファイルに
          なります。書き出したファイルはテキストエディタでもそのまま開けます。
        </p>

        <div className="flowstate-figures">
          {[
            ["全体", summary.total],
            ["完了", summary.done],
            ["進行中", summary.doing],
            ["待ち", summary.blocked],
            ["未着手", summary.todo],
          ].map(([label, value]) => (
            <div key={String(label)}>
              <span>{label}</span>
              <b>{value}</b>
            </div>
          ))}
        </div>

        <div
          className="flowstate-table-scroll"
          tabIndex={0}
          role="region"
          aria-label="サンプルの一週間"
        >
          <table className="flowstate-table">
            <caption className="sr-only">サンプルの一週間のタスク</caption>
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">項目</th>
                <th scope="col">担当</th>
                <th scope="col">プロジェクト</th>
                <th scope="col">状態</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_WEEK.map((task) => (
                <tr key={task.id} data-status={task.status}>
                  <th scope="row">{task.id}</th>
                  <td>{task.title}</td>
                  <td>{task.owner}</td>
                  <td>{task.project}</td>
                  <td>{STATUS_LABELS[task.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="showcase-actions">
          <button
            className="button primary"
            onClick={() => {
              download(
                weeklyMarkdown(),
                "flowstate-weekly-sample.md",
                "text/markdown;charset=utf-8",
              );
              setNotice(
                "flowstate-weekly-sample.md を書き出しました。上の表と同じ内容です。",
              );
            }}
          >
            <Download size={16} />
            今週のまとめを書き出す
          </button>
        </div>
        <p role="status" className="demo-fineprint">
          {notice ||
            "架空のサンプルデータです。実在の案件・担当者・取引先は含まれていません。"}
        </p>
      </section>

      <section className="demo-content-section" id="folio-scope">
        <h2>対応範囲・権限・接続</h2>
        <p>
          このページで実際に動いているものと、実装していないものを分けて書いて
          います。接続していないものは「未接続」と書き、できるふりをしません。
        </p>
        <div
          className="flowstate-table-scroll"
          tabIndex={0}
          role="region"
          aria-label="対応範囲"
        >
          <table className="flowstate-table">
            <caption className="sr-only">機能ごとの対応範囲と権限</caption>
            <thead>
              <tr>
                <th scope="col">領域</th>
                <th scope="col">対応範囲</th>
                <th scope="col">必要な権限</th>
                <th scope="col">このデモでの状態</th>
              </tr>
            </thead>
            <tbody>
              {CAPABILITIES.map((row) => (
                <tr key={row.area} data-connected={row.connected}>
                  <th scope="row">{row.area}</th>
                  <td>{row.covered}</td>
                  <td>{row.permission}</td>
                  <td>
                    <span className="flowstate-state">
                      {row.connected ? "動作します" : "未接続"}
                    </span>
                    <small>{row.note}</small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="demo-content-section" id="folio-adopt">
        <h2>導入のしかた</h2>
        <ol className="flowstate-steps">
          {ADOPTION_STEPS.map((step) => (
            <li key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.detail}</p>
            </li>
          ))}
        </ol>
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
        <p className="flowstate-price-warning">
          <strong>以下は架空の想定価格です。</strong>
          このサービスは販売しておらず、登録・課金・契約はできません。実際の
          制作のご依頼料金とは関係ありません。
        </p>
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

      <section className="demo-content-section" id="folio-real">
        <h2>実際に操作できるものへ</h2>
        <p>
          この LP は架空のサービスですが、同じ考えかたで作った
          <strong>実際に動く画面</strong>がこのサイトにあります。
        </p>
        <ul className="flowstate-real">
          <li>
            <Link href="/demos/automation">RELAY — 問い合わせの受付と確認</Link>
            <span>分類・下書き・人の確認まで、記録が残ります。</span>
          </li>
          <li>
            <Link href="/demos/inbox">SMART INBOX — 対応状況の管理</Link>
            <span>RELAY が受け付けた分がそのまま届きます。</span>
          </li>
          <li>
            <Link href="/flow">入力を減らす — 実際の処理</Link>
            <span>決定的なルールで日時と金額を読み取ります。</span>
          </li>
        </ul>
      </section>

      <section className="demo-content-section faq">
        <h2>よくある質問</h2>
        {[
          [
            "これは利用できるサービスですか？",
            "SaaSの魅力を伝えるための自主制作LPです。プロダクト画面はデザインプレビューで、登録・課金はありません。上の「実際の出力」だけは本物で、押すとファイルが作られます。",
          ],
          [
            "表示されている料金は本物ですか？",
            "架空です。このサービスは販売していません。制作のご依頼料金は制作概要のページに別途記載しています。",
          ],
          [
            "外部サービスと連携していますか？",
            "していません。「対応範囲・権限・接続」の表に、未接続のものを未接続として書いています。",
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
