import "server-only";

import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import { cache } from "react";
import { z } from "zod";

import type { Tables } from "./database.types";
import { ANALYSIS_MAX_FEEDBACK, selectFeedback } from "./analysis";
import { isoDateOf, monthOf } from "./format";
import type { ReportContent, ReportSource } from "./report";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/locale";
import { FORM_SLUG_PATTERN, PLAN_LIMITS } from "./plans";
import { formState, PUBLIC_FORM_CHANNEL, type RoomStatus } from "./room";
import { questionUsage } from "./supabase/admin";
import { createClient } from "./supabase/server";
import type { Analysis, Feedback, Plan, Research, Theme, ThemeKind, ThemeStatus, Workspace } from "./types";

// The only way pages read data. Every query runs as the signed-in user, so RLS limits it
// to their workspace; the explicit workspace filters keep the queries readable and indexed.

const TREND_WEEKS = 13;
const OPEN_STATUSES: ThemeStatus[] = ["to_review", "roadmap"];
const RECENT_FEEDBACK = 6;
export const FEEDBACK_PAGE_SIZE = 100;
const FEEDBACK_COLUMNS = "id, workspace_id, text, channel, customer, email, received_at";

export type StatusFilter = "open" | "all" | ThemeStatus;

export type Quote = {
  feedbackId: string;
  text: string;
  highlight: string | null;
  channel: string;
  receivedAt: string;
};

// How a theme moved since the previous themes analysis of the same Research, matched by title.
export type ThemeChange = { kind: "new" } | { kind: "more"; count: number; since: string };

export type ThemeSummary = Theme & {
  feedbackCount: number;
  // Null on the first analysis of the Research, or when the theme did not grow.
  change: ThemeChange | null;
  // Feedback per week, oldest first, ending with the analysis week.
  trend: number[];
  quotes: Quote[];
};

// A row of /research: the Research with its number of feedback and its state. themeCount: the themes of its
// last done themes analysis; hypotheses: how many, and their verdicts by word; newFeedback: the feedback that
// entered Voce after that analysis (all of them before the first); lastActivity: the latest of its creation,
// its last feedback and its last analysis.
export type ResearchSummary = Pick<Research, "id" | "question" | "formEnabled"> & {
  feedbackCount: number;
  themeCount: number;
  hypotheses: { total: number; confirmed: number; refuted: number; toReview: number };
  newFeedback: number;
  lastActivity: string;
};

// The last verdict of a hypothesis, as the Sintesi shows it. supporting and contradicting count the verified
// links that still exist; feedbackRead is what the model read; arrivedAfter, the feedback read that entered
// Voce after the hypothesis was written; arrivedAfterVerdict, the feedback of the Research that entered Voce
// after the verdict analysis started.
export type Verdict = {
  verdict: "confirmed" | "refuted" | "to_review";
  reasoning: string;
  feedbackRead: number;
  arrivedAfter: number;
  supporting: number;
  contradicting: number;
  quotesFor: Quote[];
  quotesAgainst: Quote[];
  arrivedAfterVerdict: number;
};

// A hypothesis of the PM in the Sintesi, in the order it was written, with its verdict or none yet.
export type Hypothesis = { id: string; text: string; writtenAt: string; verdict: Verdict | null };

// The numbers in the header of a Research.
export type ResearchStats = {
  feedbackCount: number;
  channelCount: number;
  firstReceivedAt: string | null;
  lastReceivedAt: string | null;
};

export type Usage = {
  plan: Plan;
  feedbackCount: number;
  feedbackLimit: number | null;
  analysesThisMonth: number;
  analysesLimit: number;
  // Every question of the month counts, answered or not. Read by the server: users cannot read questions.
  questionsThisMonth: number;
  questionsLimit: number;
};

// Written only by the Stripe webhook. isOwner: only the owner manages the subscription.
export type Billing = {
  plan: Plan;
  stripeCustomerId: string | null;
  stripeStatus: string | null;
  currentPeriodEnd: string | null;
  cancelAt: string | null;
  isOwner: boolean;
};

// Cached per request: the layout and the page both ask.
export const getCurrentWorkspace = cache(async (): Promise<Workspace> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspaces")
    .select("id, name")
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  // The proxy already sends signed-out users to /login: a signed-in user without a workspace is a bug.
  if (!data) throw new Error("The signed-in user has no workspace");
  return { id: data.id, name: data.name };
});

