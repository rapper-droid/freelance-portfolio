import Link from "next/link";
// Load the sales foundation before demo-specific overrides, including on direct visits.
import "@/components/portfolio-styles.css";
import { notFound } from "next/navigation";
import "@/components/demo-identities.css";
import { projects, getProject } from "@/lib/portfolio";
import { pageMetadata } from "@/lib/seo";
import { Header, Footer } from "@/components/site";
import { contactHref } from "@/lib/contact-options";
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
    <>
      <Header />
      <main id="main" className="showcase-page">
        <div className="demo-notice-bar">
          <span>SELF-INITIATED DEMO / 自主制作</span>
          <h1>{p.name}</h1>
          <Link href={`/projects/${slug}`}>制作概要・納品物を見る ↗</Link>
        </div>
        <div
          className="demo-mode-actions hub-section"
          style={{ paddingBlock: 0 }}
        >
          <Link href={"/experience/" + slug} prefetch={false}>
            OPEN FULL DEMO ↗
          </Link>
          <Link href={contactHref("/demos/" + slug)} prefetch={false}>
            このデモのような制作を相談する ↗
          </Link>
        </div>
        <Demo />
        <div className="showcase-limit">
          <p>{p.limitation}</p>
          <Link href={`/projects/${slug}`} className="button secondary">
            制作概要・料金・納品物へ戻る ↗
          </Link>
          <p>
            ご相談はWebフォームから。案件サイトのメッセージでも進められます。
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
