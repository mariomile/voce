"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"

const TABS = [
  { href: "/themes", key: "themes" },
  { href: "/ask", key: "ask" },
  { href: "/feedback", key: "feedback" },
  { href: "/collect", key: "collect" },
  { href: "/billing", key: "billing" },
] as const

// Kit: .tabs, .tab with aria-current="page"
export function AppTabs() {
  const pathname = usePathname()
  const t = useTranslations("app.tabs")
  return (
    <nav className="flex gap-6 self-stretch">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={pathname.startsWith(tab.href) ? "page" : undefined}
          className="flex items-center border-y-2 border-transparent text-base text-ink-muted aria-[current=page]:border-b-ink aria-[current=page]:font-semibold aria-[current=page]:text-ink"
        >
          {t(tab.key)}
        </Link>
      ))}
    </nav>
  )
}
