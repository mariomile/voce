import Link from "next/link"
import { useTranslations } from "next-intl"
import { Stat } from "@/components/theme-row"
import type { ResearchSummary } from "@/lib/data"

// Kit: the two columns of .theme (number, content). One row of /research: the number of feedback
// leads, the question is the link, the state follows in muted text: themes, hypotheses with the verdict
// words that occur, feedback to analyze, form off; without feedback, "Nessun feedback ancora".
export function ResearchRow({ research }: { research: ResearchSummary }) {
  const t = useTranslations("research.list.row")
  const { hypotheses } = research
  const verdicts = [
    hypotheses.confirmed && t("confirmed", { count: hypotheses.confirmed }),
    hypotheses.refuted && t("refuted", { count: hypotheses.refuted }),
    hypotheses.toReview && t("toReview", { count: hypotheses.toReview }),
  ].filter(Boolean)
  const states = [
    research.feedbackCount === 0 ? t("noFeedback") : null,
    research.themeCount > 0 ? t("themes", { count: research.themeCount }) : null,
    hypotheses.total > 0
      ? verdicts.length > 0
        ? t("hypothesesWithVerdicts", { count: hypotheses.total, verdicts: verdicts.join(", ") })
        : t("hypotheses", { count: hypotheses.total })
      : null,
    research.newFeedback > 0 ? t("newFeedback", { count: research.newFeedback }) : null,
    research.formEnabled ? null : t("formOff"),
  ].filter((s) => s !== null)
  return (
    <article className="grid grid-cols-1 gap-3 border-b border-line py-6 sm:grid-cols-[148px_1fr] sm:gap-8">
      <div>{research.feedbackCount > 0 && <Stat value={research.feedbackCount} label={t("feedbackLabel")} />}</div>
      <div>
        <h2 className="mb-1 text-2xl leading-snug font-bold tracking-snug">
          <Link href={`/research/${research.id}`} className="hover:underline">
            {research.question}
          </Link>
        </h2>
        {states.length > 0 && <p className="text-md text-ink-muted">{states.join(" · ")}</p>}
      </div>
    </article>
  )
}
