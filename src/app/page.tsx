import type { CSSProperties } from "react"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { InView } from "@/components/in-view"
import { Logo } from "@/components/logo"
import { Quote } from "@/components/quote"
import { Badge } from "@/components/ui/badge"
import { LocaleSwitch } from "@/components/locale-switch"
import { PLAN_LIMITS } from "@/lib/plans"
import "./landing.css"

// Example data, invented and labeled as such on the page. Five channels, one problem said five ways.
const VOICES = ["support", "review", "salesCall", "nps", "form"] as const

const STEPS = ["collect", "analyze", "decide"] as const

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
  const t = useTranslations("landing.hero")
  return (
    <Link href="/signup" className="l-cta">
      {t("cta")}
      <ArrowRight aria-hidden className="size-[1.1em]" strokeWidth={2.5} />
    </Link>
  )
}

export default function LandingPage() {
  const t = useTranslations("landing")
  const common = useTranslations("common")
  const freeNote = t("hero.freeNote", { feedback: PLAN_LIMITS.free.feedback! })
  const plans = [
    {
      name: "Free",
      price: t("pricing.free.price"),
      period: t("pricing.free.period"),
      features: [
        t("pricing.free.feedback", { count: PLAN_LIMITS.free.feedback! }),
        t("pricing.free.analyses", { count: PLAN_LIMITS.free.analysesPerMonth }),
        t("pricing.free.questions", { count: PLAN_LIMITS.free.questionsPerMonth }),
        t("pricing.free.sources"),
      ],
      cta: t("pricing.free.cta"),
    },
    {
      name: "Pro",
      price: t("pricing.pro.price"),
      period: t("pricing.pro.period"),
      features: [
        t("pricing.pro.feedback"),
        t("pricing.pro.analyses", { count: PLAN_LIMITS.pro.analysesPerMonth }),
        t("pricing.pro.questions", { count: PLAN_LIMITS.pro.questionsPerMonth }),
        t("pricing.pro.everything"),
      ],
      cta: t("pricing.pro.cta"),
    },
  ]
  return (
    <div className="landing flex flex-1 flex-col">
      <main>
        {/* Hero: the whole first screen is the highlighter */}
        <section className="flex flex-col bg-highlight text-ink md:min-h-svh">
          <header className="l-wrap flex h-16 items-center gap-5 md:h-20 md:gap-8">
            <Link href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
              <Logo className="size-8 text-base" />
              Voce
            </Link>
            <nav className="ml-auto flex items-center gap-5 text-lg font-semibold md:gap-8">
              <a href="#prezzi" className="hidden underline-offset-4 hover:underline sm:inline">
                {t("nav.pricing")}
              </a>
              <Link href="/login" className="underline-offset-4 hover:underline">
                {t("nav.login")}
              </Link>
            </nav>
          </header>

          <div className="l-wrap flex flex-1 flex-col gap-10 pt-4 pb-10 md:justify-between md:pt-6 md:pb-12">
            <h1 className="l-hero-title max-w-[9.5em]">
              {t.rich("hero.title", { mark: (chunks) => <span className="l-ink-mark">{chunks}</span> })}
            </h1>
            <div className="flex flex-col items-start gap-5 md:flex-row md:items-center md:gap-10">
              <p className="l-lede max-w-[26ch]">
                {t("hero.lede")}
              </p>
              <div className="flex flex-col items-start gap-3">
                <Cta />
                <p className="text-md font-medium text-on-highlight">{freeNote}</p>
              </div>
            </div>
          </div>
        </section>

        {/* The product as the hero object: the count breaks out of the yellow */}
        <section aria-labelledby="example-heading" className="relative z-10">
          <figure className="m-0">
            <div className="l-wrap grid gap-x-12 gap-y-6 pt-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:pt-0">
              <div className="order-2 pb-2 lg:order-1 lg:self-start lg:pt-16">
                <p className="mb-4 text-[clamp(22px,2.2vw,36px)] font-bold">{t("example.countLabel")}</p>
                <Badge variant="problem" className="mb-3 text-lg">
                  {common("kind.problem")}
                </Badge>
                <p className="mb-6 max-w-[17ch] text-[clamp(30px,3.6vw,60px)] leading-[1.02] font-extrabold tracking-[-0.03em]">
                  {t("example.title")}
                </p>
                <p className="flex flex-wrap gap-2 text-lg font-bold">
                  <span className="rounded-full bg-veil px-5 py-2.5">{t("example.priority")}</span>
                  <span className="rounded-full bg-ink px-5 py-2.5 text-paper">{common("status.roadmap")}</span>
                </p>
              </div>
              <InView className="l-billboard order-1 lg:order-2 lg:-mt-[0.46em]">
                <Count value={58} />
              </InView>
            </div>

            <div className="l-wrap pt-20 pb-16 md:pt-28 md:pb-24">
              <h2 id="example-heading" className="l-h2 mb-10 max-w-[11em] md:mb-14">
                {t("example.heading")}
              </h2>
              <InView>
                <p className="l-wall max-w-[34em]">
                  {VOICES.map((key) => {
                    const voice = {
                      channel: t(`example.voices.${key}.channel`),
                      text: t(`example.voices.${key}.text`),
                      highlight: t(`example.voices.${key}.highlight`),
                    }
                    const at = voice.text.indexOf(voice.highlight)
                    return (
                      <span key={key}>
                        <span className="l-tag">{voice.channel}</span>“{voice.text.slice(0, at)}
                        <mark>{voice.highlight}</mark>
                        {voice.text.slice(at + voice.highlight.length)}”{" "}
                      </span>
                    )
                  })}
                </p>
              </InView>
              <figcaption className="mt-10 text-md text-ink-muted">
                {t("example.caption")}
              </figcaption>
            </div>
          </figure>
        </section>

        {/* Three verbs, the width of the screen */}
        <section aria-label={t("steps.label")} className="overflow-hidden border-t-[3px] border-ink">
          {STEPS.map((step, i) => (
            <div key={step} className="border-b-[3px] border-ink">
              <div
                className={`l-wrap flex flex-col gap-4 py-8 md:py-12 ${i === 1 ? "items-end text-right" : "items-start"}`}
              >
                <h2 className="l-verb">{t(`steps.${step}.verb`)}</h2>
                <p className="l-lede max-w-[34ch] text-ink-muted">{t(`steps.${step}.line`)}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Chiedi: dark, the question typed large, the count in yellow */}
        <section aria-labelledby="ask-heading" className="bg-ink text-paper">
          <div className="l-wrap py-20 md:py-32">
            <h2 id="ask-heading" className="l-h2 mb-6">
              {t("ask.heading")}
            </h2>
            <p className="l-lede mb-14 max-w-[36ch] text-line-strong md:mb-20">
              {t("ask.lede")}
            </p>

            <InView>
              <figure className="m-0">
                <p className="l-question mb-10 border-b-[3px] border-line-strong pb-5 md:mb-14">
                  <span className="l-typed">{t("ask.question")}</span>
                  <span aria-hidden className="l-caret" />
                </p>
                <div className="l-answer grid gap-x-12 gap-y-8 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-end">
                  <p className="l-billboard text-highlight">
                    <Count value={12} />
                  </p>
                  <div className="lg:pb-[2vw]">
                    <p className="mb-4 text-[clamp(22px,2.2vw,36px)] font-bold text-highlight">{t("ask.countLabel")}</p>
                    <p className="mb-8 max-w-[28ch] text-[clamp(22px,2.2vw,34px)] leading-snug font-semibold">
                      {t("ask.answer")}
                    </p>
                    <div className="flex flex-col gap-5 [&_cite]:text-line-strong [&_mark]:text-ink">
                      <Quote
                        text={t("ask.quote1.text")}
                        highlight={t("ask.quote1.highlight")}
                        cite={t("ask.quote1.cite")}
                      />
                      <Quote
                        text={t("ask.quote2.text")}
                        highlight={t("ask.quote2.highlight")}
                        cite={t("ask.quote2.cite")}
                      />
                    </div>
                  </div>
                </div>
                <figcaption className="mt-12 text-md text-line-strong">{t("ask.caption")}</figcaption>
              </figure>
            </InView>
          </div>
        </section>

        <section id="prezzi" aria-labelledby="pricing-heading" className="l-wrap scroll-mt-4 py-20 md:py-32">
          <h2 id="pricing-heading" className="l-h2 mb-6 max-w-[10em]">
            {t("pricing.heading", { feedback: PLAN_LIMITS.free.feedback! })}
          </h2>
          <p className="l-lede mb-12 text-ink-muted md:mb-16">{t("pricing.lede")}</p>
          <div className="grid gap-4 md:grid-cols-2">
            {plans.map((plan) => {
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
              {t("closing.heading")}
            </h2>
            <div className="flex flex-col items-start gap-4">
              <Cta />
              <p className="text-md font-medium text-on-highlight">{freeNote}</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-ink text-paper">
        <div className="l-wrap flex items-center gap-3 py-8 text-base font-bold">
          <Logo className="size-7 bg-highlight text-sm text-ink" />
          Voce
          <LocaleSwitch className="ml-auto" />
        </div>
      </footer>
    </div>
  )
}
