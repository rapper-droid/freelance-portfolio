import {
  evidence,
  formatStamp,
  STATUS_LABELS,
  summarise,
} from "@/lib/qa-evidence";

/**
 * The real verification record on the quality page (指示書 §10, U08).
 *
 * Deliberately separate from the checklist beside it. The checklist records
 * what a person confirmed by hand; this records what the machine actually
 * ran, against which commit, and when. Mixing the two is how "I ticked a box"
 * starts reading as "the tests passed".
 *
 * Nothing here is generated at view time. Pressing something on this page can
 * never turn a row green.
 */
export function QaEvidencePanel() {
  const summary = summarise(evidence);

  return (
    <section className="qa-evidence" aria-labelledby="qa-evidence-heading">
      <div className="qa-evidence-head">
        <span className="eyebrow">AUTOMATED VERIFICATION / 自動検査の記録</span>
        {/* h2: the frame above renders the h1 and the demo below opens with
            its own h2, so h3 here would skip a level. */}
        <h2 id="qa-evidence-heading">
          この記録は、実際に走った検査の結果です。
        </h2>
        <p>
          {
            "下のチェックリストは人が手で確認した記録、こちらは機械が実行した記録です。画面の操作でこの表が変わることはありません。"
          }
        </p>
        <p className="qa-evidence-saved">
          <strong>これは保存済みの記録です。</strong>
          このページを開いたときに検査が走るわけではありません。下の表は{" "}
          <code>{evidence.commitShort}</code> の時点で実行した結果を
          <code>docs/qa-evidence.json</code>{" "}
          {
            "に保存したもので、各行の「再現手順」をそのまま実行すれば同じ検査を手元で走らせられます。"
          }
        </p>
      </div>

      <dl className="qa-evidence-meta">
        <div>
          <dt>対象コミット</dt>
          <dd>
            <code>{evidence.commitShort}</code>
          </dd>
        </div>
        <div>
          <dt>記録日時</dt>
          <dd>{formatStamp(evidence.generatedAt)}</dd>
        </div>
        <div>
          <dt>結果</dt>
          <dd>
            PASS {summary.passed} / FAIL {summary.failed} / 未実施{" "}
            {summary.notRun}
          </dd>
        </div>
      </dl>

      {(summary.stale || summary.dirty) && (
        <p className="qa-evidence-warning">
          {summary.dirty &&
            "この記録は未コミットの変更がある状態で取得されました。"}
          {summary.stale &&
            `この記録は ${summary.ageInDays} 日前のものです。現在のコードと一致しない可能性があります。`}
        </p>
      )}

      {/* Focusable: the table gained a reproduce column and now scrolls
          sideways at tablet width, and a scroll region nobody can reach with
          a keyboard is a region some readers cannot read. CI caught this at
          768px where the local run did not — Linux metrics, wider table. */}
      <div
        className="qa-evidence-scroll"
        tabIndex={0}
        role="region"
        aria-label="自動検査の実行結果"
      >
        <table className="qa-evidence-table">
          <caption className="sr-only">自動検査の実行結果</caption>
          <thead>
            <tr>
              <th scope="col">検査</th>
              <th scope="col">結果</th>
              <th scope="col">内容</th>
              <th scope="col">実行日時</th>
              <th scope="col">再現手順</th>
            </tr>
          </thead>
          <tbody>
            {evidence.suites.map((suite) => (
              <tr key={suite.id} data-status={suite.status}>
                <th scope="row">{suite.label}</th>
                <td data-label="結果">
                  {/* Status is words, not colour alone (指示書 U04). */}
                  <span className="qa-evidence-status">
                    {STATUS_LABELS[suite.status]}
                  </span>
                </td>
                <td data-label="内容">{suite.detail ?? suite.reason ?? "—"}</td>
                <td data-label="実行日時">{formatStamp(suite.checkedAt)}</td>
                <td data-label="再現手順">
                  {suite.command ? <code>{suite.command}</code> : "—"}
                  {suite.source && (
                    <small>
                      記録元 <code>{suite.source}</code>
                    </small>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="qa-evidence-note">
        {
          "「未実施」は失敗ではなく、この記録に含めていない検査です。PASS には数えていません。理由と再現手順は同じ行に書いています。記録には件数・日時・コミットハッシュだけを含み、失敗内容の本文・ファイルの中身・環境変数は含めていません。"
        }
      </p>
    </section>
  );
}
