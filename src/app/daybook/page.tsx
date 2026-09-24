import { DaybookDesk } from "@/components/daybook/daybook-desk";
import { pageMetadata } from "@/lib/seo";

export const metadata = {
  ...pageMetadata(
    "DAYBOOK — 埋まっている時に、次の一手まで出す予約（架空スタジオのデモ）",
    "文章で届いた希望を営業時間・前後の準備時間・先約に照らして判定し、取れないときは実際に空いている候補を出します。確定は予約者の合意とお店の承認がそろった時だけです。",
    "/daybook",
  ),
  // A fictional studio must not be indexed as somewhere you can book
  // (指示書 §22). Same rule as KISSA and FORME.
  robots: { index: false, follow: true },
};

export default function DaybookPage() {
  return <DaybookDesk />;
}
