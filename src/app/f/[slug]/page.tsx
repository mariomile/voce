import type { Metadata } from "next"
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

// Public page: anyone with the link can write, nobody can read.
export default async function PublicFormPage({ params }: PageProps<"/f/[slug]">) {
  const { slug } = await params
  const form = await getPublicForm(slug)
  if (!form) notFound()
  if (!form.accepting) return <FormUnavailable workspaceName={form.workspaceName} />
  // Without a question of its own, the database answers with the Italian default: the respondent
  // reads it in their language. A question written by the team stays as written.
  const t = await getTranslations("form")
  const question =
    form.question === `Cosa vuoi dire al team di ${form.workspaceName}?`
      ? t("defaultQuestion", { name: form.workspaceName })
      : form.question
  return <PublicForm slug={slug} workspaceName={form.workspaceName} question={question} />
}
