// Load the sales foundation before demo-specific overrides, including on direct visits.
import "@/components/portfolio-styles.css";
import { notFound } from "next/navigation";
import "@/components/demo-identities.css";
import { projects, getProject } from "@/lib/portfolio";
import { pageMetadata } from "@/lib/seo";
import { DemoFrame, demoKicker } from "@/components/demo-frame";
import { QaEvidencePanel } from "@/components/qa-evidence";
import { DemoLiveLink } from "@/components/demo-live-link";
import { liveRoutes } from "@/lib/working-versions";
import "@/components/qa-evidence.css";
import {
  CafeDemo,
  SaasDemo,
  EcDemo,
  AutomationDemo,
  BookingDemo,
  ImprovementDemo,
  CreativeDemo,
  QaDemo,
} from "@/components/showcase-demos";
const demos = {
  cafe: CafeDemo,
  saas: SaasDemo,
  ec: EcDemo,
  automation: AutomationDemo,
  booking: BookingDemo,
  improvement: ImprovementDemo,
  creative: CreativeDemo,
  qa: QaDemo,
};
// Known paths are prerendered; unknown paths render the explicit notFound() boundary.
export const generateStaticParams = () =>
  projects.filter((p) => p.featured).map((p) => ({ slug: p.slug }));
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const p = getProject((await params).slug);
  if (!p) notFound();
  return pageMetadata(
    `${p.title} | ${p.name} DEMO`,
    p.summary + " 自主制作デモ。",
    `/demos/${p.slug}`,
  );
}
export default async function DemoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p || !Object.hasOwn(demos, slug)) notFound();
  const Demo = demos[slug as keyof typeof demos];
  return (
    <DemoFrame
      slug={slug}
      title={p.title}
      name={p.name}
      kicker={demoKicker(p)}
      variant="showcase"
      // SHIP / CHECK shows the real verification record above the manual
      // checklist (指示書 §10, U08). It is a server component, so it is passed
      // in here rather than rendered inside the client demo.
      context={
        slug === "qa" ? (
          <QaEvidencePanel />
        ) : Object.hasOwn(liveRoutes, slug) ? (
          // Above the static canvas: the operable version is the point of this
          // demo, and a visitor should not have to scroll past a picture of a
          // cafe to find the cafe.
          <DemoLiveLink slug={slug} />
        ) : undefined
      }
      outro={{
        heading: "この体験を、あなたのサービスでも。",
        text: p.limitation,
        note: "ご相談はWebフォームから。案件サイトのメッセージでも進められます。",
      }}
    >
      <Demo />
    </DemoFrame>
  );
}
