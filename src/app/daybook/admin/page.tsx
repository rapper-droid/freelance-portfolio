import { DaybookAdmin } from "@/components/daybook/daybook-admin";
import { pageMetadata } from "@/lib/seo";

export const metadata = {
  ...pageMetadata(
    "DAYBOOK 運用側 — 何を承認するのかが分かる台帳（架空スタジオのデモ）",
    "承認が要るものと、承認すると何が変わるかを表示します。予約者の合意とお店の承認は別の記録として保存し、片方だけでは確定しません。",
    "/daybook/admin",
  ),
  robots: { index: false, follow: false },
};

export default function DaybookAdminPage() {
  return <DaybookAdmin />;
}
