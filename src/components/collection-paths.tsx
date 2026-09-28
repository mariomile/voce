import Link from "next/link"
import { useTranslations } from "next-intl"
import { CopyLinkButton } from "@/components/copy-link-button"
import { QrCode } from "@/components/qr-code"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardActions, CardBody, CardMeta, CardText, CardTitle } from "@/components/ui/card"
import type { Research } from "@/lib/types"

// A Research with no feedback yet: the three ways to collect, its public form first.
export function CollectionPaths({ research, origin }: { research: Pick<Research, "id" | "formSlug">; origin: string }) {
  const t = useTranslations("themes.page.emptyNoFeedback")
  const formPath = `/f/${research.formSlug}`
  const collect = `/research/${research.id}/collect`
  return (
    <div className="py-6">
      <h2 className="mb-4 max-w-[24ch] font-serif text-5xl leading-snug font-normal tracking-snug">{t("heading")}</h2>
      <p className="mb-10 max-w-[58ch] text-lg leading-relaxed text-ink-muted">{t("lede")}</p>
      <div className="grid grid-cols-[1.35fr_1fr_1fr] gap-5">
        <Card variant="highlight" layout="media">
          <CardBody>
            <CardTitle>{t("askTitle")}</CardTitle>
            <CardText>{t("askText")}</CardText>
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
    </div>
  )
}