// Most recent activity first. Cached per request like the workspace.
export const listResearch = cache(async (workspaceId: string): Promise<ResearchSummary[]> => {
  const supabase = await createClient();
  const [research, stats, analyses, hypotheses, verdicts] = await Promise.all([
    supabase.from("research").select("id, question, form_enabled, created_at").eq("workspace_id", workspaceId),
    supabase
      .from("research_feedback_stats")
      .select("research_id, feedback_count, last_created_at")
      .eq("workspace_id", workspaceId),
    // Newest first: the first of each Research is its last.
    supabase
      .from("analyses")
      .select("id, research_id, kind, created_at")
      .eq("workspace_id", workspaceId)
      .eq("status", "done")
      .not("research_id", "is", null)
      .order("created_at", { ascending: false }),
    supabase.from("research_hypotheses").select("research_id").eq("workspace_id", workspaceId),
    supabase.from("hypothesis_verdicts").select("research_id, verdict").eq("workspace_id", workspaceId),
  ]);
  const counts = unwrap(stats);
  const done = unwrap(analyses);
  const lastThemes = (id: string) => done.find((a) => a.research_id === id && a.kind === "themes");
  const themeRows = unwrap(
    await supabase
      .from("themes")
      .select("analysis_id")
      .eq("workspace_id", workspaceId)
      .in(
        "analysis_id",
        unwrap(research).flatMap((r) => lastThemes(r.id)?.id ?? [])
      )
  );
  const hypothesisRows = unwrap(hypotheses);
  const verdictRows = unwrap(verdicts);
  const rows = await Promise.all(
    unwrap(research).map(async (r) => {
      const stat = counts.find((c) => c.research_id === r.id);
      const feedbackCount = stat?.feedback_count ?? 0;
      const themes = lastThemes(r.id);
      const lastAnalysis = done.find((a) => a.research_id === r.id);
      const words = verdictRows.filter((v) => v.research_id === r.id).map((v) => v.verdict);
      const newFeedback =
        feedbackCount === 0 ? 0 : themes ? await countFeedbackAfter({ id: r.id, workspaceId }, themes.created_at) : feedbackCount;
      const activity = [r.created_at, stat?.last_created_at, lastAnalysis?.created_at].filter((d): d is string => Boolean(d));
      return {
        id: r.id,
        question: r.question,
        formEnabled: r.form_enabled,
        feedbackCount,
        themeCount: themes ? themeRows.filter((t) => t.analysis_id === themes.id).length : 0,
        hypotheses: {
          total: hypothesisRows.filter((h) => h.research_id === r.id).length,
          confirmed: words.filter((w) => w === "confirmed").length,
          refuted: words.filter((w) => w === "refuted").length,
          toReview: words.filter((w) => w === "to_review").length,
        },
        newFeedback,
        lastActivity: activity.reduce((latest, d) => (Date.parse(d) > Date.parse(latest) ? d : latest)),
      };
    })
  );
  return rows.sort((a, b) => Date.parse(b.lastActivity) - Date.parse(a.lastActivity));
});

// Null when the id is not a Research the user can read: another workspace's, deleted, or not a uuid.
// The same answer in every case, so a page cannot tell "someone else's" from "does not exist".
export const getResearch = cache(async (id: string): Promise<Research | null> => {
  if (!z.uuid().safeParse(id).success) return null;
  const supabase = await createClient();
  const row = unwrap(await supabase.from("research").select("*").eq("id", id).maybeSingle());
  if (!row) return null;
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    question: row.question,
    formSlug: row.form_slug,
    formEnabled: row.form_enabled,
    formQuestion: row.form_question,
    createdAt: row.created_at,
  };
});

// The Research created last in the workspace, or null when there is none.
export async function getLatestResearchId(workspaceId: string): Promise<string | null> {
  const supabase = await createClient();
  const row = unwrap(
    await supabase
      .from("research")
      .select("id")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
  );
  return row?.id ?? null;
}

export async function getResearchStats(research: Pick<Research, "id" | "workspaceId">): Promise<ResearchStats> {
  const supabase = await createClient();
  const row = unwrap(
    await supabase
      .from("research_feedback_stats")
      .select("*")
      .eq("workspace_id", research.workspaceId)
      .eq("research_id", research.id)
      .maybeSingle()
  );
  return {
    feedbackCount: row?.feedback_count ?? 0,
    channelCount: row?.channel_count ?? 0,
    firstReceivedAt: row?.first_received_at ?? null,
    lastReceivedAt: row?.last_received_at ?? null,
  };
}

