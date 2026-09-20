"use client";
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Copy, RotateCcw } from "lucide-react";
import { track } from "./analytics";
import { briefText, type BriefQuestion } from "@/lib/brief";
import {
  contactBudgets,
  contactTimings,
  safeReference,
} from "@/lib/contact-options";
import { MAX_BRIEF, writeBriefDraft } from "@/lib/contact-draft";
import {
  currentPlatform,
  platformNames,
  type Platform,
} from "@/lib/visit-source";

/**
 * "Write the consultation for me": a few answers become an editable brief
 * that is either carried into this site's contact form or copied for a
 * marketplace message. Nothing is sent from here and nothing leaves the tab
 * except what the visitor copies.
 */
export function OfferBrief({
  heading,
  page,
  offerId,
  questions,
  kind,
  kindMap,
  title = "この内容で、相談文をつくる。",
  lead = "分かるところだけで大丈夫です。選んだ内容から相談文ができあがり、そのまま編集できます。",
}: {
  heading: string;
  page: string;
  offerId?: string;
  questions: readonly BriefQuestion[];
  kind: string;
  kindMap?: { question: string; map: Record<string, string> };
  title?: string;
  lead?: string;
}) {
  const router = useRouter();
  const uid = useId();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timing, setTiming] = useState("未定");
  const [budget, setBudget] = useState("未定");
  const [edited, setEdited] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [platform, setPlatform] = useState<Platform | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setPlatform(currentPlatform()));
    return () => cancelAnimationFrame(frame);
  }, []);
  const generated = briefText(heading, questions, answers, { timing, budget });
  const text = (edited ?? generated).slice(0, MAX_BRIEF);
  const ids = offerId ? { offer: offerId } : {};

  function set(id: string, value: string) {
    setAnswers((a) => ({ ...a, [id]: value }));
    setError("");
    setMessage("");
  }
  function missing() {
    const q = questions.find((q) => q.required && !answers[q.id]?.trim());
    if (!q) return false;
    setError(`「${q.label}」を入力してください。`);
    (formRef.current?.elements.namedItem(q.id) as HTMLElement | null)?.focus();
    return true;
  }
  async function copy() {
    if (missing()) return;
    try {
      await navigator.clipboard.writeText(text);
      setMessage(
        platform
          ? `コピーしました。${platformNames[platform]}のメッセージ欄に貼り付けてください。ここからは送信されません。`
          : "コピーしました。案件サイトのメッセージやメールに貼り付けられます。ここからは送信されません。",
      );
      track("brief_created", ids);
    } catch {
      setMessage(
        "自動でコピーできませんでした。相談文を選択しましたので、コピーしてお使いください。",
      );
      textRef.current?.focus();
      textRef.current?.select();
    }
  }
  function carry() {
    if (missing()) return;
    const url = questions.find((q) => q.url);
    const reference = url ? (answers[url.id] ?? "").trim() : "";
    const mapped = kindMap?.map[answers[kindMap.question] ?? ""];
    const ok = writeBriefDraft(page, {
      kind: mapped || kind,
      detail: text,
      budget,
      timing,
      reference: reference && safeReference(reference) ? reference : "",
    });
    if (!ok) {
      setMessage(
        "このブラウザでは相談フォームへ引き継げませんでした。「相談文をコピー」を使い、フォームに貼り付けてください。",
      );
      return;
    }
    track("brief_created", ids);
    track("consultation_cta_clicked", ids);
    router.push("/contact?from=" + encodeURIComponent(page));
  }
  return (
    <section
      className="hub-section offer-brief"
      id="brief"
      aria-labelledby={uid + "-title"}
    >
      <div className="offer-brief-intro">
        <span className="eyebrow">WRITE YOUR BRIEF</span>
        <h2 id={uid + "-title"}>{title}</h2>
        <p className="section-lead">{lead}</p>
        <p className="offer-brief-warning">
          個人情報・パスワード・顧客データは入力しないでください。この欄の内容は、このブラウザの外へ送信されません。
        </p>
        {platform && (
          <p className="offer-brief-platform" role="note">
            {platformNames[platform]}からお越しの方は、相談文をコピーして
            {platformNames[platform]}
            のメッセージに貼り付けてください。やり取りとご契約は
            {platformNames[platform]}上で行います。
          </p>
        )}
      </div>
      <form
        ref={formRef}
        className="offer-brief-form"
        onSubmit={(e) => e.preventDefault()}
        noValidate
      >
        {questions.map((q) => {
          const id = `${uid}-${q.id}`;
          return (
            <div className="offer-brief-field" key={q.id}>
              <label htmlFor={id}>
                {q.label}
                {q.required ? <small>必須</small> : <small>任意</small>}
              </label>
              {q.options ? (
                <select
                  id={id}
                  name={q.id}
                  value={answers[q.id] ?? ""}
                  onChange={(e) => set(q.id, e.target.value)}
                >
                  <option value="">選択しない</option>
                  {q.options.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              ) : q.multiline ? (
                <textarea
                  id={id}
                  name={q.id}
                  rows={3}
                  maxLength={400}
                  value={answers[q.id] ?? ""}
                  aria-describedby={q.hint ? id + "-hint" : undefined}
                  aria-invalid={
                    !!error && !!q.required && !answers[q.id]?.trim()
                  }
                  onChange={(e) => set(q.id, e.target.value)}
                />
              ) : (
                <input
                  id={id}
                  name={q.id}
                  type={q.url ? "url" : "text"}
                  inputMode={q.url ? "url" : undefined}
                  maxLength={q.url ? 300 : 200}
                  value={answers[q.id] ?? ""}
                  aria-describedby={q.hint ? id + "-hint" : undefined}
                  onChange={(e) => set(q.id, e.target.value)}
                />
              )}
              {q.hint && (
                <p className="offer-brief-hint" id={id + "-hint"}>
                  {q.hint}
                </p>
              )}
            </div>
          );
        })}
        <div className="offer-brief-pair">
          <div className="offer-brief-field">
            <label htmlFor={uid + "-timing"}>希望時期</label>
            <select
              id={uid + "-timing"}
              value={timing}
              onChange={(e) => setTiming(e.target.value)}
            >
              {contactTimings.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>
          <div className="offer-brief-field">
            <label htmlFor={uid + "-budget"}>予算の目安</label>
            <select
              id={uid + "-budget"}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            >
              {contactBudgets.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="offer-brief-output">
          <label htmlFor={uid + "-text"}>
            できあがった相談文 <small>編集できます</small>
          </label>
          <textarea
            id={uid + "-text"}
            ref={textRef}
            rows={9}
            maxLength={MAX_BRIEF}
            value={text}
            onChange={(e) => {
              setEdited(e.target.value);
              setMessage("");
            }}
          />
          {edited !== null && (
            <button
              type="button"
              className="offer-brief-reset"
              onClick={() => setEdited(null)}
            >
              <RotateCcw size={14} aria-hidden="true" />
              入力内容から作り直す
            </button>
          )}
        </div>
        {error && (
          <p className="offer-brief-error" role="alert">
            {error}
          </p>
        )}
        <div className="offer-brief-actions">
          {!platform && (
            <button type="button" className="button primary" onClick={carry}>
              この内容で相談する <ArrowUpRight size={16} aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            className={platform ? "button primary" : "button secondary"}
            onClick={copy}
          >
            <Copy size={16} aria-hidden="true" />
            相談文をコピー
          </button>
        </div>
        <p className="offer-brief-status" role="status">
          {message}
        </p>
        <p className="offer-brief-note">
          {platform
            ? "コピーした時点では、どこにも送信されていません。"
            : "「この内容で相談する」を押すと、相談フォームに相談文が入った状態で開きます。お名前と返信先を入力して送信するまで、どこにも送信されません。"}
        </p>
      </form>
    </section>
  );
}
