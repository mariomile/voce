import Link from "next/link"
import { useTranslations } from "next-intl"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardText, CardTitle } from "@/components/ui/card"
import type { Usage } from "@/lib/data"

export function LimitWarning({ usage }: { usage: Usage }) {
  const t = useTranslations("themes.limitWarning")
  return (
    <Card variant="soft" layout="row" className="mb-8">
      <div>
        <CardTitle>{t("title", { limit: usage.feedbackLimit! })}</CardTitle>
        <CardText>{t("text")}</CardText>
      </div>
      <Link href="/billing" className={buttonVariants()}>
        {t("cta")}
      </Link>
    </Card>
  )
}
