import { expect, test } from "@playwright/test"
import { confirmationLink, signedInUser } from "./helpers"

// "Chiedi ai tuoi feedback" in the browser. The fake gateway (e2e/fake-gateway.mts) answers every
// question by citing the first feedback it received: no real model is ever called.

test("ask a question from the keyboard and read the answer", async ({ page }) => {
  const email = `e2e-ask-${crypto.randomUUID().slice(0, 8)}@test.voce`
  await page.goto("/signup")
  await page.getByLabel("Nome del prodotto").fill("Prova Chiedi")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill("password-e2e-voce")
  await page.getByRole("button", { name: "Crea il workspace" }).click()
  await expect(page.getByText("Controlla la tua email")).toBeVisible()
  await page.goto(await confirmationLink(email))
  await expect(page).toHaveURL(/\/themes$/)

  await page.goto("/collect")
  const feedback = "Vorrei esportare il report mensile in PDF per il commercialista."
  await page.getByLabel("Feedback", { exact: true }).fill(feedback)
  await page.getByLabel("Canale", { exact: true }).fill("Supporto")
  await page.getByRole("button", { name: "Aggiungi il feedback" }).click()
  await expect(page.getByText("Aggiunto. Lo trovi tra i feedback.")).toBeVisible()

  // From here on, keyboard only: Tab to the "Chiedi" tab, Enter, then type and press Enter.
  await page.goto("/themes")
  const tab = page.getByRole("link", { name: "Chiedi", exact: true })
  for (let i = 0; i < 20 && !(await tab.evaluate((el) => el === document.activeElement)); i++) await page.keyboard.press("Tab")
  await expect(tab).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(page).toHaveURL(/\/ask$/)

  const field = page.getByLabel("La tua domanda")
  await expect(field).toBeFocused()
  await page.keyboard.type("Cosa chiedono del PDF?")
  await page.keyboard.press("Enter")

  const answer = page.getByRole("region", { name: "Risposta a «Cosa chiedono del PDF?»" })
  await expect(answer).toBeVisible()
  await expect(answer.getByText("feedback ne parla", { exact: true })).toBeVisible()
  await expect(answer.getByText("1", { exact: true })).toBeVisible()
  await expect(answer.locator("blockquote")).toHaveCount(1)
  await expect(answer.locator("blockquote mark")).toHaveText(feedback)
  await expect(answer.locator("blockquote cite")).toContainText("Supporto")
  await expect(field).toBeFocused()

  // A second question replaces the first answer.
  await page.keyboard.press("ControlOrMeta+a")
  await page.keyboard.type("E dei report?")
  await page.keyboard.press("Enter")
  await expect(page.getByRole("region", { name: "Risposta a «E dei report?»" })).toBeVisible()
  await expect(page.getByRole("region", { name: /Risposta a «Cosa chiedono del PDF\?»/ })).toHaveCount(0)
  await expect(field).toBeFocused()
})

test("the Chiedi tab sits between Temi and Feedback and marks the page", async ({ page }) => {
  await signedInUser(page, "tabs")
  await page.goto("/ask")
  const tabs = page.getByRole("navigation").getByRole("link")
  await expect(tabs).toHaveText(["Temi", "Chiedi", "Feedback", "Raccolta", "Piano"])
  await expect(page.getByRole("link", { name: "Chiedi", exact: true })).toHaveAttribute("aria-current", "page")
})

test("/ask without a session goes to /login", async ({ page }) => {
  await page.goto("/ask")
  await expect(page).toHaveURL(/\/login$/)
})
