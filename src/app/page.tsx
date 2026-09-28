import { ArrowDown, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { Quote } from "@/components/quote"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardActions, CardTitle } from "@/components/ui/card"
import { PLAN_LIMITS } from "@/lib/plans"

// Example data, invented and labeled as such on the page. Five channels, one problem said five ways.
const VOICES = [
  {
    text: "Ogni lunedì devo ricollegare la banca, altrimenti i movimenti della settimana non arrivano.",
    highlight: "devo ricollegare la banca",
    cite: "Supporto, 18 settembre",
  },
  {
    text: "Il conto si è scollegato di nuovo, è la terza volta questo mese.",
    highlight: "si è scollegato di nuovo",
    cite: "Recensione, 16 settembre",
  },
  {
    text: "In call mi hanno chiesto perché i movimenti arrivano con giorni di ritardo.",
    highlight: "i movimenti arrivano con giorni di ritardo",
    cite: "Call di vendita, 12 settembre",
  },
  {
    text: "Voto 6: il prodotto mi piace, ma il collegamento con la banca salta dopo ogni weekend.",
    highlight: "salta dopo ogni weekend",
    cite: "Sondaggio NPS, 10 settembre",
  },
  {
    text: "Sistemate la sincronizzazione della banca, per il resto va benissimo.",
    highlight: "Sistemate la sincronizzazione della banca",
    cite: "Modulo pubblico, 9 settembre",
  },
]

const STEPS = [
  {
    verb: "Raccogli.",
    text: "Incolla un testo, importa un CSV o condividi il link al modulo pubblico, anche come QR code. Chi risponde non ha bisogno di un account.",
  },
  {
    verb: "Analizza.",
    text: "L'AI raggruppa i feedback in problemi, opportunità e apprezzamenti. Ogni tema ha un titolo, una sintesi, il numero di feedback e le citazioni dei clienti.",
  },
  {
    verb: "Decidi.",
    text: "I temi sono in ordine di feedback. Dai a ognuno una priorità e uno stato, e porta in roadmap quello che torna più spesso.",
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
      `${PLAN_LIMITS.free.questionsPerMonth} domande ai feedback al mese`,
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
      `${PLAN_LIMITS.pro.questionsPerMonth} domande ai feedback al mese`,
      "Tutto quello che c'è in Free",
    ],
    cta: "Prova Pro",
  },
]

const FREE_NOTE = `Gratis fino a ${PLAN_LIMITS.free.feedback} feedback. Non serve una carta.`

const display = "leading-display font-bold tracking-display text-balance"

