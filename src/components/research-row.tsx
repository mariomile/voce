import Link from "next/link"
import { useTranslations } from "next-intl"
import { Stat } from "@/components/theme-row"
import type { ResearchSummary } from "@/lib/data"

// Kit: the two columns of .theme (number, content). One row of /research: the number of feedback
// leads, the question is the link, the state follows in muted text.
export function ResearchRow({ research }: { research: ResearchSummary }) {
  const t = useTranslations("research.list.row")
  const states = [
    research.feedbackCount === 0 ? t("noFeedback") : null,
    research.formEnabled ? null : t("formOff"),
  ].filter((s) => s !== null)
  return (
    <article className="grid grid-cols-[148px_1fr] gap-8 border-b border-line py-6">
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
