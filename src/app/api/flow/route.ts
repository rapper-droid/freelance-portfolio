import { exportCsv, parseCsv } from "@/lib/csv";
import { csvLimitsLabel, realUtilityEnabled } from "@/lib/runtime/feature";
import { modeNotice, planView, stageLabels } from "@/lib/runtime/present";
import {
  MAX_CSV_BYTES,
  readJsonBody,
  validateFlowRequest,
} from "@/lib/runtime/request";
import { runDaybook } from "@/lib/runtime/daybook/workflow";
import { planReschedule, rescheduleRun } from "@/lib/runtime/daybook/workflow";
import { runRelay } from "@/lib/runtime/relay/workflow";
import {
  compareReports,
  computeReport,
  summarise,
} from "@/lib/runtime/report/compute";
import {
  createRecipe,
  fitRecipe,
  suggestRoles,
  type Recipe,
} from "@/lib/runtime/report/recipe";
import { blockedReportRun, reportRun } from "@/lib/runtime/report/workflow";
import {
  DEMO_BOOKINGS,
  DEMO_CALENDAR,
  DEMO_NOW_ISO,
  DEMO_TENANT,
  REPORT_SAMPLES,
  scenarioById,
} from "@/lib/runtime/scenarios";
import type { CaseRecord } from "@/lib/runtime/relay/case";
import { newCase } from "@/lib/runtime/relay/case";
import { formatJst } from "@/lib/runtime/rules/datetime";

/**
 * The public sample runs here, on the server, using the same runtime modules
 * the paid work would use (指示書 §06 PUBLIC SAMPLE).
 *
 * Deliberate limits, all of them stated on screen:
 *
 * - **Nothing is stored.** The submitted text is processed and returned in the
 *   same request. There is no ledger of what strangers typed, and no need for
 *   one (指示書 §16).
 * - **Nothing leaves.** No model is called, no mail is sent, no calendar is
 *   written. `authoriseAction` refuses external effects in `sample` mode, so
 *   this is enforced by the runtime rather than by this file remembering to.
 * - **Nothing is real.** The fictional studio's data is the only fixture.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

const SAMPLE_CONTEXT = {
  mode: "sample" as const,
  connectedTargets: [] as string[],
  killSwitch: process.env.RUNTIME_KILL_SWITCH === "true",
};

export function GET() {
  return json({
    mode: "sample",
    notice: modeNotice("sample"),
    demoNow: DEMO_NOW_ISO,
  });
}

export async function POST(request: Request) {
  if (!realUtilityEnabled())
    return json({ code: "disabled", message: "この機能は現在無効です。" }, 404);
  if (SAMPLE_CONTEXT.killSwitch)
    return json(
      { code: "stopped", message: "緊急停止中のため受け付けていません。" },
      503,
    );

  let body: unknown;
  try {
    body = await readJsonBody(request, MAX_CSV_BYTES + 8192);
  } catch {
    return json(
      { code: "invalid", message: "リクエストを読み取れません。" },
      400,
    );
  }

  const validated = validateFlowRequest(body);
  if (!validated.ok)
    return json({ code: validated.code, message: validated.message }, 400);

  const scenario = scenarioById(validated.value.scenario);
  if (!scenario)
    return json({ code: "unknown_scenario", message: "対象が不明です。" }, 400);

  try {
    if (scenario.workflow === "relay")
      return json(await relay(validated.value));
    if (scenario.workflow === "daybook") return json(daybook(validated.value));
    return json(report(validated.value));
  } catch (error) {
    // Parser and rule errors carry messages written for the person who
    // uploaded the file; anything else is reported generically.
    const message =
      error instanceof Error && error.message.length < 200
        ? error.message
        : "処理できませんでした。";
    return json({ code: "failed", message }, 422);
  }
}

async function relay(input: { scenario: string; text?: string }) {
  const scenario = scenarioById(input.scenario)!;
  const text = input.text?.trim() || scenario.body;

  // The follow-up message belongs to the case the first one opened, which is
  // how the second reply avoids repeating the first one's questions (R04).
  const existingCases: CaseRecord[] =
    input.scenario === "relay-followup"
      ? [
          {
            ...newCase({
              tenantId: DEMO_TENANT,
              email: "sample-client@example.com",
              name: "山田太郎",
              company: "サンプル写真館",
              title: "サンプル写真館 / 予約・日程調整のご相談",
              atIso: DEMO_NOW_ISO,
              seed: "relay-quote",
            }),
            knownFields: {
              intent: { value: "booking", atIso: DEMO_NOW_ISO },
              currentTools: { value: "Googleカレンダー", atIso: DEMO_NOW_ISO },
              staffing: { value: "担当は一人", atIso: DEMO_NOW_ISO },
              availabilityNote: { value: "平日だけ", atIso: DEMO_NOW_ISO },
            },
            openQuestions: ["durationMinutes", "bufferMinutes"],
          },
        ]
      : [];

  const result = await runRelay(
    {
      inquiryId: input.scenario,
      tenantId: DEMO_TENANT,
      receivedAtIso: DEMO_NOW_ISO,
      name: "山田太郎",
      company: "サンプル写真館",
      email: "sample-client@example.com",
      text,
      caseRef: existingCases[0]?.caseId,
    },
    {
      mode: "sample",
      extractor: "auto",
      existingCases,
      signature: "TETSU WORKS / TSUDOWA",
    },
  );

  return {
    workflow: "relay",
    scenario: input.scenario,
    /**
     * The technical console reads the plan itself rather than the presentation
     * view: payload hashes, idempotency keys and the plan version are the
     * whole point of that screen, and a view built for a business reader
     * deliberately drops them (指示書 §17 Automation／API の技術画面).
     *
     * Nothing new is computed for it. This is the same run, returned twice at
     * two levels of detail, so the two screens can never disagree.
     */
    technical: {
      plan: result.plan,
      payloads: result.payloads,
      run: {
        runId: result.run.runId,
        mode: result.run.mode,
        workflow: result.run.workflow,
        status: result.run.status,
        inputSource: result.run.inputSource,
        createdAt: result.run.createdAt,
      },
      sourceText: text,
      extraction: result.extraction,
    },
    stages: stageLabels(result.run),
    status: result.run.status,
    timeline: result.run.timeline,
    evidence: result.plan.evidence,
    warnings: result.plan.warnings,
    missing: result.plan.missingFields,
    actions: planView(result.plan, SAMPLE_CONTEXT),
    reply: result.reply,
    caseRecord: {
      caseId: result.caseRecord.caseId,
      title: result.caseRecord.title,
      knownFields: result.caseRecord.knownFields,
      openQuestions: result.caseRecord.openQuestions,
      timeline: result.caseRecord.timeline,
    },
    identityCandidates: result.identityCandidates,
    answeredThisTime: Object.keys(result.caseRecord.knownFields).filter(
      (f) => !existingCases[0]?.knownFields[f],
    ),
  };
}

