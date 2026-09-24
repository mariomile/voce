import Link from "next/link"
import { Logo } from "@/components/logo"

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col px-6 pt-16 pb-16">
      <Link href="/" className="mb-12 flex items-center gap-2 text-lg font-bold">
        <Logo />
        Voce
      </Link>
      {children}
    </main>
  )
}
