import { AppBar } from "@/components/app-bar"
import { getCurrentWorkspace, getUsage } from "@/lib/data"

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const workspace = await getCurrentWorkspace()
  const usage = await getUsage(workspace.id)
  return (
    <>
      <AppBar workspace={workspace} usage={usage} />
      {children}
    </>
  )
}
