import type { ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { createTranslator } from "use-intl/core"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { messages } from "@/i18n/messages/index"
import type { Hypothesis, ResearchSummary, ThemeSummary, Usage } from "@/lib/data"
import type { Feedback, Research } from "@/lib/types"

// AC 69: the Research pages rendered with the English catalog carry none of the Italian sentences of DESIGN.md.
// The Italian sentences are the Italian catalog itself (DESIGN.md is its source): every literal fragment of an
// Italian string, so an English string left in Italian is caught too. The public form stays in Italian on purpose (the `form`
// namespace, PUBLIC_FORM_LOCALE), so it is left out. Every page is rendered in Italian too: the same check
// must find Italian there, or it proves nothing.
const ui = vi.hoisted(() => ({ locale: "en" as "it" | "en" }))
const translator = (locale: "it" | "en", namespace?: string) =>
  createTranslator({ locale, timeZone: "Europe/Rome", messages: messages[locale], namespace: namespace as never })
vi.mock("next-intl", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next-intl")>()),
  useTranslations: (namespace?: string) => translator(ui.locale, namespace),
  useLocale: () => ui.locale,
}))
vi.mock("next-intl/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next-intl/server")>()),
  getTranslations: async (options?: string | { locale?: "it" | "en"; namespace?: string }) =>
    typeof options === "object"
      ? translator(options.locale ?? ui.locale, options.namespace)
      : translator(ui.locale, options),
  getLocale: async () => ui.locale,
}))

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("notFound")
  },
  redirect: () => {
    throw new Error("redirect")
  },
  unstable_rethrow: () => {},
  usePathname: () => "/research/11111111-1111-4111-8111-111111111111",
  useRouter: () => ({ push: () => {}, refresh: () => {}, replace: () => {} }),
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock("@/lib/origin", () => ({ getOrigin: async () => "https://voce.test" }))

const RID = "11111111-1111-4111-8111-111111111111"
const TID = "22222222-2222-4222-8222-222222222222"

// Fixed data in English, so no Italian can come from the data.
const research: Research = {
  id: RID,
  workspaceId: "ws",
  question: "What do customers say about invoicing?",
  formSlug: "acme-a1b2",
  formEnabled: true,
  formQuestion: "What slowed you down this week?",
  createdAt: "2026-09-01T09:00:00Z",
}
const feedback = (n: number, channel = "Support"): Feedback => ({
  id: `33333333-3333-4333-8333-${String(n).padStart(12, "0")}`,
  workspaceId: "ws",
  text: `The export breaks every month, feedback number ${n}.`,
  channel,
  customer: null,
  email: null,
  receivedAt: `2026-09-${String(10 + n).padStart(2, "0")}`,
})
const quote = (n: number) => ({
  feedbackId: feedback(n).id,
  text: feedback(n).text,
  highlight: "The export breaks",
  channel: "Support",
  receivedAt: feedback(n).receivedAt,
})
const theme = (id: string, title: string, change: ThemeSummary["change"]): ThemeSummary => ({
  id,
  workspaceId: "ws",
  researchId: RID,
  analysisId: "a1",
  kind: "problem",
  title,
  summary: "Customers lose time on the monthly export.",
  sentiment: "negative",
  priority: "high",
  status: "to_review",
  feedbackCount: 4,
  change,
  trend: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
  quotes: [quote(1), quote(2)],
})
const hypotheses: Hypothesis[] = [
  {
    id: "h1",
    text: "The export is the main reason to churn.",
    writtenAt: "2026-09-12T09:00:00Z",
    verdict: {
      verdict: "confirmed",
      reasoning: "Customers from every channel describe the same broken export.",
      feedbackRead: 12,
      arrivedAfter: 3,
      supporting: 4,
      contradicting: 1,
      quotesFor: [quote(1), quote(2)],
      quotesAgainst: [quote(3)],
      arrivedAfterVerdict: 2,
    },
  },
  {
    id: "h2",
    text: "Customers want a mobile app.",
    writtenAt: "2026-09-01T09:00:00Z",
    verdict: {
      verdict: "to_review",
      reasoning: "Nobody mentions it.",
      feedbackRead: 12,
      arrivedAfter: 0,
      supporting: 0,
      contradicting: 0,
      quotesFor: [],
      quotesAgainst: [],
      arrivedAfterVerdict: 0,
    },
  },
  { id: "h3", text: "Price matters less than the missing export.", writtenAt: "2026-09-21T09:00:00Z", verdict: null },
]
const channels = [
  { name: "Support", count: 8 },
  { name: "Interview", count: 4 },
]
const usage: Usage = {
  plan: "free",
  feedbackCount: 12,
  feedbackLimit: 100,
  analysesThisMonth: 1,
  analysesLimit: 3,
  questionsThisMonth: 2,
  questionsLimit: 10,
}
const state = { themeCount: 0, hypotheses: { total: 0, confirmed: 0, refuted: 0, toReview: 0 }, newFeedback: 0 }
const rows: ResearchSummary[] = [
  {
    ...state,
    id: RID,
    question: research.question,
    formEnabled: true,
    feedbackCount: 12,
    themeCount: 2,
    hypotheses: { total: 3, confirmed: 1, refuted: 0, toReview: 1 },
    newFeedback: 2,
    lastActivity: "2026-09-28T10:00:00Z",
  },
  { ...state, id: "r2", question: "Why do trials not convert?", formEnabled: false, feedbackCount: 0, lastActivity: "2026-09-27T10:00:00Z" },
]

