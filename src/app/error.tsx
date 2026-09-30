"use client"

import { useTranslations } from "next-intl"
import { ErrorView } from "@/components/error-view"

// A page that breaks (a server call that never answered, an unexpected error) shows this, inside the root
// layout, in the app's language, instead of Next's English page. retry fetches the page again.
export default function ErrorPage({ retry }: { error: Error & { digest?: string }; reset: () => void; retry: () => void }) {
  const t = useTranslations("common.error")
  return <ErrorView t={{ title: t("title"), text: t("text"), retry: t("retry"), back: t("back") }} onRetry={retry} />
}
