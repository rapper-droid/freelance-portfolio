"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { contactHref } from "@/lib/contact-options";
export function ContactLink({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={contactHref(usePathname())}
      className={className}
      prefetch={false}
    >
      {children}
    </Link>
  );
}
