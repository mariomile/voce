"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const TABS = [
  { href: "/themes", label: "Temi" },
  { href: "/ask", label: "Chiedi" },
  { href: "/feedback", label: "Feedback" },
  { href: "/collect", label: "Raccolta" },
  { href: "/billing", label: "Piano" },
]

// Kit: .tabs, .tab with aria-current="page"
export function AppTabs() {
  const pathname = usePathname()
  return (
    <nav className="flex gap-6 self-stretch">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={pathname.startsWith(tab.href) ? "page" : undefined}
          className="flex items-center border-y-2 border-transparent text-base text-ink-muted aria-[current=page]:border-b-ink aria-[current=page]:font-semibold aria-[current=page]:text-ink"
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}
