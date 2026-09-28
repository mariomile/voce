import { expect, test } from "@playwright/test"
import { confirmationLink } from "./helpers"

// The main flow of a new PM: sign up, confirm the email, create the first Research, add feedback to it,
// run the first analysis. The confirmation email is read from Mailpit, the local Supabase inbox.

test("sign up, create a Research, add feedback and get the first themes", async ({ page }) => {
  const email = `e2e-${crypto.randomUUID().slice(0, 8)}@test.voce`

  await page.goto("/signup")
  await page.getByLabel("Nome del prodotto").fill("Prova E2E")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password", { exact: true }).fill("password-e2e-voce")
  await page.getByRole("button", { name: "Crea il workspace" }).click()
  await expect(page.getByText("Controlla la tua email")).toBeVisible()

  await page.goto(await confirmationLink(email))
  await expect(page).toHaveURL(/\/research$/)

  await page.getByLabel("La tua domanda").fill("Cosa chiedono del report?")
  await page.getByRole("button", { name: "Crea la Research" }).click()
  await expect(page.getByRole("heading", { level: 1, name: "Cosa chiedono del report?" })).toBeVisible()
  await page.getByRole("link", { name: "Raccolta", exact: true }).click()
  const feedback = [
    "Vorrei esportare il report mensile in PDF per il commercialista.",
    "Mi serve il PDF dei report da mandare al mio socio.",
  ]
  for (const text of feedback) {
    await page.getByLabel("Note", { exact: true }).fill(text)
    await page.getByLabel("Canale", { exact: true }).fill("Supporto")
    await page.getByRole("button", { name: "Aggiungi le note" }).click()
    await expect(page.getByText("Aggiunte a questa Research. Le trovi in Feedback.")).toBeVisible()
  }

  await page.goto("/themes")
  await page.getByRole("button", { name: "Analizza 2 feedback" }).click()
  await expect(page.getByText("I clienti chiedono l'esportazione in PDF").first()).toBeVisible()
  await expect(page.getByText(feedback[0]).first()).toBeVisible()
})
