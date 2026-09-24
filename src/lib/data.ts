import "server-only";

import { cache } from "react";

import * as db from "./mock-data";
import { monthOf } from "./format";
import { PLAN_LIMITS } from "./plans";
import type {
  Analysis,
  Feedback,
  Plan,
  Theme,
  ThemeKind,
  ThemeStatus,
  Workspace,
} from "./types";

// The only way pages read data. Today the functions read mock-data.ts;
// the Supabase step replaces their bodies with queries and deletes that file.

// Until login exists, every page acts as this workspace.
// Change it to ws_orto, ws_ordinalo or ws_nuovo to see the other states.
const CURRENT_WORKSPACE_ID = "ws_fatturino";

const TREND_WEEKS = 13;
const OPEN_STATUSES: ThemeStatus[] = ["to_review", "roadmap"];

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
};

// Cached per request: the layout and the page both ask.
export const getCurrentWorkspace = cache(async (): Promise<Workspace> => {
  const workspace = db.workspaces.find((w) => w.id === CURRENT_WORKSPACE_ID);
  if (!workspace) throw new Error(`Workspace ${CURRENT_WORKSPACE_ID} not found`);
  return workspace;
});

export const getUsage = cache(async (workspaceId: string, now = new Date()): Promise<Usage> => {
  const plan = planOf(workspaceId);
  const month = monthOf(now);
  return {
    plan,
    feedbackCount: feedbackOf(workspaceId).length,
    feedbackLimit: PLAN_LIMITS[plan].feedback,
    analysesThisMonth: db.analyses.filter(
      (a) => a.workspaceId === workspaceId && a.createdAt.startsWith(month)
    ).length,
    analysesLimit: PLAN_LIMITS[plan].analysesPerMonth,
  };
});

export async function getDashboard(
  workspaceId: string,
  filters: { kind?: ThemeKind; status?: StatusFilter } = {}
) {
  const feedback = feedbackOf(workspaceId);
  const analysis = latestAnalysis(workspaceId);
  const status = filters.status ?? "open";

  const byStatus = (analysis ? themesOf(analysis) : []).filter((t) =>
    status === "all" ? true : status === "open" ? OPEN_STATUSES.includes(t.status) : t.status === status
  );
  const kindCounts = countBy(byStatus, (t) => t.kind);
  const themes = byStatus
    .filter((t) => !filters.kind || t.kind === filters.kind)
    .map((t) => summarize(t, analysis!))
    .sort((a, b) => b.feedbackCount - a.feedbackCount);

  return {
    analysis,
    themes,
    themeTotal: byStatus.length,
    analysisThemeCount: analysis ? themesOf(analysis).length : 0,
    kindCounts,
    feedbackCount: feedback.length,
    channels: channelCounts(feedback),
    recentFeedback: sortByDateDesc(feedback).slice(0, 6),
  };
}

export async function listFeedback(workspaceId: string, filters: { channel?: string } = {}) {
  const feedback = feedbackOf(workspaceId);
  return {
    total: feedback.length,
    channels: channelCounts(feedback),
    feedback: sortByDateDesc(
      filters.channel ? feedback.filter((f) => f.channel === filters.channel) : feedback
    ),
  };
}

export async function getTheme(workspaceId: string, themeId: string) {
  const theme = db.themes.find((t) => t.id === themeId && t.workspaceId === workspaceId);
  if (!theme) return null;
  const analysis = db.analyses.find((a) => a.id === theme.analysisId)!;
  const links = db.themeFeedback.filter((l) => l.themeId === theme.id);
  const feedback = sortByDateDesc(
    db.feedback.filter((f) => f.workspaceId === workspaceId && links.some((l) => l.feedbackId === f.id))
  ).map((f) => toQuote(f, links.find((l) => l.feedbackId === f.id)!.highlight));
  return { ...summarize(theme, analysis), analysis, feedback };
}

// Public: read by anonymous visitors, so it returns only what the form shows.
export async function getPublicForm(slug: string) {
  const workspace = db.workspaces.find((w) => w.formSlug === slug && w.formEnabled);
  if (!workspace) return null;
  const limit = PLAN_LIMITS[planOf(workspace.id)].feedback;
  return {
    workspaceName: workspace.name,
    question: workspace.formQuestion ?? `Cosa vuoi dire al team di ${workspace.name}?`,
    accepting: limit === null || feedbackOf(workspace.id).length < limit,
  };
}

function planOf(workspaceId: string): Plan {
  return db.subscriptions.find((s) => s.workspaceId === workspaceId)?.plan ?? "free";
}

function feedbackOf(workspaceId: string) {
  return db.feedback.filter((f) => f.workspaceId === workspaceId);
}

function latestAnalysis(workspaceId: string): Analysis | null {
  const analyses = db.analyses.filter((a) => a.workspaceId === workspaceId);
  return analyses.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
}

function themesOf(analysis: Analysis) {
  return db.themes.filter((t) => t.analysisId === analysis.id);
}

function summarize(theme: Theme, analysis: Analysis): ThemeSummary {
  const links = db.themeFeedback.filter((l) => l.themeId === theme.id);
  const linked = links.map((l) => db.feedback.find((f) => f.id === l.feedbackId)!);
  const quotes = links
    .filter((l) => l.quoteRank !== null)
    .sort((a, b) => a.quoteRank! - b.quoteRank!)
    .map((l) => toQuote(linked.find((f) => f.id === l.feedbackId)!, l.highlight));
  return {
    ...theme,
    feedbackCount: linked.length,
    trend: weeklyTrend(linked, analysis.createdAt),
    quotes,
  };
}

function weeklyTrend(feedback: Feedback[], end: string) {
  const endTime = Date.parse(end);
  const week = 7 * 24 * 60 * 60 * 1000;
  const trend: number[] = Array(TREND_WEEKS).fill(0);
  for (const f of feedback) {
    const weeksAgo = Math.floor((endTime - Date.parse(f.receivedAt)) / week);
    if (weeksAgo >= 0 && weeksAgo < TREND_WEEKS) trend[TREND_WEEKS - 1 - weeksAgo]++;
  }
  return trend;
}

function toQuote(f: Feedback, highlight: string | null): Quote {
  return { feedbackId: f.id, text: f.text, highlight, channel: f.channel, receivedAt: f.receivedAt };
}

function channelCounts(feedback: Feedback[]) {
  return Object.entries(countBy(feedback, (f) => f.channel))
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function countBy<T, K extends string>(items: T[], key: (item: T) => K) {
  const counts = {} as Record<K, number>;
  for (const item of items) counts[key(item)] = (counts[key(item)] ?? 0) + 1;
  return counts;
}

function sortByDateDesc<T extends { receivedAt: string }>(items: T[]) {
  return [...items].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
}
