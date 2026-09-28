import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { CopyLinkButton } from "@/components/copy-link-button"
import { CsvImport } from "@/components/csv-import"
import { DeleteResearch } from "@/components/delete-research"
import { FormLinkControls } from "@/components/form-link-controls"
import { FormQuestionField } from "@/components/form-question-field"
import { LimitWarning } from "@/components/limit-warning"
import { ManualFeedbackForm } from "@/components/manual-feedback-form"
import { QrCode } from "@/components/qr-code"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardActions, CardBody, CardMeta, CardText, CardTitle } from "@/components/ui/card"
import { channelCounts, getCurrentWorkspace, getResearch, getResearchStats, getUsage } from "@/lib/data"
import { isoDateOf } from "@/lib/format"
import { getOrigin } from "@/lib/origin"
import { PUBLIC_FORM_LOCALE } from "@/i18n/locale"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("collect.metadata")
  return { title: t("title") }
}

// The Raccolta tab of a Research: its public form and QR code, the interview notes, the CSV import, and at
// the bottom "Elimina la Research".
export default async function CollectPage({ params }: PageProps<"/research/[id]/collect">) {
  const t = await getTranslations("collect")
  const tNotes = await getTranslations("research.notes")
  // The question the form really shows: the form is always in Italian (see pinnedLocale).
  const tForm = await getTranslations({ locale: PUBLIC_FORM_LOCALE, namespace: "form" })
  // Rendered alongside the layout, which shows the not-found page: getResearch is cached for the request.
  const research = await getResearch((await params).id)
  if (!research) notFound()
  const workspace = await getCurrentWorkspace()
  const [usage, channels, origin, stats] = await Promise.all([
    getUsage(workspace.id),
    channelCounts(workspace.id),
    getOrigin(),
    getResearchStats(research),
  ])
  const limitReached = usage.feedbackLimit !== null && usage.feedbackCount >= usage.feedbackLimit
  const formPath = `/f/${research.formSlug}`
  // Suggested in the channel field before a workspace has its own channels.
  const commonChannels = [
    t("channels.support"),
    t("channels.salesCall"),
    t("channels.email"),
    t("channels.slack"),
    t("channels.npsSurvey"),
    t("channels.reviews"),
  ]
  const suggestions = [...new Set([...channels.map((c) => c.name), ...commonChannels])]

  return (
    <>
      {limitReached && <LimitWarning usage={usage} />}

      <section className="mb-12">
        <Card variant={research.formEnabled ? "highlight" : "default"} layout="media">
          <CardBody>
            <CardTitle>{t("publicForm.title")}</CardTitle>
            <CardText>
              {!research.formEnabled
                ? t("publicForm.disabled")
                : limitReached
                  ? t("publicForm.limitReached")
                  : t("publicForm.active")}
            </CardText>
            <CardMeta>
              <Link href={formPath} className="hover:underline">
                {new URL(origin).host}
                {formPath}
              </Link>
            </CardMeta>
            <CardActions className="flex flex-wrap gap-3">
              <CopyLinkButton path={formPath} />
              <a href={`/research/${research.id}/qr`} download className={buttonVariants({ variant: "secondary" })}>
                {t("publicForm.downloadQr")}
              </a>
              <Link href={`/research/${research.id}/sala`} className={buttonVariants({ variant: "secondary" })}>
                {t("publicForm.openRoomScreen")}
              </Link>
            </CardActions>
          </CardBody>
          <QrCode url={`${origin}${formPath}`} />
        </Card>
        <FormLinkControls researchId={research.id} enabled={research.formEnabled} />
        {/* Same default as get_public_form in the database. */}
        <FormQuestionField
          researchId={research.id}
          question={research.formQuestion}
          defaultQuestion={tForm("defaultQuestion", { name: workspace.name })}
        />
      </section>

      <section id="notes" className="mb-12 scroll-mt-8">
        <SectionTitle>{tNotes("title")}</SectionTitle>
        <ManualFeedbackForm researchId={research.id} channels={suggestions} today={isoDateOf(new Date())} />
      </section>

      <section id="csv" className="scroll-mt-8">
        <SectionTitle>{t("page.sections.csv")}</SectionTitle>
        <CsvImport researchId={research.id} />
      </section>

      <DeleteResearch researchId={research.id} question={research.question} feedbackCount={stats.feedbackCount} />
    </>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 text-3xl leading-snug font-bold">{children}</h2>
}