const data = vi.hoisted(() => ({ list: [] as unknown[], feedbackCount: 12 }))
vi.mock("@/lib/data", () => ({
  FEEDBACK_PAGE_SIZE: 100,
  getCurrentWorkspace: async () => ({ id: "ws", name: "Acme" }),
  listResearch: async () => data.list,
  getResearch: async (id: string) => (id === RID ? research : null),
  getResearchStats: async () => ({
    feedbackCount: data.feedbackCount,
    channelCount: data.feedbackCount ? 2 : 0,
    firstReceivedAt: data.feedbackCount ? "2026-09-11" : null,
    lastReceivedAt: data.feedbackCount ? "2026-09-22" : null,
  }),
  listHypotheses: async () => hypotheses,
  countHypotheses: async () => hypotheses.length,
  countFeedbackAfter: async () => 0,
  getUsage: async () => usage,
  getAnalysisPerimeter: async () => data.feedbackCount,
  getDashboard: async () => ({
    analysis: { id: "a1", workspaceId: "ws", createdAt: "2026-09-20T10:00:00Z", periodStart: "2026-06-01", feedbackCount: 10 },
    changes: { since: "2026-09-10T10:00:00Z", newFeedback: 2, newThemes: 1 },
    themes: [theme(TID, "The monthly export breaks", { kind: "new" }), theme("t2", "Bank sync drops", { kind: "more", count: 2, since: "2026-09-10T10:00:00Z" })],
    themeTotal: 2,
    analysisThemeCount: 2,
    kindCounts: { problem: 2 },
    feedbackCount: 12,
    channels,
    recentFeedback: [feedback(1), feedback(2, "Interview")],
  }),
  listFeedback: async () => ({ total: 12, channels, feedback: [feedback(1), feedback(2, "Interview")], page: 1, pageCount: 1 }),
  getTheme: async () => ({
    ...theme(TID, "The monthly export breaks", null),
    analysis: { id: "a1", workspaceId: "ws", createdAt: "2026-09-20T10:00:00Z", periodStart: "2026-06-01", feedbackCount: 10 },
    feedback: [quote(1), quote(2)],
  }),
  channelCounts: async () => channels,
  getRoomStatus: async () => ({ responses: 7, form: "open" }),
}))

