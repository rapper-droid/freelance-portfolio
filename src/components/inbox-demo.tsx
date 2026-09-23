"use client";
import { OpsProvider } from "./ops/ops-provider";
import { InboxWorkspace } from "./ops/inbox-workspace";
import { OPS_REFERENCE_ISO } from "@/lib/ops/types";

/**
 * SMART INBOX (指示書 §14).
 *
 * The workspace moved to components/ops so it reads the same case record
 * RELAY writes and ADMIN counts; this is the provider it needs.
 */
export function InboxDemo() {
  return (
    <OpsProvider referenceIso={OPS_REFERENCE_ISO}>
      <InboxWorkspace />
    </OpsProvider>
  );
}
