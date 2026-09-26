import Link from "next/link";
import { HqHeader, HqFooter, HqArrow } from "@/components/hq/shell";
import { buildRecords, buildYears, hqUpdatedAt, dateLabel } from "@/lib/hq";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "BUILD LOG — 制作と活動の記録",
  "TSUDOWAのブランド、制作物、改善の記録。つくったものと、その先に続く活動を年ごとに残します。",
  "/history",
);
export default function HistoryPage() {
  return (
    <div className="hq-site">
      <HqHeader />
      <main id="main">
        <section className="hq-subhero hq-section">
          <Link prefetch={false} href="/" className="hq-breadcrumb">
            TSUDOWA <span>/ ARCHIVE</span>
          </Link>
          <h1>BUILD LOG.</h1>
          <p>
            つくったもの。変えたところ。
            <br />
            ここから続いていく、活動の記録。
          </p>
        </section>
        <section className="hq-section" aria-label="年別の制作記録">
          <p className="hq-archive-intro">
            {dateLabel(hqUpdatedAt)} 時点 ·
            確認した制作事実を手動で更新しています。
          </p>
          {buildYears().map((year) => (
            <div className="hq-history-year" key={year}>
              <h2>{year}</h2>
              <div>
                {buildRecords
                  .filter((r) => r.date.startsWith(year))
                  .map((record) => (
                    <article
                      id={record.id}
                      className="hq-history-entry"
                      key={record.id}
                    >
                      <time dateTime={record.date}>
                        {dateLabel(record.date)}
                      </time>
                      <span>
                        {record.type} /{" "}
                        {
                          {
                            tsudowa: "TSUDOWA",
                            "tetsu-works": "TETSU WORKS",
                            "tsudowa-music": "TSUDOWA MUSIC",
                            "tsukutta-lab": "TSUKUTTA LAB",
                          }[record.brand]
                        }
                      </span>
                      <h3>{record.title}</h3>
                      <p>{record.summary}</p>
                      <Link
                        prefetch={false}
                        href={record.href}
                        className="hq-text-link"
                      >
                        関連するページを見る <HqArrow />
                      </Link>
                    </article>
                  ))}
              </div>
            </div>
          ))}
        </section>
      </main>
      <HqFooter />
    </div>
  );
}
