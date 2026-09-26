import { nextMonthName } from "@/components/ask-copy"
import { AskForm } from "@/components/ask-form"
import { Page, PageHeader, PageLede, PageTitle } from "@/components/page"
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
      <AskForm
        feedbackConsidered={Math.min(feedbackWindow.recent, ANALYSIS_MAX_FEEDBACK)}
        plan={usage.plan}
        usage={{ used: usage.questionsThisMonth, quota: usage.questionsLimit }}
        month={formatMonth(now)}
        nextMonth={nextMonthName(now)}
      />
    </Page>
  )
}