function daybook(input: { scenario: string; text?: string }) {
  const scenario = scenarioById(input.scenario)!;
  const text = input.text?.trim() || scenario.body;

  if (input.scenario === "daybook-reschedule") {
    // The booking created by the previous step, now being moved.
    const confirmed = {
      ...DEMO_BOOKINGS[0],
      bookingId: "BK-0931",
      startIso: "2026-09-30T06:30:00.000Z", // 15:30 JST
    };
    const target = "2026-09-30T07:00:00.000Z"; // 16:00 JST
    const result = planReschedule(
      confirmed,
      target,
      DEMO_CALENDAR,
      [confirmed, ...DEMO_BOOKINGS],
      DEMO_NOW_ISO,
    );
    const built = rescheduleRun({
      tenantId: DEMO_TENANT,
      requestId: input.scenario,
      atIso: DEMO_NOW_ISO,
      mode: "sample",
      bookingId: confirmed.bookingId,
      fromIso: confirmed.startIso,
      toIso: target,
      ok: result.ok,
      reason: result.reason,
      remindersToStop: result.remindersToStop,
      warnings: result.verdict?.warnings ?? [],
    });
    return {
      workflow: "daybook",
      scenario: input.scenario,
      stages: stageLabels(built.run),
      status: built.run.status,
      timeline: built.run.timeline,
      actions: planView(built.plan, SAMPLE_CONTEXT),
      warnings: result.verdict?.warnings ?? [],
      reschedule: {
        ok: result.ok,
        reason: result.reason,
        from: formatJst(confirmed.startIso),
        to: formatJst(target),
        remindersToStop: result.remindersToStop,
        warnings: result.verdict?.warnings ?? [],
      },
    };
  }

  const result = runDaybook(
    {
      requestId: input.scenario,
      tenantId: DEMO_TENANT,
      receivedAtIso: DEMO_NOW_ISO,
      requesterName: "佐藤花子",
      requesterEmail: "sample-guest@example.com",
      text,
    },
    { mode: "sample", calendar: DEMO_CALENDAR, bookings: DEMO_BOOKINGS },
  );

  return {
    workflow: "daybook",
    scenario: input.scenario,
    stages: stageLabels(result.run),
    status: result.run.status,
    timeline: result.run.timeline,
    warnings: result.warnings,
    missing: result.missing,
    actions: planView(result.plan, SAMPLE_CONTEXT),
    requested: result.requested
      ? {
          label: formatJst(result.requested.startIso),
          ok: result.requested.ok,
          conflictsWith: result.requested.conflictsWith,
          warnings: result.requested.warnings,
        }
      : null,
    proposals: result.proposals.map((p) => ({
      startIso: p.startIso,
      label: formatJst(p.startIso),
      endLabel: formatJst(p.endIso),
    })),
    calendar: {
      label: DEMO_CALENDAR.label,
      hours: "平日 10:00〜18:00",
      service: `${DEMO_CALENDAR.serviceMinutes}分`,
      buffers: `前${DEMO_CALENDAR.bufferBeforeMinutes}分 / 後${DEMO_CALENDAR.bufferAfterMinutes}分`,
      closedDates: DEMO_CALENDAR.closedDates,
    },
    releasedHolds: result.releasedHolds,
  };
}