export default function LandingPage() {
  return (
    <div className="landing flex flex-1 flex-col">
      <header className="mx-auto flex h-16 w-full max-w-[1200px] items-center gap-4 px-5 md:h-20 md:gap-8 md:px-10">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <Logo className="size-7" />
          Voce
        </Link>
        <nav className="ml-auto flex items-center gap-5 text-base md:gap-6">
          <a href="#prezzi" className="hidden text-ink-muted hover:text-ink sm:inline">
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

      <main>
        {/* Hero: one sentence, the highlighter on the part that matters */}
        <section className="mx-auto w-full max-w-[1200px] px-5 pt-12 pb-16 md:px-10 md:pt-14 md:pb-24 lg:pt-24">
          <h1 className={`mb-10 max-w-[15ch] text-6xl md:mb-14 md:text-8xl lg:max-w-none lg:text-9xl ${display}`}>
            Chi si lamenta più forte <br className="hidden lg:inline" />
            <mark className="mark-sweep">non decide la roadmap</mark>.
          </h1>
          <div className="grid items-end gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:gap-16">
            <p className="max-w-[40ch] text-xl leading-relaxed text-ink-muted md:text-3xl md:leading-snug">
              Voce raggruppa i feedback dei clienti in temi con l&apos;AI e li conta. Vedi quale problema torna
              più spesso, con le parole di chi l&apos;ha scritto.
            </p>
            <div className="flex flex-col items-start gap-3">
              <Link href="/signup" className={buttonVariants({ size: "lg" })}>
                Crea il tuo workspace
              </Link>
              <p className="text-md text-ink-muted">{FREE_NOTE}</p>
            </div>
          </div>
        </section>

        {/* The one idea: many voices, different words, one theme with a count */}
        <section aria-labelledby="example-heading" className="bg-veil">
          <div className="mx-auto w-full max-w-[1200px] px-5 py-16 md:px-10 md:py-24">
            <h2 id="example-heading" className={`mb-12 max-w-[16ch] text-5xl md:mb-16 md:text-7xl ${display}`}>
              Parole diverse, stesso problema.
            </h2>
            <figure className="m-0">
              <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-10">
                <ul className="flex flex-col">
                  {VOICES.map((voice) => (
                    <li key={voice.cite} className="border-t border-line-strong py-5 first:border-t-0 first:pt-0">
                      <Quote size="sm" text={voice.text} highlight={voice.highlight} cite={voice.cite} />
                    </li>
                  ))}
                </ul>

                <div aria-hidden className="justify-self-center text-ink">
                  <ArrowDown className="size-10 lg:hidden" strokeWidth={2.25} />
                  <ArrowRight className="hidden size-12 lg:block" strokeWidth={2.25} />
                </div>

                <div className="rounded-lg bg-paper p-6 md:p-10">
                  <p className="mb-6 flex items-end gap-3">
                    <span className="text-9xl leading-none font-bold tracking-numbers tabular-nums">
                      58
                    </span>
                    <span className="pb-2 text-xl text-ink-muted">feedback</span>
                  </p>
                  <Badge variant="problem" className="text-lg">
                    Problema
                  </Badge>
                  <p className="mt-2 mb-4 text-3xl leading-snug font-bold tracking-snug md:text-4xl md:leading-tight">
                    La sincronizzazione con la banca si interrompe
                  </p>
                  <p className="mb-8 text-lg leading-relaxed text-ink-muted">
                    I clienti devono ricollegare la banca ogni settimana e i movimenti arrivano in ritardo.
                  </p>
                  <p className="flex flex-wrap gap-2 text-base font-semibold">
                    <span className="rounded-full bg-veil px-4 py-2">Priorità alta</span>
                    <span className="rounded-full bg-ink px-4 py-2 text-paper">In roadmap</span>
                  </p>
                </div>
              </div>
              <figcaption className="mt-10 text-md text-ink-muted">
                Esempio con feedback inventati: un tema come lo vedi in Voce.
              </figcaption>
            </figure>
          </div>
        </section>

        {/* Three verbs, one per row */}
        <section aria-label="Come funziona" className="mx-auto w-full max-w-[1200px] px-5 py-16 md:px-10 md:py-24">
          {STEPS.map((step) => (
            <div
              key={step.verb}
              className="grid gap-4 border-t-2 border-ink py-8 last:border-b-2 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:items-end md:gap-10 md:py-12"
            >
              <h2 className={`text-6xl md:text-8xl lg:text-9xl ${display}`}>{step.verb}</h2>
              <p className="max-w-[46ch] text-lg leading-relaxed text-ink-muted md:pb-2 md:text-xl">{step.text}</p>
            </div>
          ))}
        </section>

        {/* Chiedi: the one dark band, the count in yellow */}
        <section aria-labelledby="ask-heading" className="bg-ink text-paper">
          <div className="mx-auto grid w-full max-w-[1200px] gap-12 px-5 py-16 md:px-10 md:py-24 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
            <div>
              <h2 id="ask-heading" className={`mb-8 text-6xl md:text-8xl ${display}`}>
                Chiedi ai tuoi feedback.
              </h2>
              <p className="max-w-[40ch] text-xl leading-relaxed text-line-strong md:text-2xl">
                Scrivi una domanda come la faresti a un collega. Voce risponde con quanti feedback ne parlano e fino a
                5 citazioni, copiate parola per parola dai feedback.
              </p>
            </div>

            <figure className="m-0">
              <p className="mb-8 rounded-sm border-[1.5px] border-line-strong px-5 py-4 text-2xl">
                Cosa dicono i clienti dei prezzi?
              </p>
              <p className="mb-4 flex items-end gap-3">
                <span className="text-9xl leading-none font-bold tracking-numbers text-highlight tabular-nums">12</span>
                <span className="pb-2 text-xl text-line-strong">feedback ne parlano</span>
              </p>
              <p className="mb-8 text-2xl leading-snug font-medium">
                Per i team piccoli il piano base costa troppo. Diversi chiedono un piano annuale.
              </p>
              <div className="flex flex-col gap-6 [&_cite]:text-line-strong [&_mark]:text-ink">
                <Quote
                  size="sm"
                  text="Siamo in tre: 49 euro al mese per noi sono tanti."
                  highlight="per noi sono tanti"
                  cite="Call di vendita, 22 settembre"
                />
                <Quote
                  size="sm"
                  text="Pagherei volentieri l'anno intero se ci fosse uno sconto."
                  highlight="Pagherei volentieri l'anno intero"
                  cite="Sondaggio NPS, 19 settembre"
                />
              </div>
              <figcaption className="mt-8 text-md text-line-strong">Esempio di risposta, con feedback inventati.</figcaption>
            </figure>
          </div>
        </section>

        <section id="prezzi" aria-labelledby="pricing-heading" className="mx-auto w-full max-w-[1200px] scroll-mt-8 px-5 py-16 md:px-10 md:py-24">
          <h2 id="pricing-heading" className={`mb-4 max-w-[16ch] text-6xl md:text-8xl ${display}`}>
            Gratis fino a {PLAN_LIMITS.free.feedback} feedback.
          </h2>
          <p className="mb-12 text-xl leading-relaxed text-ink-muted md:text-2xl">
            Quando ne arrivano di più, Pro costa 19 € al mese.
          </p>
          <div className="grid gap-5 md:grid-cols-2">
            {PLANS.map((plan) => (
              <Card key={plan.name} variant={plan.name === "Pro" ? "highlight" : "default"} className="p-6 md:p-10">
                <CardTitle className="text-3xl">{plan.name}</CardTitle>
                <p className="mb-8 flex items-baseline gap-3">
                  <span className="text-8xl leading-none font-bold tracking-numbers md:text-9xl">{plan.price}</span>
                  <span className="text-lg text-ink-muted group-data-[variant=highlight]/card:text-on-highlight">
                    {plan.period}
                  </span>
                </p>
                <ul className="mb-10 flex flex-col">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="border-t border-line-strong py-3 text-lg group-data-[variant=highlight]/card:border-on-highlight/30"
                    >
                      {feature}
                    </li>
                  ))}
                </ul>
                <CardActions>
                  <Link
                    href="/signup"
                    className={buttonVariants({
                      variant: plan.name === "Pro" ? "default" : "secondary",
                      size: "lg",
                    })}
                  >
                    {plan.cta}
                  </Link>
                </CardActions>
              </Card>
            ))}
          </div>
        </section>

        <section aria-labelledby="closing-heading" className="mx-auto w-full max-w-[1200px] px-5 pb-20 md:px-10 md:pb-28">
          <div className="border-t-2 border-ink pt-12 md:pt-16">
            <h2 id="closing-heading" className={`mb-10 max-w-[18ch] text-5xl md:text-8xl ${display}`}>
              Porta i temi alla prossima riunione di roadmap.
            </h2>
            <div className="flex flex-col items-start gap-3">
              <Link href="/signup" className={buttonVariants({ size: "lg" })}>
                Crea il tuo workspace
              </Link>
              <p className="text-md text-ink-muted">{FREE_NOTE}</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-auto border-t border-line">
        <div className="mx-auto flex w-full max-w-[1200px] items-center gap-2 px-5 py-8 text-sm text-ink-muted md:px-10">
          <Logo className="size-5 text-xs" />
          Voce
        </div>
      </footer>
    </div>
  )
}
