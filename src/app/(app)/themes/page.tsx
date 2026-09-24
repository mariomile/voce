import Link from "next/link"
import { CopyLinkButton } from "@/components/copy-link-button"
import { LimitWarning } from "@/components/limit-warning"
import { Page, PageHeader, PageLede, PageMore, PageTitle } from "@/components/page"
import { Quote } from "@/components/quote"
import { QrCode } from "@/components/qr-code"
import { StatusMenu } from "@/components/status-menu"
import { ThemeRow } from "@/components/theme-row"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardActions, CardBody, CardMeta, CardText, CardTitle } from "@/components/ui/card"
import { ChipCount, chipVariants, FilterBar, FilterBarSep } from "@/components/ui/chip"
import { getCurrentWorkspace, getDashboard, getUsage, type StatusFilter, type Usage } from "@/lib/data"
import { getOrigin } from "@/lib/origin"
import { formatDate, formatMonth, KIND_PLURALS } from "@/lib/format"
import type { ThemeKind, Workspace } from "@/lib/types"

const KINDS: ThemeKind[] = ["problem", "opportunity", "praise"]
const STATUSES: StatusFilter[] = ["open", "all", "to_review", "roadmap", "done", "discarded"]
const VISIBLE_THEMES = 5
const FULL_THEMES = 3

export default async function ThemesPage({ searchParams }: PageProps<"/themes">) {
  const params = await searchParams
  const kind = KINDS.find((k) => k === params.type)
  const status = STATUSES.find((s) => s === params.status) ?? "open"
  const showAll = params.all === "1"

  const workspace = await getCurrentWorkspace()
  const [dashboard, usage] = await Promise.all([
    getDashboard(workspace.id, { kind, status }),
    getUsage(workspace.id),
  ])

  if (dashboard.feedbackCount === 0)
    return <EmptyNoFeedback workspace={workspace} origin={await getOrigin()} />

  const limitReached = usage.feedbackLimit !== null && usage.feedbackCount >= usage.feedbackLimit
  const { analysis } = dashboard

  if (!analysis)
    return (
      <Page>
        {limitReached && <LimitWarning usage={usage} />}
        <EmptyNoAnalysis dashboard={dashboard} usage={usage} />
      </Page>
    )

  const visible = showAll ? dashboard.themes : dashboard.themes.slice(0, VISIBLE_THEMES)
  const hidden = dashboard.themes.slice(visible.length)
  const href = (next: Record<string, string | undefined>) => {
    const query = new URLSearchParams()
    const merged = {
      type: kind,
      status: status === "open" ? undefined : status,
      all: showAll ? "1" : undefined,
      ...next,
    }
    for (const [k, v] of Object.entries(merged)) if (v) query.set(k, v)
    return `/themes${query.size ? `?${query}` : ""}`
  }

  return (
    <Page>
      {limitReached && <LimitWarning usage={usage} />}
      <PageHeader>
        <div>
          <PageTitle>Cosa dicono i clienti di {workspace.name}</PageTitle>
          <PageLede>
            <b>{analysis.feedbackCount} feedback</b> dal {formatDate(analysis.periodStart)} al{" "}
            {formatDate(analysis.createdAt)}, raggruppati in{" "}
            <b>{dashboard.analysisThemeCount} temi</b>.
          </PageLede>
        </div>
        <Button>Nuova analisi</Button>
      </PageHeader>

      <FilterBar>
        <Link href={href({ type: undefined })} aria-current={!kind} className={chipVariants()}>
          Tutti<ChipCount>{dashboard.themeTotal}</ChipCount>
        </Link>
        {KINDS.map((k) => (
          <Link key={k} href={href({ type: k })} aria-current={kind === k} className={chipVariants()}>
            {KIND_PLURALS[k]}
            <ChipCount>{dashboard.kindCounts[k] ?? 0}</ChipCount>
          </Link>
        ))}
        <FilterBarSep />
        <StatusMenu value={status} />
      </FilterBar>

      {visible.map((theme, i) => (
        <ThemeRow key={theme.id} theme={theme} compact={i >= FULL_THEMES} />
      ))}

      {dashboard.themes.length === 0 && (
        <PageMore>
          Nessun tema con questi filtri.{" "}
          <Link href="/themes" className={buttonVariants({ variant: "link" })}>
            Mostra i temi aperti
          </Link>
        </PageMore>
      )}

      {hidden.length > 0 && (
        <PageMore>
          <Link href={href({ all: "1" })} className={buttonVariants({ variant: "link", className: "mr-2" })}>
            Mostra {hidden.length === 1 ? "un altro tema" : `altri ${hidden.length} temi`}
          </Link>
          con {listItalian(hidden.map((t) => String(t.feedbackCount)))} feedback
        </PageMore>
      )}
    </Page>
  )
}

