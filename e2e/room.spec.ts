import { expect, test } from "@playwright/test"
import { admin, insertFeedback, signedInUser } from "./helpers"

// The room screen of a Research: projected during a live session, the audience answers its public
// form from their phones. It shows counts and theme titles, never the text of a feedback: each response is a
// dot on a canvas, and the analysis sorts the dots into one bubble per theme. The analysis goes to
// the fake Anthropic API (e2e/fake-anthropic.mts), which groups every feedback into one theme.

test("the counter goes up with a public form response, then the analysis shows the themes", async ({ page, browser }) => {
  const user = await signedInUser(page, "sala")
  // Not from the public form: the analysis reads it, the counter does not count it.
  const support = "Vorrei esportare il report mensile in PDF per il commercialista."
  await insertFeedback(user, [support])

  await page.goto(`/research/${user.researchId}/collect`)
  await page.getByRole("link", { name: "Apri lo schermo della sala" }).click()
  await expect(page).toHaveURL(`/research/${user.researchId}/sala`)
  await expect(page.getByText("0 risposte", { exact: true })).toBeVisible()
  await expect(page.getByRole("img", { name: "QR code del modulo pubblico" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Cosa vuoi dire al team di Prova sala?" })).toBeVisible()

  // Someone in the room answers from their phone.
  const phone = await (await browser.newContext()).newPage()
  await phone.goto(`/f/${user.formSlug}`)
  const response = "Mi serve il PDF dei report da mandare al mio socio."
  await phone.getByLabel("Il tuo feedback").fill(response)
  await phone.getByRole("button", { name: "Invia" }).click()
  await expect(phone.getByText("Ricevuto. Grazie.")).toBeVisible()

  await expect(page.getByText("1 risposta", { exact: true })).toBeVisible({ timeout: 10_000 })
  // One dot per public form response.
  const dots = page.getByTestId("room-dots")
  await expect(dots).toHaveAttribute("data-dots", "1")

  await page.getByRole("button", { name: "Analizza le risposte" }).click()
  const title = "I clienti chiedono l'esportazione in PDF"
  await expect(page.getByText(title)).toBeVisible()
  await expect(page.getByText("Opportunità", { exact: true })).toBeVisible()
  // The theme groups both feedback, the manual one too: its bubble has 2 dots, one more than the pile.
  await expect(page.getByText("1 risposta, 1 tema: 1 opportunità.")).toBeVisible()
  await expect(page.getByRole("listitem").filter({ hasText: title })).toContainText("2")
  await expect(dots).toHaveAttribute("data-dots", "2")
  // Never the words of a feedback on the projector.
  await expect(page.getByText(response)).toHaveCount(0)
  await expect(page.getByText(support)).toHaveCount(0)

  // The same themes as a list, then back to the count.
  await page.getByRole("button", { name: "Elenco" }).click()
  await expect(page.getByRole("button", { name: "Elenco" })).toHaveAttribute("aria-pressed", "true")
  await expect(page.getByText(title)).toBeVisible()
  await page.getByRole("button", { name: "Torna al QR code" }).click()
  await expect(page.getByText("1 risposta", { exact: true })).toBeVisible()
  await expect(dots).toHaveAttribute("data-dots", "1")
})

test("the room screen says when the public form link is off, and how to turn it on", async ({ page }) => {
  const { researchId } = await signedInUser(page, "sala-spento")
  await admin.from("research").update({ form_enabled: false }).eq("id", researchId)
  await page.goto(`/research/${researchId}/sala`)
  await expect(page.getByText("Il modulo è spento.")).toBeVisible()
  await expect(page.getByRole("link", { name: "Riaccendi il link in Raccolta" })).toHaveAttribute(
    "href",
    `/research/${researchId}/collect`
  )
  await expect(page.getByRole("img", { name: "QR code del modulo pubblico" })).toHaveCount(0)
})

test("the room screen of a Research without a session goes to /login", async ({ page }) => {
  await page.goto(`/research/${crypto.randomUUID()}/sala`)
  await expect(page).toHaveURL(/\/login$/)
})
