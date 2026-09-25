import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { FormUnavailable, PublicForm } from "@/components/public-form"
import { getPublicForm } from "@/lib/data"

export async function generateMetadata({ params }: PageProps<"/f/[slug]">): Promise<Metadata> {
  const form = await getPublicForm((await params).slug)
  return { title: form ? `${form.workspaceName}: il tuo feedback` : "Voce", robots: { index: false } }
}

// Public page: anyone with the link can write, nobody can read.
export default async function PublicFormPage({ params }: PageProps<"/f/[slug]">) {
  const { slug } = await params
  const form = await getPublicForm(slug)
  if (!form) notFound()
  if (!form.accepting) return <FormUnavailable workspaceName={form.workspaceName} />
  return <PublicForm slug={slug} workspaceName={form.workspaceName} question={form.question} />
}