function EmptyNoFeedback({ workspace, origin }: { workspace: Workspace; origin: string }) {
  const formPath = `/f/${workspace.formSlug}`
  return (
    <Page>
      <div className="py-6">
        <h1 className="mb-4 max-w-[24ch] font-serif text-5xl leading-snug font-normal tracking-snug">
          Qui leggerai cosa dicono i tuoi clienti, raggruppato per tema.
        </h1>
        <p className="mb-10 max-w-[58ch] text-lg leading-relaxed text-ink-muted">
          Per cominciare servono i feedback. Parti da quelli che hai già in giro: ticket, note delle
          call, risposte ai sondaggi. Più canali metti insieme, più i temi sono completi.
        </p>
        <div className="grid grid-cols-[1.35fr_1fr_1fr] gap-5">
          <Card variant="highlight" layout="media">
            <CardBody>
              <CardTitle>Chiedi ai clienti</CardTitle>
              <CardText>
                Un modulo pubblico con una sola domanda, che scegli tu. Si risponde dal telefono,
                senza account.
              </CardText>
              <CardMeta>
                <Link href={formPath} className="hover:underline">
                  {new URL(origin).host}
                  {formPath}
                </Link>
              </CardMeta>
              <CardActions>
                <CopyLinkButton path={formPath} />
              </CardActions>
            </CardBody>
            <QrCode url={`${origin}${formPath}`} />
          </Card>
          <Card>
            <CardTitle>Importa un CSV</CardTitle>
            <CardText>
              Serve una colonna <b>testo</b>. Canale, cliente e data sono facoltativi. Fino a 2.000
              righe.
            </CardText>
            <CardActions>
              <Link href="/collect#csv" className={buttonVariants({ variant: "secondary" })}>
                Scegli il file
              </Link>
            </CardActions>
          </Card>
          <Card>
            <CardTitle>Incolla un feedback</CardTitle>
            <CardText>Copiato da un&apos;email, da Slack o dalle tue note, uno alla volta.</CardText>
            <CardActions>
              <Link href="/collect#manual" className={buttonVariants({ variant: "secondary" })}>
                Incolla un testo
              </Link>
            </CardActions>
          </Card>
        </div>
      </div>
    </Page>
  )
}

function EmptyNoAnalysis({
  dashboard,
  usage,
}: {
  dashboard: Awaited<ReturnType<typeof getDashboard>>
  usage: Usage
}) {
  const month = formatMonth(new Date())
  const remaining = usage.analysesLimit - usage.analysesThisMonth
  return (
    <>
      <PageHeader>
        <div>
          <PageTitle>{dashboard.feedbackCount} feedback, ancora nessun tema</PageTitle>
          <PageLede>
            Letti uno per uno dicono poco. L&apos;analisi li raggruppa in problemi, opportunità e
            apprezzamenti, con le citazioni che li rappresentano meglio.
          </PageLede>
        </div>
      </PageHeader>
      <Card variant="soft" layout="row" className="mb-8">
        <div>
          <CardTitle>Pronti per la prima analisi</CardTitle>
          <CardText>
            {listItalian(dashboard.channels.map((c) => `${c.count} da ${c.name}`))}.{" "}
            {remaining === usage.analysesLimit
              ? `Userai 1 delle ${usage.analysesLimit} analisi di ${month}.`
              : `Ti restano ${remaining} analisi di ${month}.`}
          </CardText>
        </div>
        <Button>Analizza {dashboard.feedbackCount} feedback</Button>
      </Card>
      <div className="grid grid-cols-2 gap-x-12">
        {dashboard.recentFeedback.map((f) => (
          <Quote
            key={f.id}
            text={f.text}
            size="sm"
            maxLength={280}
            cite={`${f.channel}, ${formatDate(f.receivedAt)}`}
            className="border-t border-line py-4"
          />
        ))}
      </div>
    </>
  )
}

// ["26", "19", "14"] → "26, 19 e 14"
function listItalian(items: string[]) {
  return items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} e ${items.at(-1)}`
}
