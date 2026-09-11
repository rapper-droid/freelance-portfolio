import Image from "next/image";

export function WorkspaceVisual() {
  return (
    <figure
      className="workspace-visual"
      aria-label="チームの作業を一覧にするUIコンセプト"
    >
      <figcaption>
        <span>FLOWSTATE / WORKSPACE</span>
        <span>UI CONCEPT</span>
      </figcaption>
      <div className="workspace-heading">
        <div>
          <small>PROJECT OVERVIEW</small>
          <h3>Launch, together.</h3>
          <p>担当と次のアクションを、ひとつの場所に。</p>
        </div>
        <div
          className="workspace-avatars"
          aria-label="デザイン・開発・QAの連携"
        >
          <span>DS</span>
          <span>DEV</span>
          <span>QA</span>
        </div>
      </div>
      <div className="workspace-board">
        {[
          ["01 / PLAN", "要件を整理", "サイト構成を確認", "DESIGN"],
          ["02 / BUILD", "制作を進める", "商品ページを実装", "DEVELOPMENT"],
          ["03 / REVIEW", "チームで確認", "モバイル表示を確認", "QUALITY"],
        ].map(([step, title, task, role], i) => (
          <div key={step}>
            <span>{step}</span>
            <h4>{title}</h4>
            <article>
              <span className="workspace-tag">{role}</span>
              <p>{task}</p>
              <div className="workspace-lines" aria-hidden="true">
                <i />
                <i />
              </div>
              <footer>
                <b>{String(i + 1).padStart(2, "0")}</b>
                <span>担当と進捗を共有</span>
              </footer>
            </article>
          </div>
        ))}
      </div>
      <div className="workspace-bottom">
        <span>ONE WORKSPACE. CLEAR NEXT STEPS.</span>
        <span>架空のプロジェクト表示例</span>
      </div>
    </figure>
  );
}

export function WorkflowVisual() {
  return (
    <figure className="workflow-visual">
      <figcaption>
        <span>SMART INBOX / WORKFLOW</span>
        <span>HUMAN IN CONTROL</span>
      </figcaption>
      <ol>
        {[
          ["01", "受信内容", "問い合わせを一覧化"],
          ["02", "分類・優先度", "ルールで整理"],
          ["03", "担当・下書き", "対応を準備"],
          ["04", "人が確認", "送信前に判断"],
        ].map(([n, title, body]) => (
          <li key={n}>
            <span>{n}</span>
            <strong>{title}</strong>
            <small>{body}</small>
          </li>
        ))}
      </ol>
      <p>
        このデモは固定ルールによるローカル処理です。AI
        API・自動送信は使用しません。
      </p>
    </figure>
  );
}

export function ProjectVisualStory({ slug }: { slug: string }) {
  if (!["cafe", "saas", "ec", "inbox", "improvement", "qa"].includes(slug))
    return null;
  return (
    <section
      className={`hub-section visual-story visual-story-${slug}`}
      aria-label="制作の完成イメージ"
    >
      <span className="eyebrow">VISUAL DIRECTION</span>
      {slug === "cafe" ? (
        <>
          <h2>訪れる前に、空気感まで。</h2>
          <p>店舗の温かさと、コーヒーの質感を伝える写真構成。</p>
          <div className="visual-photo-pair">
            <figure>
              <Image
                src="/visuals/kissa-interior-v1.webp"
                alt="木の家具と窓からの自然光が温かい架空カフェの店内"
                width={1200}
                height={800}
                sizes="(max-width: 700px) 90vw, 55vw"
              />
              <figcaption>SPACE / 店舗の世界観を伝える</figcaption>
            </figure>
            <figure>
              <Image
                src="/visuals/kissa-coffee-v1.webp"
                alt="ラテアートのコーヒーと焼き菓子"
                width={1200}
                height={800}
                sizes="(max-width: 700px) 90vw, 30vw"
              />
              <figcaption>CRAFT / 一杯と過ごす時間</figcaption>
            </figure>
          </div>
          <p className="honesty-note">
            AI生成の架空店舗・メニューのイメージです。
          </p>
        </>
      ) : slug === "ec" ? (
        <>
          <h2>かたち、質感、使う場面。</h2>
          <p>
            商品の全体像と素材の寄りを分け、購入前に確かめたい情報を伝えます。
          </p>
          <div className="visual-photo-pair">
            <figure>
              <Image
                src="/visuals/forme-sage-v1.webp"
                alt="明るいデスクに置いたセージ色の架空タンブラー"
                width={1200}
                height={800}
                sizes="(max-width: 700px) 90vw, 55vw"
              />
              <figcaption>EVERYDAY / デスクになじむ佇まい</figcaption>
            </figure>
            <figure>
              <Image
                src="/visuals/forme-texture-v1.webp"
                alt="タンブラーのマットな表面とふたの接合部分のイメージ"
                width={480}
                height={720}
                sizes="(max-width: 700px) 70vw, 25vw"
              />
              <figcaption>DETAIL / 質感を近くで見る</figcaption>
            </figure>
          </div>
          <p className="honesty-note">
            AI生成の商品コンセプト。実在商品の写真・性能を示すものではありません。
          </p>
        </>
      ) : slug === "saas" ? (
        <>
          <h2>機能を、使う場面で伝える。</h2>
          <WorkspaceVisual />
        </>
      ) : slug === "inbox" ? (
        <>
          <h2>自動化する範囲と、人の判断。</h2>
          <WorkflowVisual />
        </>
      ) : (
        <>
          <h2>
            {slug === "qa"
              ? "確認から納品まで、見える形に。"
              : "情報の優先順位を、見比べる。"}
          </h2>
          <ol className="visual-evidence">
            {(slug === "qa"
              ? [
                  ["CHECK", "表示・操作を確認"],
                  ["RECORD", "結果と注意点を記録"],
                  ["DELIVER", "ソース・READMEを整理"],
                ]
              : [
                  ["BEFORE", "情報の強弱がない"],
                  ["FOCUS", "見出し・余白・CTAを整理"],
                  ["AFTER", "次の行動が分かる"],
                ]
            ).map(([label, text]) => (
              <li key={label}>
                <span>{label}</span>
                <strong>{text}</strong>
              </li>
            ))}
          </ol>
          <p className="honesty-note">
            デモでは比較切替・チェック操作を実際に試せます。数値成果や外部テスト結果を示すものではありません。
          </p>
        </>
      )}
    </section>
  );
}
