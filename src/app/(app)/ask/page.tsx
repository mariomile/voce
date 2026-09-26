import { nextMonthName } from "@/components/ask-copy"
import Link from "next/link"
import { AskForm } from "@/components/ask-form"
import { Page, PageHeader, PageLede, PageTitle } from "@/components/page"
import { buttonVariants } from "@/components/ui/button"
import { ANALYSIS_MAX_FEEDBACK } from "@/lib/analysis"
import { getCurrentWorkspace, getQuestionWindow, getUsage } from "@/lib/data"
import { formatMonth } from "@/lib/format"

export const metadata = { title: "Chiedi ai tuoi feedback" }

// The question action runs from this page: the model stops at 60 seconds.
export const maxDuration = 90

export default async function AskPage() {
  const workspace = await getCurrentWorkspace()
  const [feedbackWindow, usage] = await Promise.all([getQuestionWindow(workspace.id), getUsage(workspace.id)])
  const now = new Date()

  return (
    <Page>
      <PageHeader>
        <div>
          <PageTitle>Chiedi ai tuoi feedback</PageTitle>
          <PageLede>
            Scrivi una domanda su un argomento. Voce risponde con quanti feedback ne parlano e con le frasi esatte
            dei clienti.
          </PageLede>
        </div>
      </PageHeader>
      {feedbackWindow.recent === 0 ? (
        <NothingToAsk olderCount={feedbackWindow.total} />
      ) : (
        <AskForm
          feedbackConsidered={Math.min(feedbackWindow.recent, ANALYSIS_MAX_FEEDBACK)}
          plan={usage.plan}
          usage={{ used: usage.questionsThisMonth, quota: usage.questionsLimit }}
          month={formatMonth(now)}
          nextMonth={nextMonthName(now)}
        />
      )}
    </Page>
  )
}

// In place of the field: a question without feedback would spend the quota for nothing.
function NothingToAsk({ olderCount }: { olderCount: number }) {
  return (
    <div className="py-6">
      <h2 className="mb-4 max-w-[24ch] font-serif text-5xl leading-snug font-normal tracking-snug">
        {olderCount === 0
          ? "Qui farai domande ai tuoi feedback e leggerai le risposte con le parole dei clienti."
          : "Negli ultimi 90 giorni non è arrivato nessun feedback."}
      </h2>
      <p className="mb-8 max-w-[58ch] text-lg leading-relaxed text-ink-muted">
        {olderCount === 0
          ? "Per rispondere servono feedback. Aggiungili dal modulo pubblico, da un CSV o incollandoli a mano."
          : `Chiedi legge solo i feedback degli ultimi 90 giorni, e i tuoi ${olderCount} sono più vecchi. Aggiungine di recenti per fare una domanda.`}
      </p>
      <Link href="/collect" className={buttonVariants()}>
        Aggiungi feedback
      </Link>
    </div>
  )
}
