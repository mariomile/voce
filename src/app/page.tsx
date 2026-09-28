import type { CSSProperties } from "react"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { InView } from "@/components/in-view"
import { Logo } from "@/components/logo"
import { Quote } from "@/components/quote"
import { Badge } from "@/components/ui/badge"
import { PLAN_LIMITS } from "@/lib/plans"
import "./landing.css"

// Example data, invented and labeled as such on the page. Five channels, one problem said five ways.
const VOICES = [
  {
    channel: "Supporto",
    text: "Ogni lunedì devo ricollegare la banca, altrimenti i movimenti non arrivano.",
    highlight: "devo ricollegare la banca",
  },
  {
    channel: "Recensione",
    text: "Il conto si è scollegato di nuovo, terza volta questo mese.",
    highlight: "si è scollegato di nuovo",
  },
  {
    channel: "Call di vendita",
    text: "Perché i movimenti arrivano con giorni di ritardo?",
    highlight: "i movimenti arrivano con giorni di ritardo",
  },
  {
    channel: "Sondaggio NPS",
    text: "Mi piace, ma il collegamento con la banca salta dopo ogni weekend.",
    highlight: "salta dopo ogni weekend",
  },
  {
    channel: "Modulo pubblico",
    text: "Sistemate la sincronizzazione della banca, il resto va benissimo.",
    highlight: "Sistemate la sincronizzazione della banca",
  },
]

