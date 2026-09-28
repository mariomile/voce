import { expect, test } from "@playwright/test"
import { insertFeedback, signedInUser } from "./helpers"

// Deleting a feedback from the keyboard: the focus never falls back to the top of the page.
// Elimina moves it to Annulla; Esc or Annulla bring it back to Elimina; after the deletion it lands on
// the Elimina of the row that took its place.
test("deleting a feedback keeps the keyboard focus in the table", async ({ page }) => {
  const user = await signedInUser(page, "feedback-delete")
  await insertFeedback(user, ["Il più recente da eliminare.", "Il secondo resta.", "Il terzo resta."])
  await page.goto(`/research/${user.researchId}/feedback`)

  const rows = page.locator("tbody tr")
  const first = rows.filter({ hasText: "Il più recente da eliminare." })
  const remove = first.getByRole("button", { name: "Elimina" })
  await remove.focus()
  await page.keyboard.press("Enter")
  await expect(first.getByRole("button", { name: "Annulla" })).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(remove).toBeFocused()

  await page.keyboard.press("Enter")
  await first.getByRole("button", { name: "Annulla" }).press("Enter")
  await expect(remove).toBeFocused()

  await page.keyboard.press("Enter")
  await page.keyboard.press("Tab")
  await expect(first.getByRole("button", { name: "Sì, elimina" })).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(rows).toHaveCount(2)
  await expect(rows.filter({ hasText: "Il secondo resta." }).getByRole("button", { name: "Elimina" })).toBeFocused()
})
