import { expect, test } from "@playwright/test"
import { admin, insertFeedback, signedInUser } from "./helpers"

// The room screen: projected during a live session, the audience answers the public form from
// their phones. It shows counts and theme titles, never the text of a feedback. The analysis goes
// to the fake Anthropic API (e2e/fake-anthropic.mts), which groups every feedback into one theme.

async function formSlug(workspaceId: string) {
  const { data, error } = await admin.from("workspaces").select("form_slug").eq("id", workspaceId).single()
  if (error) throw error
  return data.form_slug as string
}

test("the counter goes up with a public form response, then the analysis shows the themes", async ({ page, browser }) => {
  const { workspaceId } = await signedInUser(page, "sala")
  // Not from the public form: the analysis reads it, the counter does not count it.
  const support = "Vorrei esportare il report mensile in PDF per il commercialista."
  await insertFeedback(workspaceId, [support])

  await page.goto("/collect")
  await page.getByRole("link", { name: "Apri lo schermo della sala" }).click()
  await expect(page).toHaveURL(/\/sala$/)
  await expect(page.getByText("0 risposte", { exact: true })).toBeVisible()
  await expect(page.getByRole("img", { name: "QR code del modulo pubblico" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Cosa vuoi dire al team di Prova sala?" })).toBeVisible()

  // Someone in the room answers from their phone.
  const phone = await (await browser.newContext()).newPage()
  await phone.goto(`/f/${await formSlug(workspaceId)}`)
  const response = "Mi serve il PDF dei report da mandare al mio socio."
  await phone.getByLabel("Il tuo feedback").fill(response)
  await phone.getByRole("button", { name: "Invia" }).click()
  await expect(phone.getByText("Ricevuto. Grazie.")).toBeVisible()

  await expect(page.getByText("1 risposta", { exact: true })).toBeVisible({ timeout: 10_000 })

  await page.getByRole("button", { name: "Analizza le risposte" }).click()
  await expect(page.getByText("I clienti chiedono l'esportazione in PDF")).toBeVisible()
  await expect(page.getByText("Opportunità", { exact: true })).toBeVisible()
  // Never the words of a feedback on the projector.
  await expect(page.getByText(response)).toHaveCount(0)
  await expect(page.getByText(support)).toHaveCount(0)
})

test("the room screen says when the public form link is off, and how to turn it on", async ({ page }) => {
  const { workspaceId } = await signedInUser(page, "sala-spento")
  await admin.from("workspaces").update({ form_enabled: false }).eq("id", workspaceId)
  await page.goto("/sala")
  await expect(page.getByText("Il modulo è spento.")).toBeVisible()
  await expect(page.getByRole("link", { name: "Riaccendi il link in Raccolta" })).toHaveAttribute("href", "/collect")
  await expect(page.getByRole("img", { name: "QR code del modulo pubblico" })).toHaveCount(0)
})

test("/sala without a session goes to /login", async ({ page }) => {
  await page.goto("/sala")
  await expect(page).toHaveURL(/\/login$/)
})