const STEPS = [
  { verb: "Raccogli.", line: "Incolla, importa un CSV o condividi un link con QR code." },
  { verb: "Analizza.", line: "L'AI raggruppa i feedback in temi, con le citazioni dei clienti." },
  { verb: "Decidi.", line: "Temi in ordine di feedback. Tu scegli priorità e stato." },
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

// A number that ticks up to its value. Screen readers read the text, not the animation.
function Count({ value, className }: { value: number; className?: string }) {
  return (
    <span className={className}>
      <span aria-hidden className="l-count" style={{ "--l-to": value } as CSSProperties} />
      <span className="sr-only">{value}</span>
    </span>
  )
}

function Cta() {
  return (
    <Link href="/signup" className="l-cta">
      Crea il tuo workspace
      <ArrowRight aria-hidden className="size-[1.1em]" strokeWidth={2.5} />
    </Link>
  )
}

export default function LandingPage() {
  return (
    <div className="landing flex flex-1 flex-col">
      <main>
        {/* Hero: the whole first screen is the highlighter */}
        <section className="flex min-h-svh flex-col bg-highlight text-ink">
          <header className="l-wrap flex h-16 items-center gap-5 md:h-20 md:gap-8">
            <Link href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
              <Logo className="size-8 text-base" />
              Voce
            </Link>
            <nav className="ml-auto flex items-center gap-5 text-lg font-semibold md:gap-8">
              <a href="#prezzi" className="hidden underline-offset-4 hover:underline sm:inline">
                Prezzi
              </a>
              <Link href="/login" className="underline-offset-4 hover:underline">
                Accedi
              </Link>
            </nav>
          </header>

          <div className="l-wrap flex flex-1 flex-col justify-between gap-10 pt-4 pb-10 md:pt-6 md:pb-12">
            <h1 className="l-hero-title max-w-[9.5em]">
              Chi si lamenta più forte <span className="l-ink-mark">non decide la roadmap.</span>
            </h1>
            <div className="flex flex-col items-start gap-5 md:flex-row md:items-center md:gap-10">
              <p className="l-lede max-w-[26ch]">
                Voce raggruppa i feedback dei clienti in temi con l&apos;AI e li conta.
              </p>
              <div className="flex flex-col items-start gap-3">
                <Cta />
                <p className="text-md font-medium text-on-highlight">{FREE_NOTE}</p>
              </div>
            </div>
          </div>
        </section>

        {/* The product as the hero object: the count breaks out of the yellow */}
        <section aria-labelledby="example-heading" className="relative z-10">
          <figure className="m-0">
            <div className="l-wrap grid gap-x-12 gap-y-6 pt-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:pt-0">
              <div className="order-2 pb-2 lg:order-1 lg:self-start lg:pt-16">
                <p className="mb-4 text-[clamp(22px,2.2vw,36px)] font-bold">feedback, un tema solo</p>
                <Badge variant="problem" className="mb-3 text-lg">
                  Problema
                </Badge>
                <p className="mb-6 max-w-[17ch] text-[clamp(30px,3.6vw,60px)] leading-[1.02] font-extrabold tracking-[-0.03em]">
                  La sincronizzazione con la banca si interrompe
                </p>
                <p className="flex flex-wrap gap-2 text-lg font-bold">
                  <span className="rounded-full bg-veil px-5 py-2.5">Priorità alta</span>
                  <span className="rounded-full bg-ink px-5 py-2.5 text-paper">In roadmap</span>
                </p>
              </div>
              <InView className="l-billboard order-1 lg:order-2 lg:-mt-[0.46em]">
                <Count value={58} />
              </InView>
            </div>

            <div className="l-wrap pt-20 pb-16 md:pt-28 md:pb-24">
              <h2 id="example-heading" className="l-h2 mb-10 max-w-[11em] md:mb-14">
                Parole diverse, stesso problema.
              </h2>
              <InView>
                <p className="l-wall max-w-[34em]">
                  {VOICES.map((voice) => {
                    const at = voice.text.indexOf(voice.highlight)
                    return (
                      <span key={voice.channel}>
                        <span className="l-tag">{voice.channel}</span>“{voice.text.slice(0, at)}
                        <mark>{voice.highlight}</mark>
                        {voice.text.slice(at + voice.highlight.length)}”{" "}
                      </span>
                    )
                  })}
                </p>
              </InView>
              <figcaption className="mt-10 text-md text-ink-muted">
                Esempio con feedback inventati: cinque canali, un tema come lo vedi in Voce.
              </figcaption>
            </div>
          </figure>
        </section>

        {/* Three verbs, the width of the screen */}
        <section aria-label="Come funziona" className="overflow-hidden border-t-[3px] border-ink">
          {STEPS.map((step, i) => (
            <div key={step.verb} className="border-b-[3px] border-ink">
              <div
                className={`l-wrap flex flex-col gap-4 py-8 md:py-12 ${i === 1 ? "items-end text-right" : "items-start"}`}
              >
                <h2 className="l-verb">{step.verb}</h2>
                <p className="l-lede max-w-[34ch] text-ink-muted">{step.line}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Chiedi: dark, the question typed large, the count in yellow */}
        <section aria-labelledby="ask-heading" className="bg-ink text-paper">
          <div className="l-wrap py-20 md:py-32">
            <h2 id="ask-heading" className="l-h2 mb-6">
              Chiedi ai tuoi feedback.
            </h2>
            <p className="l-lede mb-14 max-w-[36ch] text-line-strong md:mb-20">
              Voce risponde con quanti ne parlano e fino a 5 citazioni, parola per parola.
            </p>

            <InView>
              <figure className="m-0">
                <p className="l-question mb-10 border-b-[3px] border-line-strong pb-5 md:mb-14">
                  <span className="l-typed">Cosa dicono i clienti dei prezzi?</span>
                  <span aria-hidden className="l-caret" />
                </p>
                <div className="l-answer grid gap-x-12 gap-y-8 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-end">
                  <p className="l-billboard text-highlight">
                    <Count value={12} />
                  </p>
                  <div className="lg:pb-[2vw]">
                    <p className="mb-4 text-[clamp(22px,2.2vw,36px)] font-bold text-highlight">feedback ne parlano</p>
                    <p className="mb-8 max-w-[28ch] text-[clamp(22px,2.2vw,34px)] leading-snug font-semibold">
                      Per i team piccoli il piano base costa troppo.
                    </p>
                    <div className="flex flex-col gap-5 [&_cite]:text-line-strong [&_mark]:text-ink">
                      <Quote
                        text="Siamo in tre: 49 euro al mese per noi sono tanti."
                        highlight="per noi sono tanti"
                        cite="Call di vendita"
                      />
                      <Quote
                        text="Pagherei l'anno intero se ci fosse uno sconto."
                        highlight="Pagherei l'anno intero"
                        cite="Sondaggio NPS"
                      />
                    </div>
                  </div>
                </div>
                <figcaption className="mt-12 text-md text-line-strong">Esempio di risposta, con feedback inventati.</figcaption>
              </figure>
            </InView>
          </div>
        </section>

        <section id="prezzi" aria-labelledby="pricing-heading" className="l-wrap scroll-mt-4 py-20 md:py-32">
          <h2 id="pricing-heading" className="l-h2 mb-6 max-w-[10em]">
            Gratis fino a {PLAN_LIMITS.free.feedback} feedback.
          </h2>
          <p className="l-lede mb-12 text-ink-muted md:mb-16">Poi Pro, a 19 € al mese.</p>
          <div className="grid gap-4 md:grid-cols-2">
            {PLANS.map((plan) => {
              const pro = plan.name === "Pro"
              return (
                <div
                  key={plan.name}
                  className={`flex flex-col rounded-[28px] p-7 md:p-12 ${pro ? "bg-highlight" : "bg-veil"}`}
                >
                  <h3 className="mb-4 text-[clamp(26px,2.4vw,40px)] leading-none font-extrabold">{plan.name}</h3>
                  <p className="mb-10 flex flex-wrap items-baseline gap-x-4 gap-y-2">
                    <span className="l-price">{plan.price}</span>
                    <span className={`text-xl font-semibold ${pro ? "text-on-highlight" : "text-ink-muted"}`}>
                      {plan.period}
                    </span>
                  </p>
                  <ul className="mb-10 flex flex-col">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className={`border-t-2 py-3 text-xl font-medium ${pro ? "border-ink" : "border-line-strong"}`}
                      >
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/signup"
                    className={`mt-auto self-start rounded-full px-7 py-4 text-lg font-bold ${
                      pro ? "bg-ink text-paper hover:bg-ink-hover" : "bg-paper text-ink hover:bg-line"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              )
            })}
          </div>
        </section>

        <section aria-labelledby="closing-heading" className="bg-highlight">
          <div className="l-wrap flex flex-col items-start gap-10 py-20 md:py-32">
            <h2 id="closing-heading" className="l-h2 max-w-[12em]">
              Porta i temi alla prossima riunione di roadmap.
            </h2>
            <div className="flex flex-col items-start gap-4">
              <Cta />
              <p className="text-md font-medium text-on-highlight">{FREE_NOTE}</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-ink text-paper">
        <div className="l-wrap flex items-center gap-3 py-8 text-base font-bold">
          <Logo className="size-7 bg-highlight text-sm text-ink" />
          Voce
        </div>
      </footer>
    </div>
  )
}
