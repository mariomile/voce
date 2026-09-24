import { signOut } from "@/app/(auth)/actions"
import { AppTabs } from "@/components/app-tabs"
import { Logo } from "@/components/logo"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Usage } from "@/lib/data"
import { formatMonth } from "@/lib/format"
import type { Workspace } from "@/lib/types"

// Kit: .appbar with brand, tabs and plan quotas
export function AppBar({ workspace, usage }: { workspace: Workspace; usage: Usage }) {
  const month = formatMonth(new Date())
  return (
    <header className="flex h-16 items-center gap-8 border-b border-line px-10">
      <div className="flex items-center gap-2 text-lg font-bold">
        <Logo />
        {workspace.name}
      </div>
      <AppTabs />
      <div className="ml-auto text-md text-ink-muted [&_b]:font-semibold [&_b]:text-ink">
        <Badge className="mr-2">{usage.plan === "pro" ? "Pro" : "Free"}</Badge>
        {usage.feedbackLimit !== null && (
          <>
            Feedback:{" "}
            <b>
              {usage.feedbackCount} di {usage.feedbackLimit}
            </b>
            .{" "}
          </>
        )}
        Analisi di {month}:{" "}
        <b>
          {usage.analysesThisMonth} di {usage.analysesLimit}
        </b>
      </div>
      <form action={signOut}>
        <Button type="submit" variant="link" className="text-md text-ink-muted">
          Esci
        </Button>
      </form>
    </header>
  )
}
