import { ContactSend } from "./contact-send";
import { ArrowRight, Check } from "lucide-react";
import { projects } from "@/lib/portfolio";
import "./contact-intake.css";

// Server-side lookup: only eleven short titles reach the client form.
const sourceTitles = Object.fromEntries(
  projects.map((p) => [p.slug, p.title]),
);
export function Contact({
  initialKind = "",
  headingAs = "h2",
  general = false,
}: {
  initialKind?: string;
  headingAs?: "h1" | "h2";
  general?: boolean;
}) {
  const Heading = headingAs;
  const steps = general
    ? ["相談を送信", "内容を確認", "メールで返信"]
    : ["相談を送信", "内容を確認", "メールで返信", "合意して制作開始"];
  return (
    <section id="contact" className="contact-section section sales-intake">
      <div className="intake-intro">
        <span className="eyebrow">
          {general
            ? "AN OPEN CONVERSATION / TSUDOWA"
            : "A GOOD PLACE TO START / TETSU WORKS"}
        </span>
        <Heading className="intake-title">
          {general ? (
            <>
              次のつながりを、
              <br />
              ひとつの話から。
            </>
          ) : (
            <>
              つくりたいものを、
              <br />
              聞かせてください。
            </>
          )}
        </Heading>
        <p>
          {general ? (
            <>
              ブランドや掲載内容、
              <br />
              コラボレーションについて。
              <br />
              TSUDOWA全体へのお問い合わせはこちらへ。
            </>
          ) : (
            <>
              まだ要件が曖昧でも大丈夫。
              <br />
              いま困っていることから、一緒に整理します。
            </>
          )}
        </p>
        <a href="#intake-fields" className="intake-jump">
          相談内容を入力する ↓
        </a>
        <div className="intake-promise">
          <Check size={18} />
          <span>
            まずは文章で。
            <br />
            <b>
              {general
                ? "短いご連絡から、お聞かせください。"
                : "打ち合わせの前に、相談できます。"}
            </b>
          </span>
        </div>
        <ol className="intake-response-flow" aria-label="相談後の流れ">
          {steps.map((step, i) => (
            <li key={step}>
              <span>0{i + 1}</span>
              {step}
              {i < steps.length - 1 && <ArrowRight size={14} aria-hidden />}
            </li>
          ))}
        </ol>
        <p className="intake-boundary">
          {general ? (
            "内容を確認し、返信先のメールアドレスへお返事します。送信した時点で契約や発注にはなりません。"
          ) : (
            <>
              金額・納期・制作範囲は、内容を確認してご相談。
              <br />
              送信した時点で契約や発注にはなりません。
            </>
          )}
        </p>
        {!general && (
          <p className="intake-platform">
            案件サイトからのご相談は、そのサービス内メッセージでも進められます。
          </p>
        )}
      </div>
      <ContactSend
        initialKind={initialKind}
        general={general}
        successHeading={headingAs === "h1" ? "h2" : "h3"}
        sourceTitles={sourceTitles}
      />
    </section>
  );
}
