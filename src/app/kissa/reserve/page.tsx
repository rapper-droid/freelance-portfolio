import { ReserveFlow } from "@/components/kissa/reserve-flow";
import { HOURS } from "@/lib/shop/catalog";
import { HOLD_MINUTES, MAX_PARTY } from "@/lib/shop/reservation";
import { pageMetadata } from "@/lib/seo";

/** Booking a table (指示書 §11). */
export const metadata = {
  ...pageMetadata(
    "席の予約｜KISSA（架空店舗のデモ）",
    "人数と時間を選ぶと、空いている席だけが表示されます。仮押さえから確定まで操作できる、架空店舗のデモです。",
    "/kissa/reserve",
  ),
  robots: { index: false, follow: true },
};

export default function KissaReserve() {
  return (
    <>
      <div className="kissa-page-head">
        <span className="kissa-eyebrow">RESERVE</span>
        <h1>席を予約する</h1>
        <p>
          {MAX_PARTY} 名さままで。滞在 {HOURS.defaultStayMinutes} 分を目安に、
          空いている席だけをご案内します。選んだ席は {HOLD_MINUTES}{" "}
          分間お取り置きします。
        </p>
      </div>
      <ReserveFlow />
    </>
  );
}
