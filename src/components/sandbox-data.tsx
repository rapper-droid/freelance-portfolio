"use client";

import { useRef, useState, type ReactNode } from "react";
import { downloadText, stamp } from "@/lib/runtime/download";
import { readBackup, forgetBackup } from "@/lib/runtime/sandbox";
import "./sandbox-data.css";

/**
 * What a visitor can do with their own copy of a demo's data (指示書 §18).
 *
 * The three sandboxes already migrated and reset. What they could not do was
 * leave: someone who set up a basket, a booking and a back-office state on a
 * laptop had no way to show it on a phone, and no way to keep it across a
 * cleared browser. Reset was the only exit, and it only destroyed.
 *
 * So: write it out, read it back, and — when a load went wrong — recover the
 * copy that was kept instead of the data that was lost. The import is the
 * store's own migration, so a file exported from an older build still opens.
 *
 * One panel, three experiences. The labels differ; the promises do not.
 */

export type SandboxDataProps = {
  /** e.g. "kissa" — used for the download name and nothing else. */
  name: string;
  storageKey: string;
  /** What the visitor calls this data, e.g. "注文と予約". */
  label: string;
  /** Serialises the current state. */
  onExport: () => string;
  /** Returns an error message, or null when the file was accepted. */
  onImport: (text: string) => string | null;
  onReset: () => void;
  disclosure: string;
  /** Extra copy the experience wants inside the panel. */
  children?: ReactNode;
  /** Class prefix for the section, so each shop keeps its own typography. */
  theme: string;
  /** The host's own button class: the shops and the demo canvas differ. */
  buttonClass: string;
};

export function SandboxData({
  name,
  storageKey,
  label,
  onExport,
  onImport,
  onReset,
  disclosure,
  children,
  theme,
  buttonClass,
}: SandboxDataProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"ok" | "error">("ok");
  // Read once per interaction rather than on every render: this touches
  // storage, which can throw, and the panel must render regardless.
  const [backup, setBackup] = useState(() => {
    try {
      return readBackup(storageKey);
    } catch {
      return null;
    }
  });

  const say = (text: string, kind: "ok" | "error" = "ok") => {
    setTone(kind);
    setMessage(text);
  };

  const accept = (text: string, source: string) => {
    const error = onImport(text);
    if (error) return say(error, "error");
    say(`${source}から${label}を読み込みました。`);
    setBackup(null);
  };

  return (
    <section className={`sandbox-data ${theme}-sandbox-data`}>
      <h2>この端末のデータ</h2>
      <p className="sandbox-data-lead">{disclosure}</p>
      {children}

      <div className="sandbox-data-actions">
        <button
          type="button"
          className={buttonClass}
          onClick={() => {
            downloadText(
              onExport(),
              `${name}-${stamp(new Date().toISOString())}.json`,
              "application/json",
            );
            say("書き出しました。別の端末ではこのファイルを読み込めます。");
          }}
        >
          {label}を書き出す
        </button>

        <button
          type="button"
          className={buttonClass}
          onClick={() => fileRef.current?.click()}
        >
          書き出したファイルを読み込む
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-label={`${label}のファイルを選ぶ`}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            // Clearing the value lets the same file be picked twice running.
            event.target.value = "";
            if (!file) return;
            try {
              accept(await file.text(), "ファイル");
            } catch {
              say("ファイルを読み込めませんでした。", "error");
            }
          }}
        />

        <button
          type="button"
          className={buttonClass}
          onClick={() => {
            onReset();
            say(`この端末の${label}を初期化しました。`);
          }}
        >
          この端末のデータを初期化する
        </button>
      </div>

      {backup && (
        <div className="sandbox-data-backup">
          <p>
            {
              "読み込めなかったデータの控えが残っています。中身を確かめてから戻すか、控えごと削除できます。"
            }
          </p>
          <p className="sandbox-data-backup-meta">
            控えた日時{" "}
            <code>{backup.savedAtIso.slice(0, 19).replace("T", " ")}</code> /
            理由 <code>{backup.reason}</code>
          </p>
          <div className="sandbox-data-actions">
            <button
              type="button"
              className={buttonClass}
              onClick={() =>
                downloadText(
                  backup.text,
                  `${name}-backup-${stamp(backup.savedAtIso || new Date().toISOString())}.json`,
                  "application/json",
                )
              }
            >
              控えを書き出す
            </button>
            <button
              type="button"
              className={buttonClass}
              onClick={() => accept(backup.text, "控え")}
            >
              控えを戻す
            </button>
            <button
              type="button"
              className={buttonClass}
              onClick={() => {
                forgetBackup(storageKey);
                setBackup(null);
                say("控えを削除しました。");
              }}
            >
              控えを削除する
            </button>
          </div>
        </div>
      )}

      <p
        className={`sandbox-data-message${tone === "error" ? " is-error" : ""}`}
        role="status"
        aria-live="polite"
      >
        {message}
      </p>
    </section>
  );
}
