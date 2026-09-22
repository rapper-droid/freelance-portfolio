import type { ExecutionMode, ProcessingKind } from "../types";
import { AiExtractor, aiCredentialPresent } from "./ai";
import { DeterministicExtractor } from "./deterministic";
import { ExtractorUnavailableError, type Extractor } from "./port";

/**
 * Chooses the extractor for a run, and — just as importantly — reports what is
 * actually available so the interface can say so before anyone presses
 * anything (指示書 §06).
 *
 * The one rule this file exists to enforce: asking for AI and getting rules is
 * not a fallback, it is a false claim. `selectExtractor` therefore either
 * returns the requested processing kind or throws.
 */

export type ExtractorChoice = "auto" | "deterministic" | "ai";

export type ExtractorAvailability = {
  deterministic: true;
  ai: boolean;
  /** Why AI is unavailable, for display. Empty when it is available. */
  aiBlockedReason: string;
};

export function extractorAvailability(
  env: Record<string, string | undefined> = process.env,
): ExtractorAvailability {
  const killSwitch = env.RUNTIME_KILL_SWITCH === "true";
  const credential = aiCredentialPresent(env);
  return {
    deterministic: true,
    ai: credential && !killSwitch,
    aiBlockedReason: killSwitch
      ? "緊急停止が有効です。"
      : credential
        ? ""
        : "実AIの認証情報がこの環境に設定されていません。",
  };
}

/**
 * The public sample never reaches a paid model, whatever it is asked for.
 * Demonstrating the workflow must not turn an anonymous visitor's text into
 * billable calls, and a sample's text has not been through the consent step
 * that an AI route requires (指示書 §06, §16).
 */
export function selectExtractor(opts: {
  mode: ExecutionMode;
  choice: ExtractorChoice;
  env?: Record<string, string | undefined>;
  budgetCheck?: () => Promise<boolean> | boolean;
}): { extractor: Extractor; processing: ProcessingKind } {
  const env = opts.env ?? process.env;
  const availability = extractorAvailability(env);

  if (opts.choice === "ai" && opts.mode === "sample")
    throw new ExtractorUnavailableError(
      "KILL_SWITCH",
      "公開サンプルでは実AIを呼び出しません。検証は PRIVATE PILOT で行います。",
    );

  if (opts.choice === "ai") {
    if (!availability.ai)
      throw new ExtractorUnavailableError(
        env.RUNTIME_KILL_SWITCH === "true" ? "KILL_SWITCH" : "NO_CREDENTIAL",
        availability.aiBlockedReason,
      );
    return {
      extractor: new AiExtractor({
        killSwitch: env.RUNTIME_KILL_SWITCH === "true",
        budgetCheck: opts.budgetCheck,
      }),
      processing: "ai",
    };
  }

  // "auto" resolves to rules. It is written out rather than implied so that
  // reading this file cannot leave the impression that auto might mean AI.
  return {
    extractor: new DeterministicExtractor(),
    processing: "deterministic",
  };
}
