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

export const metadata = { title: "Raccolta" }

// Suggested in the channel field before a workspace has its own channels.
const COMMON_CHANNELS = ["Supporto", "Call vendita", "Email", "Slack", "Sondaggio NPS", "Recensioni"]

export default async function CollectPage() {
  const workspace = await getCurrentWorkspace()
  const [usage, channels, origin] = await Promise.all([
    getUsage(workspace.id),
    channelCounts(workspace.id),
    getOrigin(),
  ])
  const limitReached = usage.feedbackLimit !== null && usage.feedbackCount >= usage.feedbackLimit
  const formPath = `/f/${workspace.formSlug}`
  const suggestions = [...new Set([...channels.map((c) => c.name), ...COMMON_CHANNELS])]

  return (
    <Page>
      {limitReached && <LimitWarning usage={usage} />}
      <PageHeader>
        <div>
          <PageTitle>Raccolta</PageTitle>
          <PageLede>
            Porta qui i feedback che hai già e chiedine di nuovi. Ognuno tiene il canale da cui arriva,
            così poi puoi filtrarli.
          </PageLede>
        </div>
      </PageHeader>

      <section className="mb-12">
        <Card variant={workspace.formEnabled ? "highlight" : "default"} layout="media">
          <CardBody>
            <CardTitle>Modulo pubblico</CardTitle>
            <CardText>
              {!workspace.formEnabled
                ? "Il link è spento: chi lo apre non trova il modulo. Riaccendilo quando vuoi, oppure generane uno nuovo."
                : limitReached
                  ? "Il link è attivo, ma con il piano Free pieno chi lo apre trova un messaggio gentile e il feedback non entra."
                  : "Una sola domanda, si risponde dal telefono senza account. Condividi il link o stampa il QR code."}
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
                Scarica il QR code
              </a>
            </CardActions>
          </CardBody>
          <QrCode url={`${origin}${formPath}`} />
        </Card>
        <FormLinkControls enabled={workspace.formEnabled} />
        {/* Same default as get_public_form in the database. */}
        <FormQuestionField
          question={workspace.formQuestion}
          defaultQuestion={`Cosa vuoi dire al team di ${workspace.name}?`}
        />
      </section>

      <section id="csv" className="mb-12 scroll-mt-8">
        <SectionTitle>Importa un CSV</SectionTitle>
        <CsvImport />
      </section>

      <section id="manual" className="scroll-mt-8">
        <SectionTitle>Incolla un feedback</SectionTitle>
        <ManualFeedbackForm channels={suggestions} today={isoDateOf(new Date())} />
      </section>
    </Page>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 text-3xl leading-snug font-bold">{children}</h2>
}
