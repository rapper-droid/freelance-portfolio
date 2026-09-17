import { ContactSend } from "./contact-send";
import { ArrowRight, Check } from "lucide-react";
import "./contact-intake.css";
export function Contact({
  initialKind = "",
  headingAs = "h2",
}: {
  initialKind?: string;
  headingAs?: "h1" | "h2";
}) {
  const Heading = headingAs;
  return (
    <section id="contact" className="contact-section section sales-intake">
      <div className="intake-intro">
        <span className="eyebrow">A GOOD PLACE TO START / TETSU WORKS</span>
        <Heading className="intake-title">
          つくりたいものを、
          <br />
          聞かせてください。
        </Heading>
        <p>
          まだ要件が曖昧でも大丈夫。
          <br />
          いま困っていることから、一緒に整理します。
        </p>
        <a href="#intake-fields" className="intake-jump">
          相談内容を入力する ↓
        </a>
        <div className="intake-promise">
          <Check size={18} />
          <span>
            まずは文章で。
            <br />
            <b>打ち合わせの前に、相談できます。</b>
          </span>
        </div>
        <ol className="intake-response-flow" aria-label="相談後の流れ">
          {["相談を送信", "内容を確認", "メールで返信", "合意して制作開始"].map(
            (s, i) => (
              <li key={s}>
                <span>0{i + 1}</span>
                {s}
                {i < 3 && <ArrowRight size={14} aria-hidden />}
              </li>
            ),
          )}
        </ol>
        <p className="intake-boundary">
          金額・納期・制作範囲は、内容を確認してご相談。
          <br />
          送信した時点で契約や発注にはなりません。
        </p>
        <p className="intake-platform">
          案件サイトからのご相談は、そのサービス内メッセージでも進められます。
        </p>
      </div>
      <ContactSend
        initialKind={initialKind}
        successHeading={headingAs === "h1" ? "h2" : "h3"}
      />
    </section>
  );
}
