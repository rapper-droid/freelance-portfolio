import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ArrowRight, Mail, Workflow, Check } from "lucide-react";
import { tickets } from "@/lib/inbox";
import { previewPath } from "@/lib/preview";
/** Three domains. UI counts come from the actual demo seed, not invented KPIs. */
export function MasterHero() {
  return (
    <aside
      className="master-exhibit hero-exhibit"
      aria-label="Brand Web・Business UI・Automationの制作領域"
    >
      <div className="exhibit-index">
        <span>IDEAS, MADE REAL.</span>
        <span>THREE WAYS TO BUILD</span>
      </div>
      <Link href="/projects/inbox" className="master-ui exhibit-interface">
        <div className="master-tile-top">
          <span>
            <Mail size={17} /> SMART INBOX
          </span>
          <small>01 / BUSINESS UI</small>
          <ArrowUpRight size={18} />
        </div>
        <div className="master-inbox-body">
          <aside>
            <b>
              {String(
                tickets.filter((t) => t.status === "未対応").length,
              ).padStart(2, "0")}
            </b>
            <span>未対応 / SAMPLE</span>
            <small>
              今日の仕事を、
              <br />
              ひとつの場所で。
            </small>
          </aside>
          <div>
            {tickets.slice(0, 3).map((t) => (
              <div key={t.id}>
                <span>{t.subject}</span>
                <small>{t.status}</small>
              </div>
            ))}
          </div>
        </div>
        <span className="master-tile-caption">
          読む → 整理する → 返信を考える <ArrowRight size={15} />
        </span>
      </Link>
      <div className="master-exhibit-bottom">
        <Link href="/projects/ec" className="master-web exhibit-photo">
          <Image
            src="/visuals/forme-sage-v1.webp"
            alt="FORMEの造形と素材を伝えるブランド・Web制作デモ"
            width={1200}
            height={1200}
            fetchPriority="high"
            loading="eager"
            sizes="(max-width:700px) 44vw, 22vw"
          />
          <div>
            <small>02 / BRAND & WEB</small>
            <b>
              FORME <ArrowUpRight size={18} />
            </b>
          </div>
        </Link>
        <Link href="/projects/automation" className="master-system">
          <div className="master-tile-top">
            <small>03 / AUTOMATION</small>
            <ArrowUpRight size={18} />
          </div>
          <Workflow size={34} strokeWidth={1} />
          <h2>
            くり返しを、
            <br />
            仕組みに。
          </h2>
          <ol>
            <li>受付</li>
            <li>分類</li>
            <li>
              <Check size={12} />
              人が確認
            </li>
          </ol>
          <span>LOCAL DEMO / RELAY</span>
        </Link>
      </div>
      <p className="exhibit-caption">
        TETSU WORKS / 自主制作のWeb・業務ツール・自動化
      </p>
    </aside>
  );
}
export function MasterWorks() {
  return (
    <div
      className="works-exhibit master-works"
      aria-label="Webサービスと管理画面の制作例"
    >
      <Link href="/projects/saas" className="works-exhibit-main">
        <Image
          src={previewPath("saas", "desktop")}
          alt="FLOWSTATE — Webサービスの価値を伝えるLP制作デモ"
          width={1440}
          height={1000}
          fetchPriority="high"
          loading="eager"
          sizes="(max-width:700px) 90vw, 40vw"
        />
        <div>
          <span>01 / PRODUCT WEBSITE</span>
          <b>
            FLOWSTATE <ArrowUpRight size={22} />
          </b>
        </div>
      </Link>
      <Link href="/projects/admin" className="works-exhibit-tool">
        <div>
          <span>02 / BUSINESS INTELLIGENCE</span>
          <ArrowUpRight size={18} />
        </div>
        <Image
          src={previewPath("admin", "desktop")}
          alt="ADMIN DASHBOARDの顧客管理・売上集計の実画面"
          width={1440}
          height={1000}
          sizes="(max-width:700px) 75vw, 30vw"
        />
        <b>ADMIN DASHBOARD</b>
      </Link>
      <span className="exhibit-stamp">
        DESIGN
        <br />
        BUILD
        <br />
        DELIVER.
      </span>
    </div>
  );
}
