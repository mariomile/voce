import type { Metadata } from "next"
import { getLocale, getTranslations } from "next-intl/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { DeleteFeedbackButton } from "@/components/delete-feedback-button"
import { LimitWarning } from "@/components/limit-warning"
import { PageLede, PageMore } from "@/components/page"
import { buttonVariants } from "@/components/ui/button"
import { ChipCount, chipVariants, FilterBar } from "@/components/ui/chip"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getResearch, getUsage, listFeedback } from "@/lib/data"
import { formatDate } from "@/lib/format"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("feedback.page")
  return { title: t("title") }
}

// The Feedback tab of a Research: its feedback, newest first, filtered by channel.
export default async function FeedbackPage({ params, searchParams }: PageProps<"/research/[id]/feedback">) {
  // Rendered alongside the layout, which shows the not-found page: getResearch is cached for the request.
  const research = await getResearch((await params).id)
  if (!research) notFound()
  const t = await getTranslations("feedback")
  const locale = await getLocale()
  const query = await searchParams
  const channel = typeof query.channel === "string" ? query.channel : undefined
  const [{ total, channels, feedback, page, pageCount }, usage] = await Promise.all([
    listFeedback(research, { channel, page: Number(query.page) || 1 }),
    getUsage(research.workspaceId),
  ])
  const path = `/research/${research.id}/feedback`
  const pageHref = (to: number) => {
    const params = new URLSearchParams()
    if (channel) params.set("channel", channel)
    if (to > 1) params.set("page", String(to))
    return `${path}${params.size ? `?${params}` : ""}`
  }
  const limitReached = usage.feedbackLimit !== null && usage.feedbackCount >= usage.feedbackLimit

  return (
    <>
      {limitReached && <LimitWarning usage={usage} />}
      <PageLede className="mb-6">
        {total === 0
          ? t("page.ledeEmpty")
          : t.rich("page.ledeCount", { total, channelCount: channels.length, b: (chunks) => <b>{chunks}</b> })}
      </PageLede>

      {total === 0 && (
        <Link href={`/research/${research.id}/collect#notes`} className={buttonVariants()}>
          {t("page.addFeedback")}
        </Link>
      )}

      {total > 0 && (
        <>
          <FilterBar className="flex-wrap border-b-0 pb-6">
            <Link href={path} aria-current={!channel} className={chipVariants()}>
              {t("filters.all")}
              <ChipCount>{total}</ChipCount>
            </Link>
            {channels.map((c) => (
              <Link
                key={c.name}
                href={`${path}?${new URLSearchParams({ channel: c.name })}`}
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
                <TableHead>{t("table.feedback")}</TableHead>
                <TableHead className="hidden sm:table-cell">{t("table.channel")}</TableHead>
                <TableHead className="hidden sm:table-cell">{t("table.customer")}</TableHead>
                <TableHead className="hidden text-right sm:table-cell">{t("table.date")}</TableHead>
                <TableHead>
                  <span className="sr-only">{t("table.actions")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feedback.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="max-w-[64ch] wrap-anywhere">
                    <span className="whitespace-pre-line">{f.text}</span>
                    {/* On a phone the side columns would squeeze the text: they become one line under it. */}
                    <span className="mt-1 block text-sm text-ink-muted sm:hidden">
                      {[f.channel, f.customer, formatDate(f.receivedAt, locale)].filter(Boolean).join(" · ")}
                    </span>
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap text-ink-muted sm:table-cell">{f.channel}</TableCell>
                  <TableCell className="hidden whitespace-nowrap text-ink-muted sm:table-cell">{f.customer}</TableCell>
                  <TableCell className="hidden text-right whitespace-nowrap tabular-nums sm:table-cell">
                    {formatDate(f.receivedAt, locale)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <DeleteFeedbackButton feedbackId={f.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {feedback.length === 0 && <p className="mt-8 text-base text-ink-muted">{t("table.emptyChannel")}</p>}
          {pageCount > 1 && (
            <PageMore className="flex items-center gap-6">
              {page > 1 && (
                <Link href={pageHref(page - 1)} className={buttonVariants({ variant: "link" })}>
                  {t("pagination.newer")}
                </Link>
              )}
              <span className="tabular-nums">{t("pagination.page", { page, pageCount })}</span>
              {page < pageCount && (
                <Link href={pageHref(page + 1)} className={buttonVariants({ variant: "link" })}>
                  {t("pagination.older")}
                </Link>
              )}
            </PageMore>
          )}
        </>
      )}
    </>
  )
}
