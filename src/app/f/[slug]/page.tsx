import type { Metadata, Viewport } from "next"
import { getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"
import { FormUnavailable, PublicForm } from "@/components/public-form"
import { getPublicForm } from "@/lib/data"

export async function generateMetadata({ params }: PageProps<"/f/[slug]">): Promise<Metadata> {
  const form = await getPublicForm((await params).slug)
  if (!form) return { title: "Voce", robots: { index: false } }
  const t = await getTranslations("form.metadata")
  return { title: t("title", { name: form.workspaceName }), robots: { index: false } }
}

// Opened on phones from a QR code. The page runs under the notch and the home indicator (the form pads itself
// with the safe areas); on Android the keyboard shrinks the page, so "Invia" stays above it; the browser bar
// takes the yellow of the header.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#ffe45c",
}

// Public page: anyone with the link can write, nobody can read.
export default async function PublicFormPage({ params }: PageProps<"/f/[slug]">) {
  const { slug } = await params
  const form = await getPublicForm(slug)
  if (!form) notFound()
  if (!form.accepting) return <FormUnavailable workspaceName={form.workspaceName} />
  return <PublicForm slug={slug} workspaceName={form.workspaceName} question={form.question} />
}
