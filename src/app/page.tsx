import Link from "next/link"
import { Logo } from "@/components/logo"
import { Quote } from "@/components/quote"
import { Stat } from "@/components/theme-row"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardActions, CardText, CardTitle } from "@/components/ui/card"
import { PLAN_LIMITS } from "@/lib/plans"

const STEPS = [
  {
    title: "Raccogli",
    text: "Incolli un feedback, importi un CSV o condividi un link pubblico, anche come QR code. Chi risponde non ha bisogno di un account.",
  },
  {
    title: "Analizza",
    text: "L'AI raggruppa i feedback in problemi, opportunità e apprezzamenti, con una sintesi e le citazioni che li rappresentano meglio.",
  },
  {
    title: "Decidi",
    text: "I temi sono ordinati per numero di feedback. A ognuno dai una priorità e uno stato, e porti in roadmap quello che conta.",
  },
]

const PLANS = [
  {
    name: "Free",
    price: "0 €",
    period: "per sempre",
    features: [
      `Fino a ${PLAN_LIMITS.free.feedback} feedback`,
      `${PLAN_LIMITS.free.analysesPerMonth} analisi AI al mese`,
      "Modulo pubblico, CSV e inserimento manuale",
    ],
    cta: "Inizia gratis",
  },
  {
    name: "Pro",
    price: "19 €",
    period: "al mese",
    features: [
      "Feedback illimitati",
      `${PLAN_LIMITS.pro.analysesPerMonth} analisi AI al mese`,
      "Tutto quello che c'è in Free",
    ],
    cta: "Prova Pro",
  },
]

export default function LandingPage() {
  return (
    <>
      <header className="mx-auto flex h-16 w-full max-w-[1120px] items-center gap-8 px-10">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <Logo />
          Voce
        </Link>
        <nav className="ml-auto flex items-center gap-6 text-base">
          <a href="#prezzi" className="text-ink-muted hover:text-ink">
            Prezzi
          </a>
          <Link href="/login" className="text-ink-muted hover:text-ink">
            Accedi
          </Link>
          <Link href="/signup" className={buttonVariants()}>
            Prova gratis
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-[1120px] px-10 pb-24">
        <section className="grid grid-cols-[1.1fr_1fr] items-center gap-16 py-24">
          <div>
            <h1 className="mb-6 max-w-[16ch] text-6xl leading-tight font-bold tracking-tight">
              Cosa chiedono i tuoi clienti, raggruppato per tema.
            </h1>
            <p className="mb-10 max-w-[52ch] text-lg leading-relaxed text-ink-muted">
              Voce mette insieme i feedback di supporto, call di vendita, sondaggi e recensioni, e li
              raggruppa con l&apos;AI. Vedi in pochi minuti quali problemi tornano più spesso, con le
              parole dei clienti, e decidi cosa mettere in roadmap.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/signup" className={buttonVariants({ size: "lg" })}>
                Crea il tuo workspace
              </Link>
              <a href="#prezzi" className={buttonVariants({ variant: "link" })}>
                Guarda i prezzi
              </a>
            </div>
          </div>

          {/* Example of a theme, as it appears in the app */}
          <Card className="gap-4" role="figure" aria-label="Esempio di tema">
            <div className="flex items-end gap-4">
              <Stat value={58} />
              <span className="text-md text-ink-muted">feedback</span>
            </div>
            <div>
              <Badge variant="problem">Problema</Badge>
              <p className="mt-2 text-2xl leading-snug font-bold tracking-snug">
                La sincronizzazione con la banca si interrompe
              </p>
            </div>
            <Quote
              size="sm"
              text="Ogni lunedì devo ricollegare la banca, altrimenti i movimenti della settimana non arrivano."
              highlight="i movimenti della settimana non arrivano"
              cite="Supporto, 18 settembre"
            />
          </Card>
        </section>

        <section className="grid grid-cols-3 gap-8 pb-24">
          {STEPS.map((step, i) => (
            <div key={step.title} className="border-t border-ink pt-4">
              <p className="mb-2 text-md font-semibold text-ink-muted">{i + 1}</p>
              <h2 className="mb-2 text-xl leading-snug font-bold">{step.title}</h2>
              <p className="text-base leading-relaxed text-ink-muted">{step.text}</p>
            </div>
          ))}
        </section>

        <section id="prezzi" className="scroll-mt-8">
          <h2 className="mb-2 text-4xl leading-tight font-bold tracking-tight">Prezzi</h2>
          <p className="mb-8 text-lg leading-relaxed text-ink-muted">
            Parti gratis. Passa a Pro quando i feedback crescono.
          </p>
          <div className="grid max-w-[760px] grid-cols-2 gap-5">
            {PLANS.map((plan) => (
              <Card key={plan.name} variant={plan.name === "Pro" ? "highlight" : "default"}>
                <CardTitle>{plan.name}</CardTitle>
                <p className="mb-6 flex items-baseline gap-2">
                  <span className="text-6xl leading-none font-bold tracking-numbers">{plan.price}</span>
                  <span className="text-md text-ink-muted group-data-[variant=highlight]/card:text-on-highlight">
                    {plan.period}
                  </span>
                </p>
                <ul className="mb-8 flex flex-col gap-2">
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <CardText className="mb-0">{feature}</CardText>
                    </li>
                  ))}
                </ul>
                <CardActions>
                  <Link
                    href="/signup"
                    className={buttonVariants({
                      variant: plan.name === "Pro" ? "default" : "secondary",
                    })}
                  >
                    {plan.cta}
                  </Link>
                </CardActions>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-[1120px] items-center gap-2 px-10 py-8 text-sm text-ink-subtle">
          <Logo className="size-5 text-xs" />
          Voce
        </div>
      </footer>
    </>
  )
}
