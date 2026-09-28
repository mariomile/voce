import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { CopyLinkButton } from "@/components/copy-link-button"
import { CsvImport } from "@/components/csv-import"
import { FormLinkControls } from "@/components/form-link-controls"
import { FormQuestionField } from "@/components/form-question-field"
import { LimitWarning } from "@/components/limit-warning"
import { ManualFeedbackForm } from "@/components/manual-feedback-form"
import { Page, PageHeader, PageLede, PageTitle } from "@/components/page"
import { QrCode } from "@/components/qr-code"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardActions, CardBody, CardMeta, CardText, CardTitle } from "@/components/ui/card"
import { channelCounts, getCurrentWorkspace, getUsage } from "@/lib/data"
import { isoDateOf } from "@/lib/format"
import { getOrigin } from "@/lib/origin"
import { PUBLIC_FORM_LOCALE } from "@/i18n/locale"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("collect.metadata")
  return { title: t("title") }
}

export default async function CollectPage() {
  const t = await getTranslations("collect")
  // The question the form really shows: the form is always in Italian (see pinnedLocale).
  const tForm = await getTranslations({ locale: PUBLIC_FORM_LOCALE, namespace: "form" })
  const workspace = await getCurrentWorkspace()
  const [usage, channels, origin] = await Promise.all([
    getUsage(workspace.id),
    channelCounts(workspace.id),
    getOrigin(),
  ])
  const limitReached = usage.feedbackLimit !== null && usage.feedbackCount >= usage.feedbackLimit
  const formPath = `/f/${workspace.formSlug}`
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
    <Page>
      {limitReached && <LimitWarning usage={usage} />}
      <PageHeader>
        <div>
          <PageTitle>{t("page.title")}</PageTitle>
          <PageLede>{t("page.lede")}</PageLede>
        </div>
      </PageHeader>

      <section className="mb-12">
        <Card variant={workspace.formEnabled ? "highlight" : "default"} layout="media">
          <CardBody>
            <CardTitle>{t("publicForm.title")}</CardTitle>
            <CardText>
              {!workspace.formEnabled
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
              <a href="/collect/qr" download className={buttonVariants({ variant: "secondary" })}>
                {t("publicForm.downloadQr")}
              </a>
              <Link href="/sala" className={buttonVariants({ variant: "secondary" })}>
                {t("publicForm.openRoomScreen")}
              </Link>
            </CardActions>
          </CardBody>
          <QrCode url={`${origin}${formPath}`} />
        </Card>
        <FormLinkControls enabled={workspace.formEnabled} />
        {/* Same default as get_public_form in the database. */}
        <FormQuestionField
          question={workspace.formQuestion}
          defaultQuestion={tForm("defaultQuestion", { name: workspace.name })}
        />
      </section>

      <section id="csv" className="mb-12 scroll-mt-8">
        <SectionTitle>{t("page.sections.csv")}</SectionTitle>
        <CsvImport />
      </section>

      <section id="manual" className="scroll-mt-8">
        <SectionTitle>{t("page.sections.manual")}</SectionTitle>
        <ManualFeedbackForm channels={suggestions} today={isoDateOf(new Date())} />
      </section>
    </Page>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 text-3xl leading-snug font-bold">{children}</h2>
}
