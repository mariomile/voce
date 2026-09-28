// Domain types. They mirror the future Supabase tables one to one.

export type Plan = "free" | "pro";
export type ThemeKind = "problem" | "opportunity" | "praise";
export type Priority = "high" | "medium" | "low";
export type ThemeStatus = "to_review" | "roadmap" | "done" | "discarded";
export type Sentiment = "positive" | "neutral" | "negative" | "mixed";

export type Workspace = {
  id: string;
  name: string;
};

// A question of the PM with its own collection: every feedback belongs to one Research.
export type Research = {
  id: string;
  workspaceId: string;
  // The PM's question, max 200 characters: the name of the Research.
  question: string;
  formSlug: string;
  formEnabled: boolean;
  // Shown on the public form, max 140 characters. Null means the default question.
  formQuestion: string | null;
  createdAt: string;
};

// Written only by the Stripe webhook, never by the user.
export type Subscription = {
  workspaceId: string;
  plan: Plan;
};

export type Feedback = {
  id: string;
  workspaceId: string;
  text: string;
  // Free text: "Supporto", "Call vendita", "Modulo pubblico", or whatever a CSV says.
  channel: string;
  customer: string | null;
  email: string | null;
  receivedAt: string; // ISO date, YYYY-MM-DD
};

export type Analysis = {
  id: string;
  workspaceId: string;
  createdAt: string; // ISO date
  periodStart: string; // ISO date, first day of the analysed window
  feedbackCount: number;
};

export type Theme = {
  id: string;
  workspaceId: string;
  analysisId: string;
  kind: ThemeKind;
  title: string;
  summary: string;
  sentiment: Sentiment;
  priority: Priority | null;
  status: ThemeStatus;
};

// A feedback linked to a theme. A feedback can sit in up to 3 themes.
export type ThemeFeedback = {
  themeId: string;
  feedbackId: string;
  // Set on the quotes the AI picked to represent the theme.
  quoteRank: number | null;
  // Exact substring of the feedback text to highlight. Only on quotes.
  highlight: string | null;
};
