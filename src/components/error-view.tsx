import Link from "next/link"
import { Logo } from "@/components/logo"
import { Button, buttonVariants } from "@/components/ui/button"
import type { Messages } from "@/i18n/messages"

// Kit: the 404 page's layout (src/app/not-found.tsx). Shown when a page breaks, so it takes its words
// as props and reads nothing: no request, no session, no provider.
export function ErrorView({ t, onRetry }: { t: Messages["common"]["error"]; onRetry: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col justify-center px-6 py-16">
      <Link href="/" className="mb-10 flex items-center gap-2 text-lg font-bold">
        <Logo />
        Voce
      </Link>
      <h1 className="mb-4 text-4xl leading-tight font-bold tracking-tight">{t.title}</h1>
      <p className="mb-10 max-w-[48ch] text-lg leading-relaxed text-ink-muted">{t.text}</p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={onRetry}>{t.retry}</Button>
        <Link href="/research" className={buttonVariants({ variant: "secondary" })}>
          {t.back}
        </Link>
      </div>
    </main>
  )
}
