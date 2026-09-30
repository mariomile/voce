import Link from "next/link"
import { useTranslations } from "next-intl"
import { CopyLinkButton } from "@/components/copy-link-button"
import { SectionHeading, StepNumber } from "@/components/page"
import { QrCode } from "@/components/qr-code"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardActions, CardBody, CardMeta, CardText, CardTitle } from "@/components/ui/card"
import type { Research } from "@/lib/types"

// A Research with no feedback yet, step 2 of its loop: the three ways to collect, its public form first.
export function CollectionPaths({ research, origin }: { research: Pick<Research, "id" | "formSlug">; origin: string }) {
  const t = useTranslations("themes.page.emptyNoFeedback")
  const formPath = `/f/${research.formSlug}`
  const collect = `/research/${research.id}/collect`
  return (
    <section aria-labelledby="collect-title" className="mb-14">
      <div className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b-2 border-ink pb-4">
        <SectionHeading id="collect-title">
          <StepNumber step={2} />
          {t("collectTitle")}
        </SectionHeading>
        <p className="text-lg text-ink-muted">{t("collectLede")}</p>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[1.35fr_1fr_1fr]">
        <Card variant="highlight" layout="media">
          <CardBody>
            <CardTitle>{t("askTitle")}</CardTitle>
            <CardText>{t("askText")}</CardText>
            <CardMeta>
              <Link href={formPath} className="hover:underline">
                {new URL(origin).host}
                <wbr />
                {formPath}
              </Link>
            </CardMeta>
            <CardActions>
              <CopyLinkButton path={formPath} />
            </CardActions>
          </CardBody>
          <QrCode url={`${origin}${formPath}`} className="justify-self-start" />
        </Card>
        <Card>
          <CardTitle>{t("csvTitle")}</CardTitle>
          <CardText>{t.rich("csvText", { b: (chunks) => <b>{chunks}</b> })}</CardText>
          <CardActions>
            <Link href={`${collect}#csv`} className={buttonVariants({ variant: "secondary" })}>
              {t("chooseFile")}
            </Link>
          </CardActions>
        </Card>
        <Card>
          <CardTitle>{t("pasteTitle")}</CardTitle>
          <CardText>{t("pasteText")}</CardText>
          <CardActions>
            <Link href={`${collect}#notes`} className={buttonVariants({ variant: "secondary" })}>
              {t("pasteAction")}
            </Link>
          </CardActions>
        </Card>
      </div>
    </section>
  )
}
