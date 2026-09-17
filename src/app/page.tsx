import { HqHome } from "@/components/hq/home";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "集まり、つくり、次へ広がる",
  "TSUDOWA（ツドワ）はTETSU WORKSとTSUKUTTA LABをつなぐ親ブランド。制作、プロダクト、実験、そしてその歩みが集まる公式入口です。",
  "/",
);
export default function Home() {
  return <HqHome />;
}
