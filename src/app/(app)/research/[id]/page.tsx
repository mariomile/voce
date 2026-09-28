import { notFound } from "next/navigation"
import { CollectionPaths } from "@/components/collection-paths"
import { getResearch, getResearchStats } from "@/lib/data"
import { getOrigin } from "@/lib/origin"

// The Sintesi tab. Without feedback: the ways to collect them.
export default async function SynthesisPage({ params }: PageProps<"/research/[id]">) {
  // Rendered alongside the layout, which shows the not-found page: getResearch is cached for the request.
  const research = await getResearch((await params).id)
  if (!research) notFound()
  const stats = await getResearchStats(research)
  if (stats.feedbackCount === 0) return <CollectionPaths research={research} origin={await getOrigin()} />
  return null
}
