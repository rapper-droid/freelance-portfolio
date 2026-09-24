"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** The three addresses worth linking to, and nothing else. */
const LINKS = [
  ["/report", "CSVを処理する"],
  ["/report/recipes", "保存したルール"],
  ["/report/history", "処理の履歴"],
] as const;

export function ReportNav() {
  const pathname = usePathname();
  return (
    <nav className="report-nav" aria-label="REPORT FLOW">
      {LINKS.map(([href, label]) => (
        <Link
          key={href}
          href={href}
          aria-current={pathname === href ? "page" : undefined}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
