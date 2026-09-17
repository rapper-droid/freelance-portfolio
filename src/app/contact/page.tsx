import { Header, Footer } from "@/components/site";
import { Contact } from "@/components/contact";
import "@/components/portfolio-styles.css";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "制作・自動化のご相談｜TETSU WORKS",
  "Web制作、業務ツール、AI・自動化のご相談。要件が曖昧な段階から、文章でご相談いただけます。",
  "/contact",
);
export default function ContactPage() {
  return (
    <>
      <Header />
      <main id="main" className="sales-hub sales-ui contact-page">
        <Contact headingAs="h1" />
      </main>
      <Footer />
    </>
  );
}
