"use client";
import { useEffect } from "react";
import Link from "next/link";
import { browserMonitoring } from "@/components/monitoring";
import { BrandMark } from "@/components/brand-mark";
export default function ErrorPage({ reset }: { reset: () => void }) {
  useEffect(() => {
    void browserMonitoring().then((s) =>
      s?.captureException(new Error("react_boundary")),
    );
  }, []);
  return (
    <div className="error-site">
      <header className="error-header">
        <Link className="error-home" href="/" prefetch={false}>
          <BrandMark />
          TSUDOWA
        </Link>
      </header>
      <main id="main" className="error-main">
        <p className="error-kicker">ERROR / 表示できませんでした</p>
        <h1>画面を表示できませんでした</h1>
        <p className="error-lead">
          再試行するか、ページを再読み込みしてください。問題が続く場合は、時間をおいてからお試しください。
        </p>
        <button className="error-button" onClick={reset}>
          再試行 <span aria-hidden="true">↻</span>
        </button>
        <nav className="error-paths" aria-label="主な入口">
          <Link href="/" prefetch={false}>
            <span>TSUDOWA</span>トップへ
          </Link>
          <Link href="/works" prefetch={false}>
            <span>TETSU WORKS</span>制作例・ご相談
          </Link>
        </nav>
      </main>
      <footer className="error-footer">TSUDOWA / GATHER. BUILD. EXPAND.</footer>
    </div>
  );
}