const { default: AppLayout } = await import("@/app/(app)/layout")
const { default: ResearchPage } = await import("@/app/(app)/research/page")
const { default: NewResearchPage } = await import("@/app/(app)/research/new/page")
const { default: ResearchNotFound } = await import("@/app/(app)/research/not-found")
const { default: ResearchLayout } = await import("@/app/(app)/research/[id]/layout")
const { default: SynthesisPage } = await import("@/app/(app)/research/[id]/page")
const { default: CollectPage } = await import("@/app/(app)/research/[id]/collect/page")
const { default: FeedbackPage } = await import("@/app/(app)/research/[id]/feedback/page")
const { default: ThemePage } = await import("@/app/(app)/research/[id]/themes/[themeId]/page")
const { default: AskPage } = await import("@/app/(app)/research/[id]/ask/page")
const { default: RoomPage } = await import("@/app/research/[id]/sala/page")

const params = <T extends object>(value: T) => Promise.resolve(value) as never
const inLayout = async (page: ReactNode) =>
  renderToStaticMarkup(await AppLayout({ children: await ResearchLayout({ children: page, params: params({ id: RID }) } as never), params: params({}) } as never))

// Every page of the Research, as the PM sees it.
const pages: Record<string, () => Promise<string>> = {
  "/research, first run": async () => {
    data.list = []
    return renderToStaticMarkup(await AppLayout({ children: await ResearchPage(), params: params({}) } as never))
  },
  "/research, list": async () => {
    data.list = rows
    return renderToStaticMarkup(await ResearchPage())
  },
  "/research/new": async () => renderToStaticMarkup(await NewResearchPage()),
  "not found": async () => renderToStaticMarkup(await ResearchNotFound()),
  "Sintesi with themes, hypotheses and verdicts": async () =>
    inLayout(await SynthesisPage({ params: params({ id: RID }), searchParams: params({}) } as never)),
  "Sintesi with no feedback": async () => {
    data.feedbackCount = 0
    return inLayout(await SynthesisPage({ params: params({ id: RID }), searchParams: params({}) } as never))
  },
  Raccolta: async () => inLayout(await CollectPage({ params: params({ id: RID }) } as never)),
  Feedback: async () => inLayout(await FeedbackPage({ params: params({ id: RID }), searchParams: params({}) } as never)),
  theme: async () => inLayout(await ThemePage({ params: params({ id: RID, themeId: TID }) } as never)),
  Chiedi: async () => inLayout(await AskPage({ params: params({ id: RID }) } as never)),
  sala: async () => renderToStaticMarkup(await RoomPage({ params: params({ id: RID }) } as never)),
}

// The literal fragments of every Italian string that differs from its English one, as React escapes them.
const NAMESPACES = ["common", "app", "research", "themes", "ask", "feedback", "collect", "room"] as const
function strings(value: unknown, path: string, out: Map<string, string>) {
  if (typeof value === "string") out.set(path, value)
  else if (value && typeof value === "object")
    for (const [key, child] of Object.entries(value)) strings(child, `${path}.${key}`, out)
  return out
}
const escape = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;")
const italianSentences = [
  ...new Set(
    NAMESPACES.flatMap((ns) =>
      [...strings(messages.it[ns], ns, new Map()).values()]
        .flatMap((text) => text.split(/[{}<>#]/))
        .map((fragment) => fragment.trim())
        .filter((fragment) => fragment.length >= 15 && / /.test(fragment))
    )
  ),
].map(escape)
const italianIn = (html: string) => italianSentences.filter((sentence) => html.includes(sentence))

beforeEach(() => {
  data.list = []
  data.feedbackCount = 12
})

describe("English render", () => {
  it("finds enough Italian sentences in the catalog to check", () => {
    expect(italianSentences.length).toBeGreaterThan(200)
    expect(italianSentences).toContain("Nessun verdetto ancora. Arriva con la prossima analisi.")
  })

  for (const [name, render] of Object.entries(pages)) {
    it(`${name}: rendered with the en catalog, contains none of the Italian sentences of DESIGN.md`, async () => {
      ui.locale = "en"
      const english = await render()
      expect(italianIn(english)).toEqual([])
      ui.locale = "it"
      data.feedbackCount = 12
      data.list = []
      const italian = await render()
      expect(italianIn(italian).length, "the same page in Italian").toBeGreaterThan(0)
    })
  }
})
