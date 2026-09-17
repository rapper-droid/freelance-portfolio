"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import { ArrowUpRight, Check, Copy, ShieldCheck } from "lucide-react";
import { track } from "./analytics";
import {
  contactKinds,
  contactBudgets,
  contactStages,
  contactTimings,
  categoryKinds,
  contactContext,
  safeReference,
} from "@/lib/contact-options";
type Turnstile = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}
type Fields = {
  kind: string;
  detail: string;
  budget: string;
  stage: string;
  timing: string;
  reference: string;
  supplement: string;
  name: string;
  company: string;
  email: string;
};
const blank: Fields = {
  kind: contactKinds[7],
  detail: "",
  budget: "未定",
  stage: contactStages[5],
  timing: "未定",
  reference: "",
  supplement: "",
  name: "",
  company: "",
  email: "",
};
const DRAFT = "tsudowa-contact-draft-v2";
const validReceipt = (s: unknown): s is string =>
  typeof s === "string" && /^TSW-\d{6}-[A-F0-9]{10}$/.test(s);
export function ContactSend({
  initialKind = "",
  successHeading = "h3",
  general = false,
}: {
  initialKind?: string;
  successHeading?: "h2" | "h3";
  general?: boolean;
}) {
  const SuccessHeading = successHeading;
  const pathname = usePathname();
  const draftKey = general ? DRAFT + "-general" : DRAFT;
  const [fields, setFields] = useState<Fields>({
    ...blank,
    kind: general ? contactKinds[6] : blank.kind,
  });
  const [source, setSource] = useState(contactContext("/")!);
  const [loaded, setLoaded] = useState(false);
  const [config, setConfig] = useState<"loading" | "enabled" | "disabled">(
    "loading",
  );
  const [siteKey, setSiteKey] = useState("");
  const [scriptReady, setScriptReady] = useState(false);
  const [token, setToken] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<
    Partial<Record<keyof Fields | "consent", string>>
  >({});
  const [receipt, setReceipt] = useState("");
  const [draftNote, setDraftNote] = useState("");
  const [copied, setCopied] = useState("");
  const widgetEl = useRef<HTMLDivElement>(null),
    formRef = useRef<HTMLFormElement>(null),
    successRef = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null),
    pending = useRef(false),
    started = useRef(false);
  const submission = useRef({ signature: "", id: "", created: 0 });
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const from = new URLSearchParams(location.search).get("from");
      const context =
        contactContext(
          pathname === "/contact" ? from || "/contact" : pathname,
        ) || contactContext("/")!;
      let next = {
        ...blank,
        kind: general
          ? contactKinds[6]
          : categoryKinds[context.category] || blank.kind,
      };
      let restored = false;
      let nextSource = context;
      try {
        const saved = JSON.parse(sessionStorage.getItem(draftKey) || "null");
        if (
          saved &&
          Date.now() - saved.savedAt < 2 * 3600000 &&
          saved.fields &&
          contactContext(saved.page)
        ) {
          const keys = Object.keys(blank) as (keyof Fields)[];
          if (
            keys.every(
              (k) =>
                typeof saved.fields[k] === "string" &&
                saved.fields[k].length <= 2000,
            )
          ) {
            next = {
              ...next,
              ...Object.fromEntries(keys.map((k) => [k, saved.fields[k]])),
            };
            nextSource = contactContext(saved.page)!;
            if (
              saved.submission &&
              typeof saved.submission.signature === "string" &&
              /^[a-f0-9-]{36}$/.test(saved.submission.id) &&
              Date.now() - saved.submission.created < 23 * 3600000
            )
              submission.current = saved.submission;
            restored = true;
            started.current = true;
          }
        } else if (saved) sessionStorage.removeItem(draftKey);
      } catch {
        /* Storage is optional; the form remains usable. */
      }
      if (general) next.kind = contactKinds[6];
      setFields(next);
      setSource(nextSource);
      setLoaded(true);
      setDraftNote(
        restored ? "入力途中の相談を、このタブから復元しました。" : "",
      );
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname, general, draftKey]);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/contact", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        const on =
          d.enabled === true && typeof d.siteKey === "string" && !!d.siteKey;
        setConfig(on ? "enabled" : "disabled");
        setSiteKey(on ? d.siteKey : "");
      })
      .catch(() => {
        if (!controller.signal.aborted) setConfig("disabled");
      });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!loaded || state === "success") return;
    if (
      !started.current &&
      !fields.name &&
      !fields.email &&
      !fields.detail &&
      !fields.company &&
      !fields.reference &&
      !fields.supplement
    )
      return;
    try {
      sessionStorage.setItem(
        draftKey,
        JSON.stringify({
          fields,
          page: source.page,
          submission: submission.current,
          savedAt: Date.now(),
        }),
      );
    } catch {
      /* No persistent fallback. */
    }
  }, [fields, source, loaded, state, draftKey]);
  useEffect(() => {
    if (!scriptReady || !siteKey || !widgetEl.current || !window.turnstile)
      return;
    widget.current = window.turnstile.render(widgetEl.current, {
      sitekey: siteKey,
      action: "contact",
      size: "flexible",
      callback: (v: string) => setToken(v),
      "expired-callback": () => setToken(""),
      "error-callback": () => {
        setToken("");
        setMessage(
          "スパム確認を読み込めません。通信環境を確認して再読み込みしてください。下書きはこのタブに残ります。",
        );
      },
    });
    return () => {
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = null;
    };
  }, [scriptReady, siteKey]);
  function change(key: keyof Fields, value: string) {
    if (!started.current) {
      track("contact_started");
      started.current = true;
    }
    if (key === "kind") track("category_selected");
    setFields((v) => ({ ...v, [key]: value }));
    setErrors((v) => ({ ...v, [key]: undefined }));
  }
  function fieldError(key: keyof Fields | "consent") {
    return errors[key] ? (
      <span className="intake-field-error" id={"error-" + key}>
        {errors[key]}
      </span>
    ) : null;
  }
  const locked = state === "sending" || state === "success";
  const template = [
    general ? "【お問い合わせ】TSUDOWA全体" : "【依頼内容】" + fields.kind,
    "【相談内容】" + fields.detail,
    ...(!general
      ? [
          "【状況】" + fields.stage,
          "【予算】" + fields.budget,
          "【希望時期】" + fields.timing,
        ]
      : []),
    "【参考URL】" + fields.reference,
    "【補足】" + fields.supplement,
  ].join("\n");
  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending.current || state === "success") return;
    const data = new FormData(e.currentTarget);
    const invalid: typeof errors = {};
    if (!fields.name.trim()) invalid.name = "お名前を入力してください。";
    if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(fields.email))
      invalid.email = "返信先のメールアドレスを確認してください。";
    if (fields.detail.trim().length < 10)
      invalid.detail = "ご相談内容を10文字以上で入力してください。";
    if (!safeReference(fields.reference.trim()))
      invalid.reference = "http:// または https:// のURLを入力してください。";
    if (data.get("consent") !== "on")
      invalid.consent =
        "プライバシーの取り扱いを確認し、送信に同意してください。";
    setErrors(invalid);
    if (Object.keys(invalid).length) {
      track("contact_error");
      setState("error");
      setMessage("入力を確認してください。内容はそのまま残っています。");
      const first = Object.keys(invalid)[0];
      const input = formRef.current?.elements.namedItem(
        first,
      ) as HTMLElement | null;
      const details = input?.closest("details");
      if (details) details.open = true;
      input?.focus();
      return;
    }
    if (config !== "enabled") {
      setState("error");
      setMessage(
        "直接送信は準備中です。相談内容のコピー、または contact@tsudowa.com をご利用ください。",
      );
      return;
    }
    if (!token) {
      setState("error");
      setMessage("スパム確認が完了してから、もう一度送信してください。");
      return;
    }
    const body = { ...fields, ...source };
    const signature = JSON.stringify(body);
    if (submission.current.signature !== signature)
      submission.current = {
        signature,
        id: crypto.randomUUID(),
        created: Date.now(),
      };
    if (Date.now() - submission.current.created > 23 * 3600000) {
      setState("error");
      setMessage(
        "安全な再送期限を過ぎました。受付番号がある場合は添えて contact@tsudowa.com へご連絡ください。",
      );
      return;
    }
    pending.current = true;
    setState("sending");
    setMessage("");
    track("contact_submitted");
    track("portfolio_contact_submit");
    try {
      sessionStorage.setItem(
        draftKey,
        JSON.stringify({
          fields,
          page: source.page,
          submission: submission.current,
          savedAt: Date.now(),
        }),
      );
    } catch {}
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...body,
          id: submission.current.id,
          token,
          consent: true,
          website: data.get("website") || "",
        }),
        signal: AbortSignal.timeout(45000),
      });
      const result = await response.json();
      if (
        response.ok &&
        result.code === "accepted" &&
        result.confirmation === "sent" &&
        validReceipt(result.receipt)
      ) {
        setReceipt(result.receipt);
        setState("success");
        track("contact_success");
        track("portfolio_contact_success");
        try {
          sessionStorage.removeItem(draftKey);
        } catch {}
        requestAnimationFrame(() => successRef.current?.focus());
      } else {
        setState("error");
        track("contact_error");
        if (validReceipt(result.receipt)) setReceipt(result.receipt);
        const messages: Record<string, string> = {
          receipt_pending:
            "ご相談は受付済みですが、確認メールをまだ送れていません。入力を変えずに再試行すると確認メールだけを再送します。",
          rate: "短時間の送信回数に達しました。10分ほど待って再試行してください。",
          pending:
            "同じ相談を処理中です。入力を変えず、2分ほど待って再試行してください。",
          conflict:
            "この受付と入力内容が一致しません。受付番号を添えてメールでお問い合わせください。",
          expired:
            "安全な再送期限を過ぎました。受付番号を添えて contact@tsudowa.com へご連絡ください。",
          spam: "スパム確認の有効期限を確認してください。確認完了後、再試行できます。",
          invalid:
            "入力形式を確認してください。メールアドレス・文字数・参考URLを見直して再試行できます。",
          origin:
            "このページの送信元を確認できません。公式サイトから開き直してください。",
          capacity:
            "現在受付が混み合っています。時間を空けて再試行するか、メールでご相談ください。",
        };
        setMessage(
          messages[result.code] ||
            "送信を確認できませんでした。入力は残っています。1分以上待って、入力を変えずに再試行してください。",
        );
      }
    } catch {
      setState("error");
      track("contact_error");
      setMessage(
        "通信が中断され、送信結果を確認できませんでした。入力を変えずに再試行できます。下書きはこのタブに残っています。",
      );
    } finally {
      pending.current = false;
      setToken("");
      if (widget.current) window.turnstile?.reset(widget.current);
    }
  }
  return (
    <div className="contact-form intake-form">
      {state === "success" ? (
        <div
          className="intake-success"
          role="status"
          tabIndex={-1}
          ref={successRef}
        >
          <span className="intake-success-icon">
            <Check size={28} />
          </span>
          <span className="eyebrow">RECEIVED / THANK YOU</span>
          <SuccessHeading>
            お問い合わせを
            <br />
            受け付けました。
          </SuccessHeading>
          <p>
            確認メールを <b>{fields.email}</b> へ送信しました。
          </p>
          <dl>
            <dt>受付番号</dt>
            <dd>{receipt}</dd>
          </dl>
          <p>
            内容を確認 → 担当者からメールで返信。
            <br />
            追加の情報は、確認メールへそのまま返信できます。
          </p>
          <a href="mailto:contact@tsudowa.com">contact@tsudowa.com</a>
          <div className="hero-actions">
            <Link href="/works" className="button primary">
              制作事例を見る <ArrowUpRight size={16} />
            </Link>
            <Link href="/">TOPへ戻る</Link>
          </div>
          <button className="button secondary" disabled>
            受付済み
          </button>
        </div>
      ) : (
        <form
          id="intake-fields"
          ref={formRef}
          onSubmit={send}
          noValidate
          className="direct-contact"
        >
          <div className="intake-form-head">
            <span>
              {general ? "LET’S TALK / TSUDOWA" : "YOUR NEXT PROJECT"}
            </span>
            <small>必須はお名前・メール・ご相談内容</small>
          </div>
          {draftNote && (
            <p className="intake-draft" role="status">
              {draftNote}
            </p>
          )}
          {(source.demo || source.project) && (
            <p className="intake-source">
              「{source.demo || source.project}
              」のような制作について。種別・内容は自由に変更できます。
            </p>
          )}
          {initialKind && source.category && (
            <span className="sr-only">表示元: {initialKind}</span>
          )}
          {general && (
            <p className="intake-source">
              TSUDOWA全体へのお問い合わせ。制作のご相談は
              <Link href="/contact">TETSU WORKS窓口</Link>からも送れます。
            </p>
          )}
          {!general && (
            <fieldset disabled={locked} className="intake-kinds">
              <legend>
                <span>01</span> 何を相談したいですか？{" "}
                <small>未定でも大丈夫</small>
              </legend>
              <div className="intake-choice-grid">
                {contactKinds.map((kind) => (
                  <label
                    key={kind}
                    className={fields.kind === kind ? "selected" : ""}
                  >
                    <input
                      type="radio"
                      name="kind"
                      value={kind}
                      checked={fields.kind === kind}
                      onChange={() => change("kind", kind)}
                    />
                    <span>{kind}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <fieldset disabled={locked}>
            <legend>
              <span>{general ? "01" : "02"}</span> いま、考えていること
            </legend>
            <label htmlFor="intake-detail">
              ご相談内容 <small>必須</small>
            </label>
            <textarea
              id="intake-detail"
              name="detail"
              required
              rows={5}
              maxLength={2000}
              value={fields.detail}
              aria-invalid={!!errors.detail}
              aria-describedby="detail-help error-detail"
              onChange={(e) => change("detail", e.target.value)}
              placeholder={
                general
                  ? "例：TSUDOWAの活動について、コラボレーションの相談をしたいです。"
                  : "例：手作業で集計しているCSVを、一つの画面で整理できるようにしたいです。"
              }
            />
            {fieldError("detail")}
            <p id="detail-help" className="intake-help">
              {general
                ? "お問い合わせの背景や、お話ししたいことを自由に。"
                : "困っていること、つくりたいものを自由に。"}
              10〜2,000文字。秘密情報・パスワードは入力しないでください。
            </p>
            <details className="intake-options">
              <summary>
                {general
                  ? "参考URL・補足を添える"
                  : "予算・希望時期・参考資料を添える"}{" "}
                <small>任意</small>
              </summary>
              {!general && (
                <div className="intake-fields-grid">
                  {(
                    [
                      ["stage", "今の状況", contactStages],
                      ["budget", "予算の目安", contactBudgets],
                      ["timing", "希望時期", contactTimings],
                    ] as const
                  ).map(([key, label, options]) => (
                    <label key={key}>
                      {label}
                      <select
                        name={key}
                        value={fields[key]}
                        onChange={(e) => change(key, e.target.value)}
                      >
                        {options.map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              )}
              {!general && (
                <p className="intake-help">
                  予算・時期はご希望の目安です。制作範囲を確認してお見積もりします。
                </p>
              )}
              <label htmlFor="intake-reference">参考URL</label>
              <input
                id="intake-reference"
                name="reference"
                type="url"
                inputMode="url"
                maxLength={2000}
                value={fields.reference}
                onChange={(e) => change("reference", e.target.value)}
                placeholder="https://"
                aria-invalid={!!errors.reference}
                aria-describedby="error-reference"
              />
              {fieldError("reference")}
              <label htmlFor="intake-supplement">補足</label>
              <textarea
                id="intake-supplement"
                name="supplement"
                rows={2}
                maxLength={1000}
                value={fields.supplement}
                onChange={(e) => change("supplement", e.target.value)}
              />
            </details>
          </fieldset>
          <fieldset disabled={locked}>
            <legend>
              <span>{general ? "02" : "03"}</span> お返事先
            </legend>
            <div className="intake-fields-grid">
              {(
                [
                  ["name", "お名前", "text", "name", 80],
                  ["email", "返信先メールアドレス", "email", "email", 254],
                ] as const
              ).map(([key, label, type, autocomplete, max]) => (
                <label key={key}>
                  {label} <small>必須</small>
                  <input
                    name={key}
                    type={type}
                    required
                    autoComplete={autocomplete}
                    maxLength={max}
                    value={fields[key]}
                    aria-invalid={!!errors[key]}
                    aria-describedby={"error-" + key}
                    onChange={(e) => change(key, e.target.value)}
                  />
                  {fieldError(key)}
                </label>
              ))}
            </div>
            <label>
              会社名・屋号 <small>任意</small>
              <input
                name="company"
                autoComplete="organization"
                maxLength={80}
                value={fields.company}
                onChange={(e) => change("company", e.target.value)}
              />
            </label>
          </fieldset>
          <div className="contact-trap" aria-hidden="true">
            <label>
              Website
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          <p className="intake-help">
            送信内容はお問い合わせ対応のために利用します。
          </p>
          <label className="contact-consent">
            <input
              name="consent"
              required
              type="checkbox"
              disabled={locked}
              aria-invalid={!!errors.consent}
              aria-describedby="error-consent"
            />
            <span>
              <Link href="/privacy">プライバシーの取り扱い</Link>
              を確認し、送信に同意します
            </span>
          </label>
          {fieldError("consent")}
          {config === "enabled" && (
            <>
              <Script
                src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
                onReady={() => setScriptReady(true)}
                onError={() =>
                  setMessage(
                    "スパム確認を読み込めません。再読み込みしてお試しください。",
                  )
                }
              />
              <div ref={widgetEl} />
            </>
          )}
          {config !== "enabled" && (
            <p className="intake-config" role="status">
              <ShieldCheck size={17} />
              {config === "loading"
                ? "受付状況を確認しています。"
                : "Webフォームの直接送信は現在準備中です。下書き・コピーは使えます。メールでのご相談は contact@tsudowa.com へ。"}
            </p>
          )}
          <button
            className="button primary intake-submit"
            disabled={locked || config !== "enabled"}
          >
            {state === "sending" ? "受付処理中…" : "相談を送信する"}
            <ArrowUpRight size={18} />
          </button>
          <p
            role={state === "error" ? "alert" : "status"}
            className={state === "error" ? "intake-error" : "intake-help"}
          >
            {message}
            {receipt && state === "error" && <span> 受付番号：{receipt}</span>}
          </p>
          <details className="intake-copy">
            <summary>
              {general
                ? "内容をコピーしてメール等で連絡する"
                : "案件サイトのメッセージで相談したい方へ"}
            </summary>
            <p className="intake-help">
              入力内容をコピーして、ご利用中のサービスへ貼り付けられます。ここからは送信しません。
            </p>
            <button
              type="button"
              className="button secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(template);
                  setCopied("相談内容をコピーしました。");
                  track("portfolio_copy_contact_message");
                } catch {
                  setCopied(
                    "コピーできませんでした。下のテキストを選択してください。",
                  );
                }
              }}
            >
              <Copy size={16} />
              相談内容をコピー
            </button>
            <p role="status">{copied}</p>
            {copied.includes("できません") && (
              <textarea
                readOnly
                aria-label="コピー用の相談内容"
                value={template}
              />
            )}
          </details>
        </form>
      )}
    </div>
  );
}
