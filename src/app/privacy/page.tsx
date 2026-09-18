import Link from "next/link";
import { HqHeader, HqFooter } from "@/components/hq/shell";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "プライバシー",
  "相談情報と匿名計測の取り扱い",
  "/privacy",
);

const sections = [
  {
    id: "inquiry",
    title: "ご相談の情報",
    body: [
      "送信に同意された相談内容・返信先を、見積もり・返信・制作の相談対応に使用します。Resendを通じて運営者のメールへ届けます。広告配信やAI学習への利用は行いません。相談本文へ秘密情報や第三者の個人情報を含めないでください。",
      "案件サイト内で進めたい場合は相談内容をコピーし、同サービスのメッセージからご連絡ください。コピー操作だけでは本文を外部送信しません。",
    ],
  },
  {
    id: "storage",
    title: "安全性と保存",
    body: [
      "入力途中の情報は、同じタブのsessionStorageへ一時保存します。2時間を超えた下書きは復元せず、受付成功時に削除します。端末を共有する場合は相談後にタブを閉じてください。下書きをサーバーへ保存したり、localStorageへ長期保存したりしません。",
      "受付番号・重複防止用の照合値・送信状態は、最長7日間の期限付きで管理します。受付通知とは別に、ご入力のメールアドレスへ自動受付メールをお送りします。",
      "Turnstileによるスパム検証を使用します。送信回数と重複判定は、ホスティング基盤の保存領域（Cloudflare Durable Objects）へ期限付きで保存し、本文・メールアドレス・生のIPアドレスは保存しません。メールとホスティング側のログは各サービスで管理されます。不要になった相談メールは運営者が削除します。削除の希望は返信メールまたはご利用中の案件サイトのメッセージからお知らせください。",
    ],
  },
  {
    id: "measurement",
    title: "任意の利用状況計測と障害検知",
    body: [
      "有効な場合、PostHogへ閲覧カテゴリ・作品・料金閲覧・相談操作と流入元の分類（crowdworks / lancers / direct / other）を送ります。タブ内で30分間の匿名IDを使います。本文・メールアドレス・URLクエリそのもの・永続ID・録画は送りません。DNT / GPCが有効なブラウザでは計測しません。",
      "Sentryへ個人情報を除いた障害の種類を送信することがあります。フォーム入力や秘密鍵は送信しません。",
    ],
  },
];

/** A TSUDOWA-wide document: it covers TETSU WORKS and every contact form. */
export default function Privacy() {
  return (
    <div className="hq-site hq-document-page">
      <HqHeader />
      <main id="main">
        <section className="hq-subhero hq-section hq-document-hero">
          <Link prefetch={false} href="/" className="hq-breadcrumb">
            TSUDOWA <span>/ PRIVACY</span>
          </Link>
          <h1>プライバシーの取り扱い</h1>
          <p>
            ご相談の情報と、任意の利用状況計測について。TSUDOWAとTETSU
            WORKSのすべてのページ・問い合わせ窓口に共通です。
          </p>
          <p className="hq-document-updated">2026.09.18 改定</p>
        </section>
        <div className="hq-section hq-document">
          <nav className="hq-document-toc" aria-label="このページの目次">
            <span className="hq-section-index">CONTENTS</span>
            <ol>
              {sections.map((section, index) => (
                <li key={section.id}>
                  <a href={"#" + section.id}>
                    <span>0{index + 1}</span>
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="hq-document-body">
            {sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                aria-labelledby={section.id + "-title"}
              >
                <span className="hq-document-n">0{index + 1}</span>
                <h2 id={section.id + "-title"}>{section.title}</h2>
                {section.body.map((text) => (
                  <p key={text.slice(0, 24)}>{text}</p>
                ))}
              </section>
            ))}
            <p className="hq-document-note">
              ご相談の窓口は
              <Link prefetch={false} href="/contact/general">
                TSUDOWAへのお問い合わせ
              </Link>
              、制作のご相談は
              <Link prefetch={false} href="/contact">
                TETSU WORKSの相談窓口
              </Link>
              から。
            </p>
          </div>
        </div>
      </main>
      <HqFooter />
    </div>
  );
}
