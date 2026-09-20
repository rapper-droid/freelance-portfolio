"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { rememberPlatform } from "@/lib/visit-source";

/**
 * Remembers, for this tab only, which marketplace linked here, so the contact
 * paths can keep the conversation on that marketplace. Functional, not
 * measurement: it stores one marketplace id and nothing is sent anywhere
 * (see /privacy).
 */
export function PlatformMemory() {
  const pathname = usePathname();
  useEffect(() => {
    rememberPlatform();
  }, [pathname]);
  return null;
}
