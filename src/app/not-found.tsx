import Link from "next/link";
import { Header, Footer } from "@/components/site";
export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main" className="empty-page">
        <span className="eyebrow">404 / NOT FOUND</span>
        <h1>ページが見つかりませんでした。</h1>
        <p>URLをご確認いただくか、トップページからデモをご覧ください。</p>
        <Link className="button primary" href="/">
          トップに戻る
        </Link>
      </main>
      <Footer />
    </>
  );
}
