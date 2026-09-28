import { expect, test } from "@playwright/test"
import { confirmationLink } from "./helpers"

// The main flow of a new PM: sign up, confirm the email, add feedback, run the first analysis.
// The confirmation email is read from Mailpit, the local Supabase inbox.

test("sign up, add feedback and get the first themes", async ({ page }) => {
  const email = `e2e-${crypto.randomUUID().slice(0, 8)}@test.voce`

  await page.goto("/signup")
  await page.getByLabel("Nome del prodotto").fill("Prova E2E")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password", { exact: true }).fill("password-e2e-voce")
  await page.getByRole("button", { name: "Crea il workspace" }).click()
  await expect(page.getByText("Controlla la tua email")).toBeVisible()

  await page.goto(await confirmationLink(email))
  await expect(page).toHaveURL(/\/themes$/)

  await page.goto("/collect")
  const feedback = [
    "Vorrei esportare il report mensile in PDF per il commercialista.",
    "Mi serve il PDF dei report da mandare al mio socio.",
  ]
  for (const text of feedback) {
    await page.getByLabel("Feedback", { exact: true }).fill(text)
    await page.getByLabel("Canale", { exact: true }).fill("Supporto")
    await page.getByRole("button", { name: "Aggiungi il feedback" }).click()
    await expect(page.getByText("Aggiunto. Lo trovi tra i feedback.")).toBeVisible()
  }

  await page.goto("/themes")
  await page.getByRole("button", { name: "Analizza 2 feedback" }).click()
  await expect(page.getByText("I clienti chiedono l'esportazione in PDF").first()).toBeVisible()
  await expect(page.getByText(feedback[0]).first()).toBeVisible()
})