export async function listHypotheses(research: Pick<Research, "id" | "workspaceId">): Promise<Hypothesis[]> {
  const supabase = await createClient();
  const [hypotheses, verdicts] = await Promise.all([
    supabase
      .from("research_hypotheses")
      .select("id, text, written_at")
      .eq("workspace_id", research.workspaceId)
      .eq("research_id", research.id)
      .order("position"),
    supabase
      .from("hypothesis_verdicts")
      .select("hypothesis_id, verdict, reasoning, feedback_read, arrived_after, analyses (created_at)")
      .eq("workspace_id", research.workspaceId)
      .eq("research_id", research.id),
  ]);
  const verdictRows = unwrap(verdicts);
  const hypothesisIds = verdictRows.map((v) => v.hypothesis_id);
  // Every verdict of a click shares one analysis: usually a single count.
  const startedAt = [...new Set(verdictRows.map((v) => v.analyses.created_at))];
  const [links, quotes, arrived] = await Promise.all([
    supabase.from("verdict_feedback").select("hypothesis_id, stance").eq("workspace_id", research.workspaceId).in("hypothesis_id", hypothesisIds),
    supabase
      .from("verdict_feedback")
      .select(`hypothesis_id, stance, highlight, feedback (${FEEDBACK_COLUMNS})`)
      .eq("workspace_id", research.workspaceId)
      .in("hypothesis_id", hypothesisIds)
      .not("quote_rank", "is", null)
      .order("quote_rank"),
    Promise.all(startedAt.map(async (since) => [since, await countFeedbackAfter(research, since)] as const)),
  ]);
  const linkRows = unwrap(links);
  const quoteRows = unwrap(quotes);
  const arrivedAfter = new Map(arrived);
  const toVerdict = (row: (typeof verdictRows)[number]): Verdict => {
    const quotesOf = (stance: "for" | "against") =>
      quoteRows
        .filter((q) => q.hypothesis_id === row.hypothesis_id && q.stance === stance)
        .map((q) => toQuote(toFeedback(q.feedback), q.highlight));
    const linksOf = (stance: "for" | "against") =>
      linkRows.filter((l) => l.hypothesis_id === row.hypothesis_id && l.stance === stance).length;
    return {
      verdict: row.verdict,
      reasoning: row.reasoning,
      feedbackRead: row.feedback_read,
      arrivedAfter: row.arrived_after,
      supporting: linksOf("for"),
      contradicting: linksOf("against"),
      quotesFor: quotesOf("for"),
      quotesAgainst: quotesOf("against"),
      arrivedAfterVerdict: arrivedAfter.get(row.analyses.created_at) ?? 0,
    };
  };
  return unwrap(hypotheses).map((h) => {
    const row = verdictRows.find((v) => v.hypothesis_id === h.id);
    return { id: h.id, text: h.text, writtenAt: h.written_at, verdict: row ? toVerdict(row) : null };
  });
}

// What the Chiedi tab suggests asking: the hypotheses of the Research with their verdict, and the themes of its
// last done themes analysis that are not discarded, biggest first. Titles and texts only, no feedback.
export type AskTopics = {
  hypotheses: { text: string; verdict: Verdict["verdict"] | null }[];
  themes: { title: string; kind: ThemeKind }[];
};

export async function getAskTopics(research: Pick<Research, "id" | "workspaceId">): Promise<AskTopics> {
  const supabase = await createClient();
  const [hypotheses, verdicts, latest] = await Promise.all([
    supabase
      .from("research_hypotheses")
      .select("id, text")
      .eq("workspace_id", research.workspaceId)
      .eq("research_id", research.id)
      .order("position"),
    supabase
      .from("hypothesis_verdicts")
      .select("hypothesis_id, verdict")
      .eq("workspace_id", research.workspaceId)
      .eq("research_id", research.id),
    supabase
      .from("analyses")
      .select("id")
      .eq("workspace_id", research.workspaceId)
      .eq("research_id", research.id)
      .eq("kind", "themes")
      .eq("status", "done")
      .order("created_at", { ascending: false })
      .limit(1),
  ]);
  const verdictRows = unwrap(verdicts);
  const analysisId = unwrap(latest)[0]?.id;
  let themes: AskTopics["themes"] = [];
  if (analysisId) {
    const themeRows = unwrap(
      await supabase
        .from("themes")
        .select("id, title, kind, status")
        .eq("workspace_id", research.workspaceId)
        .eq("analysis_id", analysisId)
        .neq("status", "discarded")
    );
    const stats = unwrap(
      await supabase
        .from("theme_stats")
        .select("theme_id, feedback_count")
        .eq("workspace_id", research.workspaceId)
        .in("theme_id", themeRows.map((t) => t.id))
    );
    const countOfTheme = (id: string) => stats.find((s) => s.theme_id === id)?.feedback_count ?? 0;
    themes = themeRows
      .filter((t) => countOfTheme(t.id) > 0)
      .sort((a, b) => countOfTheme(b.id) - countOfTheme(a.id))
      .map((t) => ({ title: t.title, kind: t.kind }));
  }
  return {
    hypotheses: unwrap(hypotheses).map((h) => ({
      text: h.text,
      verdict: verdictRows.find((v) => v.hypothesis_id === h.id)?.verdict ?? null,
    })),
    themes,
  };
}

