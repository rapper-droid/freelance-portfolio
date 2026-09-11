export type ErrorEnvelope = {
  event_id?: string;
  timestamp?: number;
  platform?: string;
  exception?: {
    values?: {
      type?: string;
      stacktrace?: {
        frames?: {
          filename?: string;
          function?: string;
          lineno?: number;
          colno?: number;
          in_app?: boolean;
        }[];
      };
    }[];
  };
};
/** Rebuild an allowlisted event; never forward message, URLs, request, user, breadcrumbs or extra. */
export function redactError(event: ErrorEnvelope) {
  return {
    type: undefined,
    event_id: event.event_id,
    timestamp: event.timestamp,
    platform: "javascript",
    level: "error" as const,
    message: "Portfolio browser error (details redacted)",
    exception: {
      values: (event.exception?.values ?? []).map((value) => ({
        type: [
          "Error",
          "TypeError",
          "RangeError",
          "ReferenceError",
          "SyntaxError",
        ].includes(value.type ?? "")
          ? value.type
          : "Error",
        value: "Error details redacted",
        stacktrace: {
          frames: (value.stacktrace?.frames ?? [])
            .filter((frame) => frame.filename?.includes("/_next/static/"))
            .map((frame) => ({
              filename: frame.filename
                ?.split("?")[0]
                .split("#")[0]
                .split("/")
                .pop(),
              lineno: frame.lineno,
              colno: frame.colno,
              in_app: true,
            })),
        },
      })),
    },
  };
}
