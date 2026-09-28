import { expect, test } from "@playwright/test"
import { createResearch, insertFeedback, signedInUser } from "./helpers"

// A Free workspace at 100 feedback: a new, empty Research says so on its Sintesi before offering the
// ways to collect, since none of them can add a feedback now.
test("a new Research of a full Free workspace shows the limit on its Sintesi", async ({ page }) => {
  const user = await signedInUser(page, "full")
  await insertFeedback(user, Array.from({ length: 100 }, (_, i) => `Feedback numero ${i + 1}`))
  const second = await createResearch(user.workspaceId, "full-second")

  await page.goto(`/research/${second.researchId}`)
  await expect(page.getByText("Hai raggiunto 100 feedback, il limite del piano Free")).toBeVisible()
  await expect(page.getByRole("link", { name: "Passa a Pro" })).toHaveAttribute("href", "/billing")
})