// The feedback of a Research that entered Voce after a moment (created_at, not the date of the feedback).
// How many hypotheses a Research has, without their text or verdicts: the room screen only says the verdict
// is elsewhere.
export async function countHypotheses(research: Pick<Research, "id" | "workspaceId">) {
  const supabase = await createClient();
  return countOf(
    await supabase
      .from("research_hypotheses")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", research.workspaceId)
      .eq("research_id", research.id)
  );
}

export async function countFeedbackAfter(research: Pick<Research, "id" | "workspaceId">, since: string) {
  const supabase = await createClient();
  return countOf(
    await supabase
      .from("feedback")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", research.workspaceId)
      .eq("research_id", research.id)
      .gt("created_at", since)
  );
}

export const getUsage = cache(async (workspaceId: string, now = new Date()): Promise<Usage> => {
  const supabase = await createClient();
  // Quotas follow the Italian calendar month: fetch a little more than a month and filter here.
  const since = new Date(now.getTime() - 32 * 24 * 60 * 60 * 1000).toISOString();
  const [subscription, feedback, analyses, questions] = await Promise.all([
    supabase.from("subscriptions").select("plan").eq("workspace_id", workspaceId).maybeSingle(),
    supabase.from("feedback").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    // Failed analyses do not use the quota.
    supabase
      .from("analyses")
      .select("created_at")
      .eq("workspace_id", workspaceId)
      .neq("status", "failed")
      .gte("created_at", since),
    questionUsage(workspaceId),
  ]);
  const plan = unwrap(subscription)?.plan ?? "free";
  const month = monthOf(now);
  return {
    plan,
    feedbackCount: countOf(feedback),
    feedbackLimit: PLAN_LIMITS[plan].feedback,
    analysesThisMonth: unwrap(analyses).filter((a) => monthOf(new Date(a.created_at)) === month).length,
    analysesLimit: PLAN_LIMITS[plan].analysesPerMonth,
    questionsThisMonth: questions.used,
    questionsLimit: questions.quota,
  };
});

// How many feedback "Analizza" would send now: the same selection the analysis makes on the server.
export async function getAnalysisPerimeter(research: Pick<Research, "id" | "workspaceId">) {
  const supabase = await createClient();
  const rows = unwrap(
    await supabase
      .from("feedback")
      .select("text")
      .eq("workspace_id", research.workspaceId)
      .eq("research_id", research.id)
      .order("received_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(ANALYSIS_MAX_FEEDBACK)
  );
  return selectFeedback(rows).length;
}

// For the room screen of a Research, polled every few seconds: counts only, never feedback text.
// The responses are those of its public form; the Free limit counts the whole workspace.
export async function getRoomStatus(research: Pick<Research, "id" | "workspaceId" | "formEnabled">): Promise<RoomStatus> {
  const supabase = await createClient();
  const [subscription, total, responses] = await Promise.all([
    supabase.from("subscriptions").select("plan").eq("workspace_id", research.workspaceId).maybeSingle(),
    supabase.from("feedback").select("id", { count: "exact", head: true }).eq("workspace_id", research.workspaceId),
    supabase
      .from("feedback")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", research.workspaceId)
      .eq("research_id", research.id)
      .eq("channel", PUBLIC_FORM_CHANNEL),
  ]);
  const plan = unwrap(subscription)?.plan ?? "free";
  return {
    responses: countOf(responses),
    form: formState({
      formEnabled: research.formEnabled,
      feedbackCount: countOf(total),
      feedbackLimit: PLAN_LIMITS[plan].feedback,
    }),
  };
}

export async function getBilling(workspaceId: string): Promise<Billing> {
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();
  if (authError) throw authError;
  const [subscription, member] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("plan, stripe_customer_id, stripe_status, current_period_end, cancel_at")
      .eq("workspace_id", workspaceId)
      .maybeSingle(),
    supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", auth?.claims.sub ?? "")
      .maybeSingle(),
  ]);
  const row = unwrap(subscription);
  return {
    plan: row?.plan ?? "free",
    stripeCustomerId: row?.stripe_customer_id ?? null,
    stripeStatus: row?.stripe_status ?? null,
    currentPeriodEnd: row?.current_period_end ?? null,
    cancelAt: row?.cancel_at ?? null,
    isOwner: unwrap(member)?.role === "owner",
  };
}

