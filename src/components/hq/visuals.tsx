import Image from "next/image";

/** Same four-arc symbol as the existing editable brand master. */
export function GatheringMark() {
  return (
    <svg className="hq-gathering-mark" viewBox="0 0 64 64" aria-hidden="true">
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="6.5"
        strokeLinecap="round"
      >
        <path d="M18.2 13.8A23.5 23.5 0 0 1 40.8 9.7" />
        <path d="M50.2 17.8A23.5 23.5 0 0 1 54.3 40.6" />
        <path d="M46.2 50.2A23.5 23.5 0 0 1 23.4 54.3" />
        <path d="M13.8 46.2A23.5 23.5 0 0 1 9.7 23.4" />
      </g>
      <circle
        cx="32"
        cy="32"
        r="8.5"
        fill="none"
        stroke="#f1b761"
        strokeWidth="6.5"
      />
    </svg>
  );
}

/** A labelled editorial diagram of the documented APP EGG lifecycle, not live telemetry. */
export function LabWindow({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={"hq-lab-window" + (compact ? " is-compact" : "")}
      aria-label="アイデアからプロダクトが育ち、次の発想へつながるLABのコンセプト図"
    >
      <div className="hq-lab-window-top">
        <span>TSUKUTTA LAB</span>
        <span>CONCEPT / APP LIFE</span>
      </div>
      <div className="hq-lab-specimen" aria-hidden="true">
        <i />
        <i />
        <i />
        <b>
          APP
          <br />
          EGG
        </b>
      </div>
      <div className="hq-lab-cycle">
        <span>生まれる</span>
        <span>つくる</span>
        <span>試す</span>
        <span>次へ残す</span>
      </div>
      {!compact && <p>ひとつのアイデア。その先に、いくつもの可能性。</p>}
    </div>
  );
}
/**
 * TSUDOWA MUSIC card visual: the Night City skyline of the JAM screen, drawn as pixels. Windows
 * light up the way they do when someone taps, and the row of bars stands for the six sounds.
 * Decorative only — the label carries the meaning for a screen reader.
 */
export function MusicWindow() {
  return (
    <div
      className="hq-music-window"
      role="img"
      aria-label="夜の街のピクセル世界。タップに合わせて窓が灯り、6種類の音が並ぶTSUDOWA MUSICのJAM画面"
    >
      <div className="hq-music-window-top">
        <span>TSUDOWA MUSIC</span>
        <span>FREE JAM / NIGHT CITY</span>
      </div>
      <div className="hq-music-sky" aria-hidden="true">
        <i className="hq-music-moon" />
        <span className="hq-music-star" style={{ left: "14%", top: "18%" }} />
        <span className="hq-music-star" style={{ left: "38%", top: "9%" }} />
        <span className="hq-music-star" style={{ left: "72%", top: "22%" }} />
        <div className="hq-music-city">
          {[38, 62, 30, 78, 48, 88, 34, 56].map((h, i) => (
            <b key={i} style={{ height: `${h}%` }}>
              <em />
              <em />
              <em />
            </b>
          ))}
        </div>
      </div>
      <div className="hq-music-keys" aria-hidden="true">
        {["CHILL", "GROOVE", "BASS", "POP", "ROCK", "CINEMA"].map((name) => (
          <span key={name}>{name}</span>
        ))}
      </div>
      <p>叩いても、なぞっても、そのままでも。点数はありません。</p>
    </div>
  );
}
export function HqAssembly() {
  return (
    <div
      className="hq-assembly"
      role="img"
      aria-label="TSUDOWAの輪から、制作のTETSU WORKSと実験のTSUKUTTA LABへ広がる構造"
    >
      <div className="hq-assembly-guide" aria-hidden="true">
        <span>IDEAS</span>
        <span>CODE</span>
        <span>PEOPLE</span>
      </div>
      <div className="hq-assembly-orbit" aria-hidden="true" />
      <div className="hq-assembly-core">
        <GatheringMark />
        <span>TSUDOWA</span>
      </div>
      <div className="hq-assembly-work">
        <span>
          TETSU WORKS <b>01</b>
        </span>
        <Image
          src="/previews/inbox-desktop-master-4.webp"
          loading="eager"
          fetchPriority="high"
          width={1440}
          height={1000}
          sizes="(max-width: 600px) 180px, (max-width: 1100px) 250px, 350px"
          alt=""
        />
        <small>DESIGN / BUILD / DELIVER</small>
      </div>
      <div className="hq-assembly-lab">
        <LabWindow compact />
        <span>
          TSUKUTTA LAB <b>02</b>
        </span>
      </div>
      <div className="hq-assembly-caption" aria-hidden="true">
        <span>GATHER</span>
        <i />
        <span>BUILD</span>
        <i />
        <span>EXPAND</span>
      </div>
    </div>
  );
}
