"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

// exact: current only on href itself, not on the pages below it.
// also: other path prefixes where the tab is current.
export type Tab = { href: string; label: string; exact?: boolean; also?: string[] }

function isCurrent(tab: Tab, pathname: string) {
  const own = tab.exact ? pathname === tab.href : pathname === tab.href || pathname.startsWith(`${tab.href}/`)
  return own || (tab.also ?? []).some((prefix) => pathname.startsWith(prefix))
}

// Kit: .tabs, .tab with aria-current="page". The app bar and the tabs inside a Research.
export function AppTabs({ tabs, label, className }: { tabs: Tab[]; label: string; className?: string }) {
  const pathname = usePathname()
  return (
    <nav aria-label={label} className={className ?? "flex gap-6 self-stretch"}>
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={isCurrent(tab, pathname) ? "page" : undefined}
          className="flex items-center border-y-2 border-transparent text-base text-ink-muted aria-[current=page]:border-b-ink aria-[current=page]:font-semibold aria-[current=page]:text-ink"
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}
