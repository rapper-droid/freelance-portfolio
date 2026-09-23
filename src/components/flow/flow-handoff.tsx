"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { track } from "@/components/analytics";
import { writeBriefDraft } from "@/lib/contact-draft";
import {
  composeHandoff,
  HANDOFF_QUESTIONS,
  MAX_ANSWER,
  troubleLabel,
  type HandoffWorkflow,
} from "@/lib/runtime/handoff";

/**
 * The step between watching the sample and asking about your own work
 * (指示書 §11, 受け入れ基準 A10).
 *
 * Three short questions, all optional. Their answers are carried into the
 * consultation form so nobody types the same thing twice — which is the
 * argument this whole page makes, and would ring hollow if the form on the
 * next screen arrived blank.
 *
 * The answers travel through session storage, never the URL, so a copied or
 * logged link carries nothing. Only these three lines and the chosen trouble
 * move; the message box above is fictional by default and whatever a visitor
 * edited into it is theirs, not an inquiry they asked us to prepare.
 */
export function FlowHandoff({ workflow }: { workflow: HandoffWorkflow }) {
  const router = useRouter();
  const [answers, setAnswers] = useState({
    tools: "",
    cadence: "",
    outcome: "",
  });
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const proceed = () => {
    setBusy(true);
    const { kind, detail } = composeHandoff({ workflow, ...answers });
    const carried = writeBriefDraft(
      "/flow",
      { kind, detail },
      Date.now(),
      "flow",
    );
    track("consultation_started");
    if (!carried) {
      // Storage can be unavailable (private window, blocked site data). Say so
      // rather than sending them to a form that silently lost their answers.
      setBusy(false);
      setStatus(
        "このブラウザの設定では引き継げませんでした。相談フォームで直接ご記入ください。",
      );
      return;
    }
    router.push("/contact?from=%2Fflow");
  };

  return (
    <section className="flow-handoff" aria-labelledby="flow-handoff-heading">
      <h2 id="flow-handoff-heading">自分の作業に当てはめる</h2>
      <p>
        いま見たのは「{troubleLabel(workflow)}
        {
          "」でした。あなたの場合を 3 つだけ教えていただければ、そのまま相談に引き継ぎます。空欄のままでも進めます。"
        }
      </p>

      <div className="flow-handoff-fields">
        {HANDOFF_QUESTIONS.map((q) => (
          <label key={q.key} className="flow-handoff-field">
            <span>{q.label}</span>
            <input
              type="text"
              maxLength={MAX_ANSWER}
              value={answers[q.key]}
              placeholder={q.placeholder}
              onChange={(e) =>
                setAnswers((prev) => ({ ...prev, [q.key]: e.target.value }))
              }
            />
          </label>
        ))}
      </div>

      <div className="flow-controls">
        <button
          type="button"
          className="flow-button"
          disabled={busy}
          onClick={proceed}
        >
          この内容で相談する <ArrowRight size={16} aria-hidden="true" />
        </button>
        <p className="flow-status" role="status" aria-live="polite">
          {status}
        </p>
      </div>

      <p className="flow-fineprint">
        {
          "入力はこのブラウザ内だけで相談フォームへ渡します。URL には含めません。送信前に内容を確認・編集できます。ここで送信されることはありません。"
        }
      </p>
    </section>
  );
}
