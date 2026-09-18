import "./demo-frame.css";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { contactHref } from "@/lib/contact-options";
import { categories, getProject, type Project } from "@/lib/portfolio";
import { Header, Footer } from "./site";
import { DemoDataNotice } from "./demo-data-notice";

/**
 * The one frame every TETSU WORKS demo sits in. The frame speaks for TETSU
 * WORKS (what this is, where it leads); the canvas below belongs entirely to
 * the demo's own identity. Showcase demos and business tools share the same
 * frame so moving between them never changes the surrounding quality.
 */
export function DemoFrame({
  slug,
  title,
  name,
  kicker,
  variant,
  lead,
  context,
  outro,
  children,
}: {
  slug: string;
  title: string;
  name: string;
  kicker: string;
  variant: "showcase" | "tool";
  lead?: string;
  context?: React.ReactNode;
  outro: { heading: string; text: string; note?: string };
  children: React.ReactNode;
}) {
  const tool = variant === "tool";
  const contact = contactHref("/demos/" + slug);
  return (
    <>
      <Header />
      <main id="main" className={"demo-stage demo-stage-" + variant}>
        <div className="demo-frame">
          <div className="demo-frame-inner">
            <div className="demo-frame-top">
              <Link className="demo-back" href="/works#works">
                <ArrowLeft size={16} aria-hidden="true" /> 制作デモに戻る
              </Link>
              <span className="demo-badge">
                <span lang="en">SELF-INITIATED DEMO / </span>自主制作
              </span>
            </div>
            <div className="demo-notice-bar">
              <span className="demo-kicker">{kicker}</span>
              <h1>
                {title}
                <span className="demo-title-name">
                  <span className="sr-only"> — </span>
                  {name}
                </span>
              </h1>
              {lead && <p className="demo-lead">{lead}</p>}
              <Link href={`/projects/${slug}`}>
                制作概要・料金・納品物を見る{" "}
                <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            </div>
            <div className="demo-mode-actions">
              <Link href={"/experience/" + slug} prefetch={false}>
                OPEN FULL DEMO ↗
              </Link>
              <Link href={contact} prefetch={false}>
                このデモのような制作を相談する ↗
              </Link>
            </div>
          </div>
        </div>
        <div
          className={
            tool
              ? "demo-canvas demo-page workbench-page identity-" + slug
              : "demo-canvas showcase-page"
          }
        >
          {context}
          {tool && <DemoDataNotice />}
          {children}
          <section
            className={
              "demo-outro " + (tool ? "demo-bottom" : "showcase-limit")
            }
            aria-label="このデモについて"
          >
            <div>
              <span className="demo-outro-label">ABOUT THIS DEMO</span>
              <h2>{outro.heading}</h2>
              <p>{outro.text}</p>
              {outro.note && <p className="demo-outro-note">{outro.note}</p>}
            </div>
            <div className="demo-outro-actions">
              <Link className="button primary" href={contact} prefetch={false}>
                このデモのような制作を相談する{" "}
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
              <Link className="text-link" href={`/projects/${slug}`}>
                制作概要・料金・納品物へ{" "}
                <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

const toolSlugs = { "01": "csv", "02": "inbox", "03": "admin" } as const;

/** The three business-tool demos: same frame, plus what the tool does. */
export function DemoShell({
  number,
  title,
  lead,
  description,
  features,
  children,
}: {
  number: keyof typeof toolSlugs;
  title: string;
  lead: string;
  description: string;
  features: string[];
  children: React.ReactNode;
}) {
  const slug = toolSlugs[number];
  const p = getProject(slug)!;
  return (
    <DemoFrame
      slug={slug}
      title={title}
      name={p.name}
      kicker={demoKicker(p)}
      variant="tool"
      lead={lead}
      context={
        <details className="demo-context">
          <summary>このデモでできること・制作概要</summary>
          <p className="demo-description">{description}</p>
          <div className="feature-tags">
            {features.map((feature) => (
              <span key={feature}>{feature}</span>
            ))}
            <span>Next.js / TypeScript</span>
          </div>
        </details>
      }
      outro={{
        heading: "このようなツールを、あなたの業務に。",
        text: "既存のExcel作業の置き換えや、小さな機能追加からご相談いただけます。",
        note: p.limitation,
      }}
    >
      {children}
    </DemoFrame>
  );
}

export function demoKicker(p: Project) {
  const short = categories.find((c) => c.id === p.categories[0])?.short;
  return "LIVE DEMO" + (short ? " / " + short : "");
}