function report(input: {
  scenario: string;
  csv?: string;
  recipe?: unknown;
  acceptChanges?: boolean;
}) {
  const sample = REPORT_SAMPLES[input.scenario];
  const csv = input.csv?.trim() || sample?.csv || "";
  const data = parseCsv(csv);

  // Week 1 builds the recipe; later weeks carry it back so the second run
  // needs no explanation (指示書 §09-1).
  const carried = isRecipe(input.recipe) ? input.recipe : null;
  const recipe: Recipe =
    carried ??
    createRecipe({
      tenantId: DEMO_TENANT,
      label: "週次売上レポート",
      columnRoles: suggestRoles(data.headers),
      currency: "JPY",
      dedupeBy: "orderId",
      atIso: DEMO_NOW_ISO,
    });

  const observedTax = recipe.columnRoles["税区分"]
    ? [
        ...new Set(
          data.rows
            .map((r) => r[data.headers.indexOf("税区分")] ?? "")
            .filter(Boolean),
        ),
      ]
    : [];

  const runInput = {
    tenantId: DEMO_TENANT,
    fileId: input.scenario,
    fileLabel: sample?.label ?? "アップロードされたファイル",
    atIso: DEMO_NOW_ISO,
    mode: "sample" as const,
    userSupplied: !!input.csv?.trim(),
    recipe,
  };

  const fit = fitRecipe(recipe, data, observedTax);
  if (!fit.ok) {
    const blocked = blockedReportRun(
      runInput,
      fit.needsConfirmation,
      fit.warnings,
      data.rows.length,
    );
    return {
      workflow: "report",
      scenario: input.scenario,
      fileLabel: runInput.fileLabel,
      limits: csvLimitsLabel(),
      stages: stageLabels(blocked.run),
      status: blocked.run.status,
      timeline: blocked.run.timeline,
      actions: planView(blocked.plan, SAMPLE_CONTEXT),
      needsConfirmation: fit.needsConfirmation,
      warnings: fit.warnings,
      recipe,
      headers: data.headers,
      rowCount: data.rows.length,
      result: null,
      comparison: null,
      summary: null,
    };
  }

  const result = computeReport(data, recipe, fit.mapping, DEMO_NOW_ISO);

  // Week 2 and 3 compare against the previous week, computed the same way.
  const previousId =
    input.scenario === "report-week2"
      ? "report-week1"
      : input.scenario === "report-week3"
        ? "report-week2"
        : null;
  let comparison = null;
  if (previousId && REPORT_SAMPLES[previousId]) {
    const previousData = parseCsv(REPORT_SAMPLES[previousId].csv);
    const previousFit = fitRecipe(recipe, previousData);
    if (previousFit.ok)
      comparison = compareReports(
        computeReport(previousData, recipe, previousFit.mapping, DEMO_NOW_ISO),
        result,
        {
          previous: REPORT_SAMPLES[previousId].label,
          current: sample?.label ?? "今回のファイル",
        },
      );
  }

  const built = reportRun(runInput, result);

  // The rows that were actually counted, written back out through the same
  // formula-neutralising exporter the CSV tool uses (指示書 C08, C09).
  const countedRows = result.rows.filter((r) => !r.issues.length && r.amount);
  const processedCsv = exportCsv({
    headers: data.headers,
    rows: countedRows.map((r) => data.rows[r.sourceRow - 2]),
  });
  const changeLogCsv = exportCsv({
    headers: ["行", "種別", "内容"],
    rows: [
      ...result.changeLog.map((c) => [String(c.sourceRow), c.kind, c.detail]),
      ...result.problems.map((p) => [String(p.sourceRow), "problem", p.reason]),
    ],
  });

  return {
    workflow: "report",
    scenario: input.scenario,
    fileLabel: runInput.fileLabel,
    limits: csvLimitsLabel(),
    downloads: {
      processedCsv,
      changeLogCsv,
      processedName: `processed-${input.scenario}.csv`,
      changeLogName: `changelog-${input.scenario}.csv`,
    },
    stages: stageLabels(built.run),
    status: built.run.status,
    timeline: built.run.timeline,
    actions: planView(built.plan, SAMPLE_CONTEXT),
    needsConfirmation: null,
    warnings: result.warnings,
    recipe,
    headers: data.headers,
    rowCount: data.rows.length,
    result: {
      totals: result.totals,
      problems: result.problems,
      changeLog: result.changeLog,
      provenance: result.provenance,
    },
    comparison,
    summary: summarise(result, comparison),
  };
}

function isRecipe(value: unknown): value is Recipe {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<Recipe>;
  return (
    typeof v.recipeId === "string" &&
    typeof v.version === "number" &&
    typeof v.currency === "string" &&
    !!v.columnRoles &&
    typeof v.columnRoles === "object"
  );
}
