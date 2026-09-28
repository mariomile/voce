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
    <header className="flex flex-wrap items-center gap-x-8 border-b border-line px-5 pt-3 lg:h-16 lg:flex-nowrap lg:px-10 lg:pt-0">
      <div className="flex min-w-0 items-center gap-2 text-lg font-bold">
        <Logo />
        <span className="truncate">{workspace.name}</span>
      </div>
      {/* On a phone the bar takes three rows: name with language and sign out, the tabs, the quotas. */}
      <div className="ml-auto flex items-center gap-8 lg:order-last lg:ml-0">
        <LocaleSwitch className="text-md text-ink-muted" />
        <form action={signOut}>
          <Button type="submit" variant="link" className="text-md text-ink-muted">
            {t("signOut")}
          </Button>
        </form>
      </div>
      <AppTabs
        label={tTabs("label")}
        className="flex h-12 w-full gap-6 lg:h-auto lg:w-auto lg:self-stretch"
        tabs={[
          { href: "/research", label: tTabs("research") },
          { href: "/billing", label: tTabs("billing") },
        ]}
      />
      <div className="w-full py-2 text-md text-ink-muted lg:ml-auto lg:w-auto lg:py-0 [&_b]:font-semibold [&_b]:text-ink">
        <Badge className="mr-2">{usage.plan === "pro" ? "Pro" : "Free"}</Badge>
        {usage.feedbackLimit !== null &&
          t.rich("feedbackQuota", { count: usage.feedbackCount, limit: usage.feedbackLimit, b })}
        {t.rich("analysesQuota", { month, count: usage.analysesThisMonth, limit: usage.analysesLimit, b })}
      </div>
    </header>
  )
}
