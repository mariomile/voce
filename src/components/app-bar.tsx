import { useLocale, useTranslations } from "next-intl"
import { signOut } from "@/app/(auth)/actions"
import { AppTabs } from "@/components/app-tabs"
import { LocaleSwitch } from "@/components/locale-switch"
import { Logo } from "@/components/logo"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Usage } from "@/lib/data"
import { formatMonth } from "@/lib/format"
import type { Workspace } from "@/lib/types"

// Kit: .appbar with brand, tabs and plan quotas
export function AppBar({ workspace, usage }: { workspace: Workspace; usage: Usage }) {
  const t = useTranslations("app.bar")
  const tTabs = useTranslations("app.tabs")
  const month = formatMonth(new Date(), useLocale())
  const b = (chunks: React.ReactNode) => <b>{chunks}</b>
  return (
    <header className="flex h-16 items-center gap-8 border-b border-line px-10">
      <div className="flex items-center gap-2 text-lg font-bold">
        <Logo />
        {workspace.name}
      </div>
      <AppTabs
        label={tTabs("label")}
        tabs={[
          { href: "/research", label: tTabs("research") },
          { href: "/billing", label: tTabs("billing") },
        ]}
      />
      <div className="ml-auto text-md text-ink-muted [&_b]:font-semibold [&_b]:text-ink">
        <Badge className="mr-2">{usage.plan === "pro" ? "Pro" : "Free"}</Badge>
        {usage.feedbackLimit !== null &&
          t.rich("feedbackQuota", { count: usage.feedbackCount, limit: usage.feedbackLimit, b })}
        {t.rich("analysesQuota", { month, count: usage.analysesThisMonth, limit: usage.analysesLimit, b })}
      </div>
      <LocaleSwitch className="text-md text-ink-muted" />
      <form action={signOut}>
        <Button type="submit" variant="link" className="text-md text-ink-muted">
          {t("signOut")}
        </Button>
      </form>
    </header>
  )
}
