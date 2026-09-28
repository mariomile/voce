import type { Metadata } from "next"
import { getLocale, getTranslations } from "next-intl/server"
import { QrCode } from "@/components/qr-code"
import { RoomScreen } from "@/components/room-screen"
import type { Locale } from "@/i18n/locale"
import { getCurrentWorkspace, getRoomStatus, getUsage, type Usage } from "@/lib/data"
import { formatMonth } from "@/lib/format"
import { getOrigin } from "@/lib/origin"
import "../landing.css"
import { PUBLIC_FORM_LOCALE } from "@/i18n/locale"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("room")
  return { title: t("page.title") }
}

// The analysis action runs from this page and can take a few minutes.
export const maxDuration = 300

// Projected during a live session: the question, the QR code and the live count, then the themes.
// Never the text of a feedback: the screen gets counts and theme titles only.
export default async function RoomPage() {
  const workspace = await getCurrentWorkspace()
  const [status, usage, origin, locale, tCommon] = await Promise.all([
    getRoomStatus(workspace),
    getUsage(workspace.id),
    getOrigin(),
    getLocale(),
    getTranslations("common"),
  ])
  // The question the form really shows: the form is always in Italian (see pinnedLocale).
  const tForm = await getTranslations({ locale: PUBLIC_FORM_LOCALE, namespace: "form" })
  const formPath = `/f/${workspace.formSlug}`
  return (
    <RoomScreen
      workspaceName={workspace.name}
      // Same default as get_public_form in the database.
      question={workspace.formQuestion ?? tForm("defaultQuestion", { name: workspace.name })}
      shortUrl={`${new URL(origin).host}${formPath}`}
      qrCode={<QrCode url={`${origin}${formPath}`} className="room-qr rounded-lg p-[max(12px,1.6svh)]" />}
      initialStatus={status}
      limitNote={analysisLimitNote(usage, tCommon, locale)}
    />
  )
}

// undefined once analysesThisMonth < analysesLimit; otherwise the free/pro message of the month.
function analysisLimitNote(
  usage: Usage,
  tCommon: Awaited<ReturnType<typeof getTranslations<"common">>>,
  locale: Locale
) {
  if (usage.analysesThisMonth < usage.analysesLimit) return undefined
  return tCommon(usage.plan === "pro" ? "analysisLimit.pro" : "analysisLimit.free", {
    limit: usage.analysesLimit,
    month: formatMonth(new Date(), locale),
  })
}
