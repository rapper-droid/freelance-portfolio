"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="empty-page">
      <h1>画面を表示できませんでした</h1>
      <p>再試行するか、ページを再読み込みしてください。</p>
      <button className="button primary" onClick={reset}>
        再試行
      </button>
    </main>
  );
}
