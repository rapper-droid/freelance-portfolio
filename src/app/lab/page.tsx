import Link from "next/link";
import { HqHeader, HqFooter, HqArrow } from "@/components/hq/shell";
import { LabWindow } from "@/components/hq/visuals";
import { labPublication } from "@/lib/hq";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "TSUKUTTA LAB — プロダクトと実験の入口",
  "小さなアイデアがプロダクトになり、試され、次の発想を残していく。TSUDOWAから広がる独立ブランド、TSUKUTTA LABの取り組み。",
  "/lab",
);
export default function LabGateway() {
  return (
    <div className="hq-site hq-lab-page">
      <HqHeader />
      <main id="main">
        <section className="hq-subhero hq-section">
          <div>
            <Link prefetch={false} href="/#brands" className="hq-breadcrumb">
              TSUDOWA <span>/ THE CIRCLE 02</span>
            </Link>
            <h1>
              TSUKUTTA
              <br />
              LAB<span aria-hidden="true">_</span>
            </h1>
            <p className="hq-lab-lead">
              生まれる。試す。
              <br />
              その先へ、育てる。
            </p>
            <p className="hq-lab-description">
              Webサービス、ゲーム、実験的な制作。小さなアイデアがかたちになり、使われ、学びを残していく。その循環そのものをつくる、TSUDOWAのもうひとつの世界です。
            </p>
            <p className="hq-lab-note">
              IN DEVELOPMENT / 開発・研究の取り組みをご紹介しています。
            </p>
          </div>
          <LabWindow />
        </section>
        <section className="hq-lab-principles hq-section">
          <div className="hq-section-index">THE IDEA BEHIND THE LAB</div>
          <h2>
            完成だけが、
            <br />
            ゴールじゃない。
          </h2>
          <p>
            試してみたことも、うまくいかなかったことも、
            <br />
            次につくるものの材料になる。
          </p>
          <div className="hq-lab-steps">
            <article>
              <span>01 / MAKE</span>
              <h3>小さく生み出す。</h3>
              <p>
                アイデアを「APP
                EGG」として扱い、プロダクトの種から、動かせるものをつくる。
              </p>
            </article>
            <article>
              <span>02 / LEARN</span>
              <h3>触って、確かめる。</h3>
              <p>
                動くかだけではなく、人が使えるか。制作と検証を往復しながら、かたちを育てる。
              </p>
            </article>
            <article>
              <span>03 / CONTINUE</span>
              <h3>次の発想へ残す。</h3>
              <p>
                改善の記録や部品を次へつなぐ。ひとつのプロダクトで終わらない循環を目指す。
              </p>
            </article>
          </div>
        </section>
        <section className="hq-lab-publication hq-section">
          <div className="hq-section-index">A WINDOW INTO THE LAB</div>
          <h2>まずは、研究所の入口から。</h2>
          <p>
            現在は、このページで取り組みをご紹介しています。LAB本体へのリンクは、公開先を確認したうえでご案内します。
          </p>
          {labPublication.verifiedPublicUrl ? (
            <a href={labPublication.verifiedPublicUrl} className="hq-button">
              TSUKUTTA LABへ入る <HqArrow diagonal />
            </a>
          ) : null}
          <Link prefetch={false} className="hq-text-link" href="/history">
            TSUDOWAの制作記録を見る <HqArrow />
          </Link>
          <Link
            href="/contact/general"
            className="hq-text-link"
            prefetch={false}
          >
            LABについて問い合わせる <HqArrow />
          </Link>
        </section>
      </main>
      <HqFooter />
    </div>
  );
}
