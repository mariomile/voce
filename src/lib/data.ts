import "server-only";

import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import { cache } from "react";
import { z } from "zod";

import type { Tables } from "./database.types";
import { ANALYSIS_WINDOW_DAYS } from "./analysis";
import { isoDateOf, monthOf } from "./format";
import { FORM_SLUG_PATTERN, PLAN_LIMITS } from "./plans";
import { formState, PUBLIC_FORM_CHANNEL, type RoomStatus } from "./room";
import { questionUsage } from "./supabase/admin";
import { createClient } from "./supabase/server";
import type { Analysis, Feedback, Plan, Theme, ThemeKind, ThemeStatus, Workspace } from "./types";

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

export type ThemeSummary = Theme & {
  feedbackCount: number;
  // Feedback per week, oldest first, ending with the analysis week.
  trend: number[];
  quotes: Quote[];
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
    .select("id, name, form_slug, form_enabled, form_question")
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  // The proxy already sends signed-out users to /login: a signed-in user without a workspace is a bug.
  if (!data) throw new Error("The signed-in user has no workspace");
  return {
    id: data.id,
    name: data.name,
    formSlug: data.form_slug,
    formEnabled: data.form_enabled,
    formQuestion: data.form_question,
  };
});

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

// For the room screen, polled every few seconds: counts only, never feedback text.
export async function getRoomStatus(workspace: Pick<Workspace, "id" | "formEnabled">): Promise<RoomStatus> {
  const supabase = await createClient();
  const [subscription, total, responses] = await Promise.all([
    supabase.from("subscriptions").select("plan").eq("workspace_id", workspace.id).maybeSingle(),
    supabase.from("feedback").select("id", { count: "exact", head: true }).eq("workspace_id", workspace.id),
    supabase
      .from("feedback")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspace.id)
      .eq("channel", PUBLIC_FORM_CHANNEL),
  ]);
  const plan = unwrap(subscription)?.plan ?? "free";
  return {
    responses: countOf(responses),
    form: formState({
      formEnabled: workspace.formEnabled,
      feedbackCount: countOf(total),
      feedbackLimit: PLAN_LIMITS[plan].feedback,
    }),
  };
}

// For "Chiedi": all the feedback, and those a question reads (the last 90 days, today included).
export async function getQuestionWindow(workspaceId: string) {
  const supabase = await createClient();
  const since = new Date(Date.parse(isoDateOf(new Date())) - (ANALYSIS_WINDOW_DAYS - 1) * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const [total, recent] = await Promise.all([
    supabase.from("feedback").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    supabase
      .from("feedback")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .gte("received_at", since),
  ]);
  return { total: countOf(total), recent: countOf(recent) };
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

export async function getDashboard(
  workspaceId: string,
  filters: { kind?: ThemeKind; status?: StatusFilter } = {}
) {
  const supabase = await createClient();
  const [latest, feedbackCount, channels, recent] = await Promise.all([
    supabase
      .from("analyses")
      .select("*")
      .eq("workspace_id", workspaceId)
      // A running or failed analysis has no themes to show: the last finished one stays.
      .eq("status", "done")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("feedback").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    channelCounts(workspaceId),
    supabase
      .from("feedback")
      .select(FEEDBACK_COLUMNS)
      .eq("workspace_id", workspaceId)
      .order("received_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(RECENT_FEEDBACK),
  ]);
  const analysisRow = unwrap(latest);
  const analysis = analysisRow ? toAnalysis(analysisRow) : null;
  // A theme whose feedback were all deleted has nothing left to show.
  const allThemes = analysis
    ? (await summarizeAnalysis(workspaceId, analysis)).filter((t) => t.feedbackCount > 0)
    : [];

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
    themes,
    themeTotal: byStatus.length,
    analysisThemeCount: allThemes.length,
    kindCounts,
    feedbackCount: countOf(feedbackCount),
    channels,
    recentFeedback: unwrap(recent).map(toFeedback),
  };
}

// One page of the list, newest first. The channel counts give the totals without another query.
export async function listFeedback(workspaceId: string, filters: { channel?: string; page?: number } = {}) {
  const supabase = await createClient();
  const channels = await channelCounts(workspaceId);
  const total = channels.reduce((sum, c) => sum + c.count, 0);
  const matching = filters.channel ? (channels.find((c) => c.name === filters.channel)?.count ?? 0) : total;
  const pageCount = Math.max(1, Math.ceil(matching / FEEDBACK_PAGE_SIZE));
  const page = Math.min(Math.max(1, Math.floor(filters.page ?? 1)), pageCount);
  const from = (page - 1) * FEEDBACK_PAGE_SIZE;
  let query = supabase
    .from("feedback")
    .select(FEEDBACK_COLUMNS)
    .eq("workspace_id", workspaceId)
    .order("received_at", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id")
    .range(from, from + FEEDBACK_PAGE_SIZE - 1);
  if (filters.channel) query = query.eq("channel", filters.channel);
  const feedback = unwrap(await query).map(toFeedback);
  return { total, channels, feedback, page, pageCount };
}

export async function getTheme(workspaceId: string, themeId: string) {
  // Theme ids come from the URL: anything that is not a uuid cannot exist.
  if (!z.uuid().safeParse(themeId).success) return null;
  const supabase = await createClient();
  const themeRow = unwrap(
    await supabase.from("themes").select("*").eq("workspace_id", workspaceId).eq("id", themeId).maybeSingle()
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
    trend: weeklyTrend(linked.map((l) => l.feedback.receivedAt), analysis.createdAt),
    quotes,
    analysis,
    feedback,
  };
}

// Public: read by anonymous visitors through a database function that returns only what the form shows.
export async function getPublicForm(slug: string) {
  // Slugs come from the URL: anything else cannot exist.
  if (!FORM_SLUG_PATTERN.test(slug)) return null;
  const supabase = await createClient();
  const rows = unwrap(await supabase.rpc("get_public_form", { slug }));
  const form = rows[0];
  if (!form) return null;
  return { workspaceName: form.workspace_name, question: form.question, accepting: form.accepting };
}

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
      trend: weeklyTrend(stat?.received_dates ?? [], analysis.createdAt),
      quotes: quoteRows
        .filter((q) => q.theme_id === row.id)
        .map((q) => toQuote(toFeedback(q.feedback), q.highlight)),
    };
  });
}

export async function channelCounts(workspaceId: string) {
  const supabase = await createClient();
  const rows = unwrap(await supabase.from("feedback_channels").select("*").eq("workspace_id", workspaceId));
  return rows
    .map((r) => ({ name: r.channel!, count: r.feedback_count! }))
    .sort((a, b) => b.count - a.count);
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
