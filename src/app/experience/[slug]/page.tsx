import "@/components/portfolio-styles.css";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import "@/components/demo-identities.css";
import "@/components/demo-frame.css";
import { getProject, projects } from "@/lib/portfolio";
import { pageMetadata } from "@/lib/seo";
import { DemoDataNotice } from "@/components/demo-data-notice";
import { DemoLiveLink } from "@/components/demo-live-link";
import { InboxDemo } from "@/components/inbox-demo";
import { AdminDemo } from "@/components/admin-demo";
import { CsvDemo } from "@/components/csv-demo";
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
  csv: CsvDemo,
  inbox: InboxDemo,
  admin: AdminDemo,
};
export const generateStaticParams = () =>
  projects.map((p) => ({ slug: p.slug }));
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const p = getProject((await params).slug);
  if (!p) notFound();
  return {
    ...pageMetadata(p.title + " — FULL DEMO", p.summary, "/demos/" + p.slug),
    robots: { index: false, follow: true },
  };
}
export default async function Experience({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p || !Object.hasOwn(demos, slug)) notFound();
  const Demo = demos[slug as keyof typeof demos];
  const tool = ["inbox", "admin", "csv"].includes(slug);
  return (
    <main
      id="main"
      className={
        "standalone-experience identity-" +
        slug +
        (tool ? " demo-page workbench-page" : " showcase-page")
      }
    >
      <div className="experience-header">
        <Link
          className="experience-exit"
          href={"/projects/" + slug}
          aria-label={"TETSU WORKS — " + p.title + "の制作概要に戻る"}
        >
          <ArrowLeft size={15} aria-hidden="true" />
          TETSU WORKS<span>&nbsp;/ 制作概要</span>
        </Link>
        <h1>{p.title}</h1>
        <DemoDataNotice text={p.limitation} />
      </div>
      {/* The standalone view is the one a visitor lands on from "OPEN FULL
          DEMO", so the operable version has to be reachable from here too. */}
      <DemoLiveLink slug={slug} />
      <Demo />
    </main>
  );
}
