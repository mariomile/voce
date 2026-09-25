import Link from "next/link"
import { Page, PageHeader, PageLede, PageMore, PageTitle } from "@/components/page"
import { buttonVariants } from "@/components/ui/button"
import { ChipCount, chipVariants, FilterBar } from "@/components/ui/chip"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getCurrentWorkspace, listFeedback } from "@/lib/data"
import { formatDate } from "@/lib/format"

export default async function FeedbackPage({ searchParams }: PageProps<"/feedback">) {
  const params = await searchParams
  const channel = typeof params.channel === "string" ? params.channel : undefined
  const workspace = await getCurrentWorkspace()
  const { total, channels, feedback, page, pageCount } = await listFeedback(workspace.id, {
    channel,
    page: Number(params.page) || 1,
  })
  const pageHref = (to: number) => {
    const query = new URLSearchParams()
    if (channel) query.set("channel", channel)
    if (to > 1) query.set("page", String(to))
    return `/feedback${query.size ? `?${query}` : ""}`
  }

  return (
    <Page>
      <PageHeader>
        <div>
          <PageTitle>Feedback</PageTitle>
          <PageLede>
            {total === 0 ? (
              "Qui trovi ogni feedback raccolto, dal più recente, con il canale da cui arriva."
            ) : (
              <>
                <b>{total} feedback</b> da{" "}
                {channels.length === 1 ? "un canale" : `${channels.length} canali`}, dal più recente.
              </>
            )}
          </PageLede>
        </div>
      </PageHeader>

      {total > 0 && (
        <>
          <FilterBar className="flex-wrap border-b-0 pb-6">
            <Link href="/feedback" aria-current={!channel} className={chipVariants()}>
              Tutti<ChipCount>{total}</ChipCount>
            </Link>
            {channels.map((c) => (
              <Link
                key={c.name}
                href={`/feedback?${new URLSearchParams({ channel: c.name })}`}
                aria-current={channel === c.name}
                className={chipVariants()}
              >
                {c.name}
                <ChipCount>{c.count}</ChipCount>
              </Link>
            ))}
          </FilterBar>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feedback</TableHead>
                <TableHead>Canale</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feedback.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="max-w-[64ch]">{f.text}</TableCell>
                  <TableCell className="whitespace-nowrap text-ink-muted">{f.channel}</TableCell>
                  <TableCell className="whitespace-nowrap text-ink-muted">{f.customer}</TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">
                    {formatDate(f.receivedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {feedback.length === 0 && (
            <p className="mt-8 text-base text-ink-muted">Nessun feedback da questo canale.</p>
          )}
          {pageCount > 1 && (
            <PageMore className="flex items-center gap-6">
              {page > 1 && (
                <Link href={pageHref(page - 1)} className={buttonVariants({ variant: "link" })}>
                  Più recenti
                </Link>
              )}
              <span className="tabular-nums">
                Pagina {page} di {pageCount}
              </span>
              {page < pageCount && (
                <Link href={pageHref(page + 1)} className={buttonVariants({ variant: "link" })}>
                  Meno recenti
                </Link>
              )}
            </PageMore>
          )}
        </>
      )}
    </Page>
  )
}