// The Sintesi of a Research: the themes of its last done themes analysis, and what changed since the one before.
export async function getDashboard(
  research: Pick<Research, "id" | "workspaceId">,
  filters: { kind?: ThemeKind; status?: StatusFilter } = {}
) {
  const supabase = await createClient();
  const [latestTwo, feedbackCount, channels, recent] = await Promise.all([
    supabase
      .from("analyses")
      .select("*")
      .eq("workspace_id", research.workspaceId)
      .eq("research_id", research.id)
      .eq("kind", "themes")
      // A running or failed analysis has no themes to show: the last finished one stays.
      .eq("status", "done")
      .order("created_at", { ascending: false })
      .limit(2),
    supabase
      .from("feedback")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", research.workspaceId)
      .eq("research_id", research.id),
    channelCounts(research.workspaceId, research.id),
    supabase
      .from("feedback")
      .select(FEEDBACK_COLUMNS)
      .eq("workspace_id", research.workspaceId)
      .eq("research_id", research.id)
      .order("received_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(RECENT_FEEDBACK),
  ]);
  const [analysisRow, previousRow] = unwrap(latestTwo);
  const analysis = analysisRow ? toAnalysis(analysisRow) : null;
  const previous = previousRow ? toAnalysis(previousRow) : null;
  // A theme whose feedback were all deleted has nothing left to show.
  const [current, before] = await Promise.all([
    analysis ? summarizeAnalysis(research.workspaceId, analysis) : [],
    previous ? summarizeAnalysis(research.workspaceId, previous) : [],
  ]);
  const titleKey = (title: string) => title.trim().toLowerCase();
  const allThemes = current
    .filter((t) => t.feedbackCount > 0)
    .map((t): ThemeSummary => {
      if (!previous) return t;
      const old = before.find((o) => titleKey(o.title) === titleKey(t.title));
      if (!old) return { ...t, change: { kind: "new" } };
      const count = t.feedbackCount - old.feedbackCount;
      return { ...t, change: count > 0 ? { kind: "more", count, since: previous.createdAt } : null };
    });

  let changes: { since: string; newFeedback: number; newThemes: number } | null = null;
  if (analysis && previous) {
    const arrived = await supabase
      .from("feedback")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", research.workspaceId)
      .eq("research_id", research.id)
      .gt("created_at", previous.createdAt)
      .lte("created_at", analysis.createdAt);
    changes = {
      since: previous.createdAt,
      newFeedback: countOf(arrived),
      newThemes: allThemes.filter((t) => t.change?.kind === "new").length,
    };
  }

  const status = filters.status ?? "open";
  const byStatus = allThemes.filter((t) =>
    status === "all" ? true : status === "open" ? OPEN_STATUSES.includes(t.status) : t.status === status
  );
  const kindCounts = countBy(byStatus, (t) => t.kind);
  const themes = byStatus
    .filter((t) => !filters.kind || t.kind === filters.kind)
    .sort((a, b) => b.feedbackCount - a.feedbackCount);

  return {
    analysis,
    changes,
    themes,
    themeTotal: byStatus.length,
    analysisThemeCount: allThemes.length,
    kindCounts,
    feedbackCount: countOf(feedbackCount),
    channels,
    recentFeedback: unwrap(recent).map(toFeedback),
  };
}

// One page of the Research's feedback, newest first. The channel counts give the totals without another query.
export async function listFeedback(
  research: Pick<Research, "id" | "workspaceId">,
  filters: { channel?: string; page?: number } = {}
) {
  const supabase = await createClient();
  const channels = await channelCounts(research.workspaceId, research.id);
  const total = channels.reduce((sum, c) => sum + c.count, 0);
  const matching = filters.channel ? (channels.find((c) => c.name === filters.channel)?.count ?? 0) : total;
  const pageCount = Math.max(1, Math.ceil(matching / FEEDBACK_PAGE_SIZE));
  const page = Math.min(Math.max(1, Math.floor(filters.page ?? 1)), pageCount);
  const from = (page - 1) * FEEDBACK_PAGE_SIZE;
  let query = supabase
    .from("feedback")
    .select(FEEDBACK_COLUMNS)
    .eq("workspace_id", research.workspaceId)
    .eq("research_id", research.id)
    .order("received_at", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id")
    .range(from, from + FEEDBACK_PAGE_SIZE - 1);
  if (filters.channel) query = query.eq("channel", filters.channel);
  const feedback = unwrap(await query).map(toFeedback);
  return { total, channels, feedback, page, pageCount };
}

// A theme of this Research. Null for a theme of another Research or workspace, or a wrong id.
export async function getTheme(research: Pick<Research, "id" | "workspaceId">, themeId: string) {
  // Theme ids come from the URL: anything that is not a uuid cannot exist.
  if (!z.uuid().safeParse(themeId).success) return null;
  const workspaceId = research.workspaceId;
  const supabase = await createClient();
  const themeRow = unwrap(
    await supabase
      .from("themes")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("research_id", research.id)
      .eq("id", themeId)
      .maybeSingle()
  );
  if (!themeRow) return null;
  const [analysisRow, links] = await Promise.all([
    supabase.from("analyses").select("*").eq("id", themeRow.analysis_id).single(),
    supabase
      .from("theme_feedback")
      .select(`quote_rank, highlight, feedback (${FEEDBACK_COLUMNS})`)
      .eq("workspace_id", workspaceId)
      .eq("theme_id", themeId),
  ]);
  const analysis = toAnalysis(unwrap(analysisRow));
  const linked = unwrap(links).map((l) => ({ ...l, feedback: toFeedback(l.feedback) }));
  // A theme whose feedback were all deleted is hidden from the dashboard, and has no page either.
  if (linked.length === 0) return null;
  const quotes = linked
    .filter((l) => l.quote_rank !== null)
    .sort((a, b) => a.quote_rank! - b.quote_rank!)
    .map((l) => toQuote(l.feedback, l.highlight));
  const feedback = sortByDateDesc(linked.map((l) => l.feedback)).map((f) =>
    toQuote(f, linked.find((l) => l.feedback.id === f.id)!.highlight)
  );
  return {
    ...toTheme(themeRow),
    feedbackCount: linked.length,
    change: null,
    trend: weeklyTrend(linked.map((l) => l.feedback.receivedAt), analysis.createdAt),
    quotes,
    analysis,
    feedback,
  };
}

// What the report of a Research is built from, read under the session: its last done themes analysis, the themes of
// it that are not discarded and still have feedback (biggest first) with their verified quotes, the hypotheses
// with their verdicts, the numbers of the Research, and the sample of quoted feedback with the themes and
// hypotheses each belongs to. Null without a done themes analysis.
export async function getReportSource(research: Pick<Research, "id" | "workspaceId" | "question">): Promise<ReportSource | null> {
  const supabase = await createClient();
  const synthesis = unwrap(
    await supabase
      .from("analyses")
      .select("id, created_at, feedback_count")
      .eq("workspace_id", research.workspaceId)
      .eq("research_id", research.id)
      .eq("kind", "themes")
      .eq("status", "done")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
  );
  if (!synthesis) return null;
  const [themeRows, stats, channels, hypotheses, arrivedAfter] = await Promise.all([
    supabase
      .from("themes")
      .select("id, title, kind, summary")
      .eq("workspace_id", research.workspaceId)
      .eq("analysis_id", synthesis.id)
      .neq("status", "discarded"),
    getResearchStats(research),
    channelCounts(research.workspaceId, research.id),
    listHypotheses(research),
    countFeedbackAfter(research, synthesis.created_at),
  ]);
  const themeIds = unwrap(themeRows).map((t) => t.id);
  const [themeStats, themeQuotes, links] = await Promise.all([
    supabase.from("theme_stats").select("theme_id, feedback_count").eq("workspace_id", research.workspaceId).in("theme_id", themeIds),
    supabase
      .from("theme_feedback")
      .select(`theme_id, highlight, feedback (${FEEDBACK_COLUMNS})`)
      .eq("workspace_id", research.workspaceId)
      .in("theme_id", themeIds)
      .not("quote_rank", "is", null)
      .order("quote_rank"),
    themeLinks(research.workspaceId, themeIds),
  ]);
  const countOf = (id: string) => unwrap(themeStats).find((s) => s.theme_id === id)?.feedback_count ?? 0;
  const quoteRows = unwrap(themeQuotes).map((q) => ({ ...q, feedback: toFeedback(q.feedback) }));
  const themes = unwrap(themeRows)
    .filter((t) => countOf(t.id) > 0)
    .sort((a, b) => countOf(b.id) - countOf(a.id))
    .map((t) => ({
      id: t.id,
      title: t.title,
      kind: t.kind,
      summary: t.summary,
      count: countOf(t.id),
      quotes: quoteRows.filter((q) => q.theme_id === t.id).map((q) => ({ feedbackId: q.feedback.id, highlight: q.highlight! })),
    }));
  const shown = new Set(themes.map((t) => t.id));

  // The quoted feedback, the themes' first, then the verdicts', each once.
  const sampled = new Map<string, Feedback>();
  for (const theme of themes)
    for (const q of quoteRows.filter((q) => q.theme_id === theme.id)) sampled.set(q.feedback.id, q.feedback);
  for (const h of hypotheses)
    for (const q of [...(h.verdict?.quotesFor ?? []), ...(h.verdict?.quotesAgainst ?? [])])
      if (!sampled.has(q.feedbackId))
        sampled.set(q.feedbackId, { id: q.feedbackId, workspaceId: research.workspaceId, text: q.text, channel: q.channel, customer: null, email: null, receivedAt: q.receivedAt });
  const stances = unwrap(
    await supabase
      .from("verdict_feedback")
      .select("hypothesis_id, feedback_id, stance")
      .eq("workspace_id", research.workspaceId)
      .in("feedback_id", [...sampled.keys()])
  );
  const hypothesisIds = new Set(hypotheses.map((h) => h.id));

  return {
    question: research.question,
    synthesis: { analysisId: synthesis.id, createdAt: synthesis.created_at, feedbackRead: synthesis.feedback_count },
    feedbackTotal: stats.feedbackCount,
    arrivedAfter,
    channels,
    firstReceivedAt: stats.firstReceivedAt ?? isoDateOf(new Date(synthesis.created_at)),
    lastReceivedAt: stats.lastReceivedAt ?? isoDateOf(new Date(synthesis.created_at)),
    themedCount: new Set(links.filter((l) => shown.has(l.theme_id)).map((l) => l.feedback_id)).size,
    themes,
    hypotheses: hypotheses.map((h) => ({
      id: h.id,
      text: h.text,
      verdict: h.verdict && {
        value: h.verdict.verdict,
        reasoning: h.verdict.reasoning,
        supporting: h.verdict.supporting,
        contradicting: h.verdict.contradicting,
        feedbackRead: h.verdict.feedbackRead,
      },
      quotes: [
        ...(h.verdict?.quotesFor.slice(0, 1).map((q) => ({ feedbackId: q.feedbackId, highlight: q.highlight!, stance: "for" as const })) ?? []),
        ...(h.verdict?.quotesAgainst.slice(0, 1).map((q) => ({ feedbackId: q.feedbackId, highlight: q.highlight!, stance: "against" as const })) ?? []),
      ],
    })),
    sample: [...sampled.values()].map((f) => ({
      feedbackId: f.id,
      text: f.text,
      channel: f.channel,
      receivedAt: f.receivedAt,
      themeIds: links.filter((l) => l.feedback_id === f.id && shown.has(l.theme_id)).map((l) => l.theme_id),
      hypotheses: stances
        .filter((s) => s.feedback_id === f.id && hypothesisIds.has(s.hypothesis_id))
        .map((s) => ({ id: s.hypothesis_id, stance: s.stance })),
    })),
  };
}

// Every link between these themes and their feedback, a page at a time: the API returns at most 1,000 rows,
// and 500 feedback in up to 3 themes each can make 1,500.
async function themeLinks(workspaceId: string, themeIds: string[]) {
  const supabase = await createClient();
  const page = 1000;
  const links: { theme_id: string; feedback_id: string }[] = [];
  for (let from = 0; ; from += page) {
    const rows = unwrap(
      await supabase
        .from("theme_feedback")
        .select("theme_id, feedback_id")
        .eq("workspace_id", workspaceId)
        .in("theme_id", themeIds)
        .order("theme_id")
        .order("feedback_id")
        .range(from, from + page - 1)
    );
    links.push(...rows);
    if (rows.length < page) return links;
  }
}

// The latest report of a Research, or null. newFeedback: feedback that entered Voce after it; newerSynthesisAt:
// when a themes or verdict analysis done after it started. feedback: the quoted feedback that still exist, by id,
// read under the session: a feedback deleted after the report leaves it.
export type LatestReport = {
  id: string;
  createdAt: string;
  locale: Locale;
  feedbackCount: number;
  content: ReportContent;
  newFeedback: number;
  newerSynthesisAt: string | null;
  feedback: Record<string, { text: string; channel: string; receivedAt: string }>;
};

export async function getLatestReport(research: Pick<Research, "id" | "workspaceId">): Promise<LatestReport | null> {
  const supabase = await createClient();
  const row = unwrap(
    await supabase
      .from("research_reports")
      .select("id, created_at, locale, feedback_count, content")
      .eq("workspace_id", research.workspaceId)
      .eq("research_id", research.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
  );
  if (!row) return null;
  const content = row.content as unknown as ReportContent;
  const quoted = [
    ...content.findings.flatMap((f) => f.quotes.map((q) => q.feedbackId)),
    ...content.hypotheses.flatMap((h) => h.quotes.map((q) => q.feedbackId)),
  ];
  const [newFeedback, newer, feedback] = await Promise.all([
    countFeedbackAfter(research, row.created_at),
    supabase
      .from("analyses")
      .select("created_at")
      .eq("workspace_id", research.workspaceId)
      .eq("research_id", research.id)
      .in("kind", ["themes", "verdict"])
      .eq("status", "done")
      .gt("created_at", row.created_at)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("feedback").select("id, text, channel, received_at").eq("workspace_id", research.workspaceId).in("id", [...new Set(quoted)]),
  ]);
  return {
    id: row.id,
    createdAt: row.created_at,
    locale: isLocale(row.locale) ? row.locale : DEFAULT_LOCALE,
    feedbackCount: row.feedback_count,
    content,
    newFeedback,
    newerSynthesisAt: unwrap(newer)?.created_at ?? null,
    feedback: Object.fromEntries(
      unwrap(feedback).map((f) => [f.id, { text: f.text, channel: f.channel, receivedAt: f.received_at }])
    ),
  };
}

// Public: read by anonymous visitors through a database function that returns only what the form shows.
// Once per request: the page and its metadata both need it.
export const getPublicForm = cache(async (slug: string) => {
  // Slugs come from the URL: anything else cannot exist.
  if (!FORM_SLUG_PATTERN.test(slug)) return null;
  const supabase = await createClient();
  const rows = unwrap(await supabase.rpc("get_public_form", { slug }));
  const form = rows[0];
  if (!form) return null;
  return { workspaceName: form.workspace_name, question: form.question, accepting: form.accepting };
});

async function summarizeAnalysis(workspaceId: string, analysis: Analysis): Promise<ThemeSummary[]> {
  const supabase = await createClient();
  const themeRows = unwrap(
    await supabase.from("themes").select("*").eq("workspace_id", workspaceId).eq("analysis_id", analysis.id)
  );
  const themeIds = themeRows.map((t) => t.id);
  const [stats, quoteLinks] = await Promise.all([
    supabase.from("theme_stats").select("*").eq("workspace_id", workspaceId).in("theme_id", themeIds),
    supabase
      .from("theme_feedback")
      .select(`theme_id, quote_rank, highlight, feedback (${FEEDBACK_COLUMNS})`)
      .eq("workspace_id", workspaceId)
      .in("theme_id", themeIds)
      .not("quote_rank", "is", null)
      .order("quote_rank"),
  ]);
  const statRows = unwrap(stats);
  const quoteRows = unwrap(quoteLinks);
  return themeRows.map((row) => {
    const stat = statRows.find((s) => s.theme_id === row.id);
    return {
      ...toTheme(row),
      feedbackCount: stat?.feedback_count ?? 0,
      change: null,
      trend: weeklyTrend(stat?.received_dates ?? [], analysis.createdAt),
      quotes: quoteRows
        .filter((q) => q.theme_id === row.id)
        .map((q) => toQuote(toFeedback(q.feedback), q.highlight)),
    };
  });
}

// The channels of the workspace, or of one of its Research, with their number of feedback.
export async function channelCounts(workspaceId: string, researchId?: string) {
  const supabase = await createClient();
  let query = supabase.from("feedback_channels").select("*").eq("workspace_id", workspaceId);
  if (researchId) query = query.eq("research_id", researchId);
  const counts = new Map<string, number>();
  for (const r of unwrap(await query)) counts.set(r.channel!, (counts.get(r.channel!) ?? 0) + r.feedback_count!);
  return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

function weeklyTrend(receivedDates: string[], end: string) {
  const endTime = Date.parse(end);
  const week = 7 * 24 * 60 * 60 * 1000;
  const trend: number[] = Array(TREND_WEEKS).fill(0);
  for (const date of receivedDates) {
    const weeksAgo = Math.floor((endTime - Date.parse(date)) / week);
    if (weeksAgo >= 0 && weeksAgo < TREND_WEEKS) trend[TREND_WEEKS - 1 - weeksAgo]++;
  }
  return trend;
}

function unwrap<T>(result: PostgrestSingleResponse<T>): T {
  if (result.error) throw result.error;
  return result.data;
}

function countOf(result: { count: number | null; error: unknown }) {
  if (result.error) throw result.error;
  return result.count ?? 0;
}

function toFeedback(row: Pick<Tables<"feedback">, "id" | "workspace_id" | "text" | "channel" | "customer" | "email" | "received_at">): Feedback {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    text: row.text,
    channel: row.channel,
    customer: row.customer,
    email: row.email,
    receivedAt: row.received_at,
  };
}

function toAnalysis(row: Tables<"analyses">): Analysis {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    createdAt: row.created_at,
    periodStart: row.period_start,
    feedbackCount: row.feedback_count,
  };
}

function toTheme(row: Tables<"themes">): Theme {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    researchId: row.research_id,
    analysisId: row.analysis_id,
    kind: row.kind,
    title: row.title,
    summary: row.summary,
    sentiment: row.sentiment,
    priority: row.priority,
    status: row.status,
  };
}

function toQuote(f: Feedback, highlight: string | null): Quote {
  return { feedbackId: f.id, text: f.text, highlight, channel: f.channel, receivedAt: f.receivedAt };
}

function countBy<T, K extends string>(items: T[], key: (item: T) => K) {
  const counts = {} as Record<K, number>;
  for (const item of items) counts[key(item)] = (counts[key(item)] ?? 0) + 1;
  return counts;
}

function sortByDateDesc<T extends { receivedAt: string }>(items: T[]) {
  return [...items].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
}
