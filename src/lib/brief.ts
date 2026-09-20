/**
 * Brief questions and the plain-text brief they produce. Kept apart from the
 * offer copy so client components can build a brief without shipping every
 * offer to the browser.
 */
export type BriefQuestion = {
  id: string;
  label: string;
  hint?: string;
  options?: readonly string[];
  required?: boolean;
  multiline?: boolean;
  url?: boolean;
};
export type BriefAnswers = Record<string, string>;
/** The same text is copied or carried into the contact form. */
export function briefText(
  heading: string,
  questions: readonly BriefQuestion[],
  answers: BriefAnswers,
  extra: { timing?: string; budget?: string } = {},
) {
  const lines = [`【相談したいこと】${heading}`];
  for (const q of questions) {
    const value = (answers[q.id] ?? "").trim();
    lines.push(`【${q.label}】${value || "未記入"}`);
  }
  if (extra.timing) lines.push(`【希望時期】${extra.timing}`);
  if (extra.budget) lines.push(`【予算の目安】${extra.budget}`);
  return lines.join("\n");
}
