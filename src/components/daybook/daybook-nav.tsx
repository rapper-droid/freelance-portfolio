"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Two sides of the same booking, on one set of data. */
const LINKS = [
  ["/daybook", "お客さま側"],
  ["/daybook/admin", "運用側"],
] as const;

export function DaybookNav() {
  const pathname = usePathname();
  return (
    <nav className="daybook-nav" aria-label="DAYBOOK">
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
