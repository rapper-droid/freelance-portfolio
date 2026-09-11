"use client";
import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import Link from "next/link";
import { track } from "./analytics";
type Turnstile = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}
export function ContactSend({
  kind,
  detail,
  budget,
}: {
  kind: string;
  detail: string;
  budget: string;
}) {
  const [siteKey, setSiteKey] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const pending = useRef(false);
  const submission = useRef({ body: "", id: "" });
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/contact", { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => {
        setEnabled(d.enabled === true);
        setSiteKey(typeof d.siteKey === "string" ? d.siteKey : "");
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!ready || !open || !container.current || !window.turnstile) return;
    widget.current = window.turnstile.render(container.current, {
      sitekey: siteKey,
      action: "contact",
      size: "flexible",
      callback: (value: string) => setToken(value),
      "expired-callback": () => setToken(""),
      "error-callback": () => {
        setToken("");
        setMessage(
          "スパム確認を読み込めません。通信環境を確認するか、相談内容をコピーしてご連絡ください。",
        );
      },
    });
    return () => {
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = null;
    };
  }, [ready, open, siteKey]);
  if (!enabled || !siteKey)
    return (
      <p className="small muted">
        Webフォームの直接送信は現在準備中です。上のコピー機能で案件サイトからご相談いただけます。
      </p>
    );
  return (
    <div className="direct-contact">
      <button
        type="button"
        className="button secondary"
        aria-expanded={open}
        onClick={() => {
          setOpen(!open);
          track("portfolio_contact_open");
        }}
      >
        メールで相談する
      </button>
      {open && (
        <>
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            onReady={() => setReady(true)}
            onError={() =>
              setMessage(
                "スパム確認を読み込めません。相談内容のコピーをご利用ください。",
              )
            }
          />
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (pending.current || state === "success") return;
              if (detail.trim().length < 10) {
                setState("error");
                setMessage(
                  "上の「困っていること」を10文字以上で入力してください。",
                );
                return;
              }
              if (!token) {
                setState("error");
                setMessage("スパム確認の完了をお待ちください。");
                return;
              }
              const data = new FormData(e.currentTarget);
              const body = JSON.stringify({
                email: data.get("email"),
                kind,
                detail,
                budget,
              });
              if (submission.current.body !== body)
                submission.current = { body, id: crypto.randomUUID() };
              pending.current = true;
              setState("sending");
              setMessage("");
              track("portfolio_contact_submit");
              try {
                const response = await fetch("/api/contact", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    ...JSON.parse(body),
                    token,
                    id: submission.current.id,
                    consent: data.get("consent") === "on",
                    website: data.get("website"),
                  }),
                  signal: AbortSignal.timeout(25000),
                });
                if (!response.ok) {
                  setState("error");
                  setMessage(
                    response.status === 429 || response.status === 409
                      ? "送信回数の制限、または処理中です。1分以上待って再試行するか、相談内容をコピーしてご連絡ください。"
                      : "送信を確認できませんでした。入力は残っています。1分以上待って再試行するか、相談内容をコピーしてご連絡ください。",
                  );
                } else {
                  setState("success");
                  setMessage(
                    "ご相談を受け付けました。内容を確認して、ご入力のメールアドレスへ返信します。受付は制作の確約ではありません。",
                  );
                  track("portfolio_contact_success");
                }
              } catch {
                setState("error");
                setMessage(
                  "通信が中断され、送信結果を確認できませんでした。入力を変更せず1分以上待って再試行できます。",
                );
              } finally {
                pending.current = false;
                setToken("");
                if (widget.current) window.turnstile?.reset(widget.current);
              }
            }}
          >
            <p className="small">
              案件サイト経由のご相談は、サービス内メッセージを優先してください。直接相談をご希望の場合は以下から送信できます。
            </p>
            <label>
              返信先メールアドレス
              <input
                name="email"
                type="email"
                required
                maxLength={254}
                autoComplete="email"
                disabled={state === "sending" || state === "success"}
              />
            </label>
            <div className="contact-trap" aria-hidden="true">
              <label>
                Website
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>
            <p className="small">
              個人情報・秘密情報・未公開情報は相談本文に入力しないでください。入力内容と返信先は相談対応のためメールで送信します。
            </p>
            <label className="contact-consent">
              <input
                name="consent"
                type="checkbox"
                required
                disabled={state === "sending" || state === "success"}
              />
              <span>
                <Link href="/privacy">プライバシーの取り扱い</Link>
                を確認し、送信に同意します
              </span>
            </label>
            <div ref={container} />
            <button
              className="button primary"
              disabled={!token || state === "sending" || state === "success"}
            >
              {state === "sending"
                ? "送信中…"
                : state === "success"
                  ? "受付済み"
                  : "相談を送信する"}
            </button>
            <p role={state === "error" ? "alert" : "status"}>{message}</p>
          </form>
        </>
      )}
    </div>
  );
}
