import Link from "next/link";
import Image from "next/image";
import { HqHeader, HqFooter, HqContactHub, HqArrow } from "./shell";
import { HqAssembly, LabWindow } from "./visuals";
import { HqMotion } from "./motion";
import {
  hqBrands,
  hqConcept,
  selectedHqProjects,
  buildRecords,
  hqUpdatedAt,
  dateLabel,
} from "@/lib/hq";

export function HqHome() {
  return (
    <div className="hq-site">
      <HqHeader />
      <main id="main">
        <section className="hq-hero" aria-labelledby="hq-title">
          <div className="hq-hero-copy">
            <p className="hq-eyebrow">TSUDOWA / AN OPEN CIRCLE</p>
            <h1 id="hq-title">
              <span>GATHER.</span>
              <span>BUILD.</span>
              <span className="hq-expand">EXPAND.</span>
            </h1>
            <p className="hq-hero-jp">{hqConcept}</p>
            <p className="hq-hero-intro">
              仕事をつくる。プロダクトを育てる。
              <br />
              そのすべてが、次の可能性につながる。
            </p>
            <div className="hq-hero-actions">
              <Link prefetch={false} href="/works" className="hq-button">
                TETSU WORKS <span>制作を頼む</span>
                <HqArrow />
              </Link>
              <Link prefetch={false} href="/lab" className="hq-text-link">
                TSUKUTTA LABをのぞく <HqArrow diagonal />
              </Link>
            </div>
          </div>
          <HqAssembly />
          <div className="hq-hero-bottom">
            <span>THE HOME OF OUR WORK, PLAY & WHAT COMES NEXT.</span>
            <a href="#about">
              TSUDOWAについて <span aria-hidden="true">↓</span>
            </a>
          </div>
        </section>
        <section id="about" className="hq-about hq-section">
          <div className="hq-section-index">01 / WHAT IS TSUDOWA</div>
          <h2>
            つくることが、
            <br />
            次の入口になる。
          </h2>
          <div className="hq-about-copy">
            <p>
              TSUDOWA（ツドワ）は、人・技術・アイデアをつなぐ親ブランドです。
            </p>
            <p>
              誰かの仕事を支えるものも、まだ名前のない実験も。ここで生まれたものが、別の場所で役に立ち、また新しい発想を連れてくる。
            </p>
            <p className="hq-about-closing">
              ひとつに閉じない。
              <br />
              つくりながら、輪をひらいていく。
            </p>
          </div>
        </section>
        <section
          id="brands"
          className="hq-circle hq-section"
          aria-labelledby="hq-circle-title"
        >
          <div className="hq-section-index">02 / THE CIRCLE</div>
          <div className="hq-section-heading">
            <h2 id="hq-circle-title">
              ひとつの思想。
              <br />
              ふたつの、違う世界。
            </h2>
            <p>
              同じ見た目にそろえなくていい。
              <br />
              違う役割のまま、つながっている。
            </p>
          </div>
          <div className="hq-brand-worlds">
            {hqBrands.map((brand, index) => (
              <article
                className={"hq-world hq-world-" + brand.visual}
                key={brand.id}
                id={brand.id}
              >
                <div className="hq-world-heading">
                  <span>
                    0{index + 1} / {brand.role}
                  </span>
                  <span className="hq-world-state">{brand.state}</span>
                </div>
                <h3>{brand.name}</h3>
                <div className="hq-world-visual">
                  {brand.visual === "works" ? (
                    <div className="hq-works-window">
                      <div>
                        <span>FROM IDEA</span>
                        <strong>
                          TO SOMETHING
                          <br />
                          THAT WORKS.
                        </strong>
                        <small>Web / UI / Automation</small>
                      </div>
                      <Image
                        src="/previews/admin-desktop-master-4.webp"
                        width={1440}
                        height={1000}
                        sizes="(max-width: 600px) 85vw, 480px"
                        alt="自主制作Adminデモの業務ダッシュボード"
                      />
                    </div>
                  ) : (
                    <LabWindow />
                  )}
                </div>
                <div className="hq-world-copy">
                  <h4>{brand.statement}</h4>
                  <p>{brand.description}</p>
                  <Link
                    className="hq-world-link"
                    href={brand.href}
                    prefetch={false}
                  >
                    {brand.cta}
                    <HqArrow diagonal />
                  </Link>
                </div>
              </article>
            ))}
          </div>
          <p className="hq-circle-note">
            形になったものから、少しずつ。<span>THE CIRCLE KEEPS OPENING.</span>
          </p>
        </section>
        <section
          id="works"
          className="hq-selected hq-section"
          aria-labelledby="hq-selected-title"
        >
          <div className="hq-section-index">03 / SELECTED WORK</div>
          <div className="hq-section-heading">
            <h2 id="hq-selected-title">
              思想を、
              <br />
              触れられるものに。
            </h2>
            <div>
              <p>
                TETSU WORKSの自主制作から。
                <br />
                見て、動かして、つくり方まで。
              </p>
              <Link prefetch={false} href="/works" className="hq-text-link">
                すべての制作例を見る <HqArrow />
              </Link>
            </div>
          </div>
          <div className="hq-selected-list">
            {selectedHqProjects.map((item, index) => (
              <article
                key={item.slug}
                className={"hq-project hq-project-" + item.visual}
                data-hq-project={item.slug}
              >
                <div className="hq-project-visual">
                  <Link
                    href={"/experience/" + item.slug}
                    aria-label={item.project.title + " のデモを開く"}
                    prefetch={false}
                  >
                    <Image
                      src={
                        item.slug === "cafe"
                          ? "/visuals/kissa-ritual-v2.webp"
                          : `/previews/${item.slug}-desktop-master-4.webp`
                      }
                      width={1440}
                      height={item.slug === "cafe" ? 960 : 1000}
                      sizes="(max-width: 700px) 90vw, 65vw"
                      alt={
                        item.slug === "cafe"
                          ? "KISSAの架空店舗写真。窓光の中のラテとクロワッサン"
                          : item.project.title + "の自主制作デモ実画面"
                      }
                    />
                    <span className="hq-project-view">
                      OPEN DEMO <HqArrow diagonal />
                    </span>
                  </Link>
                  <span className="hq-project-number">0{index + 1}</span>
                </div>
                <div className="hq-project-copy">
                  <span className="hq-eyebrow">{item.industry}</span>
                  <h3>{item.project.title}</h3>
                  <h4>{item.headline}</h4>
                  <dl>
                    <div>
                      <dt>問い</dt>
                      <dd>{item.problem}</dd>
                    </div>
                    <div>
                      <dt>設計</dt>
                      <dd>{item.solution}</dd>
                    </div>
                    <div>
                      <dt>できること</dt>
                      <dd>{item.result}</dd>
                    </div>
                  </dl>
                  <Link
                    prefetch={false}
                    href={"/projects/" + item.slug}
                    className="hq-text-link"
                  >
                    制作の背景を見る <HqArrow />
                  </Link>
                  <p className="hq-project-note">
                    SELF-INITIATED DEMO / 自主制作
                  </p>
                </div>
              </article>
            ))}
          </div>
          <p className="hq-honesty">
            掲載作品の企業・商品・データは架空です。実顧客への納品実績ではなく、制作と操作の品質を体験するためのデモです。
          </p>
        </section>
        <section id="activity" className="hq-activity hq-section">
          <div className="hq-section-index">04 / ACTIVITY & BUILD LOG</div>
          <div className="hq-section-heading">
            <h2>
              つくった先にも、
              <br />
              続きがある。
            </h2>
            <p>
              完成したもの。手を入れたところ。
              <br />
              活動の輪郭を、記録に残す。
            </p>
          </div>
          <div className="hq-log-list">
            {buildRecords.map((record) => (
              <Link
                prefetch={false}
                href={"/history#" + record.id}
                className="hq-log-row"
                key={record.id}
              >
                <time dateTime={record.date}>{dateLabel(record.date)}</time>
                <span className="hq-log-type">{record.type}</span>
                <h3>{record.title}</h3>
                <HqArrow diagonal />
              </Link>
            ))}
          </div>
          <div className="hq-log-foot">
            <p>{dateLabel(hqUpdatedAt)} 時点の制作記録 · 手動更新</p>
            <Link prefetch={false} href="/history" className="hq-text-link">
              BUILD LOGを見る <HqArrow />
            </Link>
          </div>
        </section>
        <HqContactHub />
      </main>
      <HqFooter />
      <HqMotion />
    </div>
  );
}
