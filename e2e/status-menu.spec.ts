import { expect, test } from "@playwright/test"
import { insertFeedback, signedInUser } from "./helpers"

// The "Stato" filter of the Sintesi: choosing a status filters the themes and closes the menu.
test("the status menu closes after choosing a status, and opens again", async ({ page }) => {
  const user = await signedInUser(page, "status-menu")
  await insertFeedback(user, [
    "Vorrei il report in PDF da mandare al commercialista.",
    "Serve un'esportazione in PDF delle fatture.",
    "Il PDF del mese mi farebbe risparmiare tempo.",
    "Mi manca un PDF riassuntivo.",
    "Esportare in PDF sarebbe comodo.",
  ])
  await page.goto(`/research/${user.researchId}`)
  await page.getByRole("button", { name: "Analizza 5 feedback" }).click()
  await expect(page.getByRole("status").filter({ hasText: "Analisi finita" })).toBeVisible()

  const trigger = page.getByRole("button", { name: /^Stato:/ })
  await trigger.click()
  await page.getByRole("menuitemradio", { name: "Tutti" }).click()
  await expect(page).toHaveURL(/status=all/)
  await expect(page.getByRole("menu")).toBeHidden()
  await expect(trigger).toHaveText(/tutti/)

  await trigger.click()
  await expect(page.getByRole("menuitemradio", { name: "Aperti" })).toBeVisible()
})
