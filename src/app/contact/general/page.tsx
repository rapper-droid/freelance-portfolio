import "@/components/portfolio-styles.css";
import Link from "next/link";
import { HqHeader, HqFooter } from "@/components/hq/shell";
import { Contact } from "@/components/contact";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "TSUDOWAへのお問い合わせ",
  "ブランド、掲載内容、コラボレーションなどTSUDOWA全体へのお問い合わせ。制作のご相談はTETSU WORKS窓口へ。",
  "/contact/general",
);
export default function GeneralContactPage() {
  return (
    <div className="hq-site hq-general-contact">
      <HqHeader />
      <main id="main" className="sales-hub sales-ui contact-page">
        <div className="hq-contact-switch">
          <Link prefetch={false} href="/contact">
            制作のご相談は TETSU WORKSへ →
          </Link>
        </div>
        <Contact headingAs="h1" general />
      </main>
      <HqFooter />
    </div>
  );
}
