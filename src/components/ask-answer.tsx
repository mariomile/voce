import type { AskResult } from "@/app/(app)/ask/actions"
import { Quote } from "@/components/quote"
import { Stat } from "@/components/theme-row"
import { formatDate } from "@/lib/format"

type Answer = Extract<AskResult, { ok: true }>

// The answer to one question: the number counted by the server, the text written by Voce (sans),
// then the customers' own verified words (serif). Everything is rendered as text.
export function AskAnswer({ result }: { result: Answer }) {
  return (
    <section aria-labelledby="ask-answer-heading" className="mt-10 border-t-2 border-ink pt-6">
      <h2 id="ask-answer-heading" className="mb-6 text-md font-normal text-ink-muted">
        Risposta a «{result.question}»
      </h2>
      {result.outcome === "answered" && (
        <div className="grid grid-cols-[148px_1fr] gap-8">
          <div>
            <Stat value={result.feedbackCount} label="feedback ne parlano" />
          </div>
          <div>
            <p className="mb-8 max-w-[58ch] text-3xl leading-snug font-medium">{result.answer}</p>
            <p className="mb-4 text-md font-semibold">Cosa hanno scritto</p>
            <div className="mb-8 flex flex-col gap-6">
              {result.quotes.map((q, i) => (
                <Quote key={i} text={q.text} highlight={q.highlight} cite={`${q.channel}, ${formatDate(q.receivedAt)}`} />
              ))}
            </div>
            <p className="text-sm text-ink-muted">
              Letti {result.feedbackConsidered} feedback degli ultimi 90 giorni. La risposta non resta su questa
              pagina: se ti serve, copiala.
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
