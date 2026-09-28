import { expect, test, type Locator, type Page } from "@playwright/test"
import { confirmationLink } from "./helpers"

// The main flow of a new PM, from the keyboard only once signed up: first run, a Research, 5 interview
// notes, a hypothesis, one click on "Analizza 5 feedback", then the verdict with its quote and counts and the
// themes, with the focus still on the button. The confirmation email is read from Mailpit, the local
// Supabase inbox; the model is the fake Anthropic API.

// Tab (or Shift+Tab) until the target has the focus: how a keyboard user gets there.
async function tabTo(page: Page, target: Locator, key: "Tab" | "Shift+Tab" = "Tab") {
  for (let i = 0; i < 80; i++) {
    if (await target.evaluate((el) => el === document.activeElement).catch(() => false)) return
    await page.keyboard.press(key)
  }
  throw new Error(`Could not reach ${target} with ${key}`)
}

test("sign up, create a Research, paste 5 notes, write a hypothesis, analyze and read the verdict from the keyboard", async ({
  page,
}) => {
  const email = `e2e-${crypto.randomUUID().slice(0, 8)}@test.voce`

  await page.goto("/signup")
  await page.getByLabel("Nome del prodotto").fill("Prova E2E")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password", { exact: true }).fill("password-e2e-voce")
  await page.getByRole("button", { name: "Crea il workspace" }).click()
  await expect(page.getByText("Controlla la tua email")).toBeVisible()
  await page.goto(await confirmationLink(email))
  await expect(page).toHaveURL(/\/research$/)

  // First run: the question field has the focus.
  await expect(page.getByLabel("La tua domanda")).toBeFocused()
  await page.keyboard.type("Cosa chiedono del report?")
  await page.keyboard.press("Enter")
  await expect(page.getByRole("heading", { level: 1, name: "Cosa chiedono del report?" })).toBeFocused()

  await tabTo(page, page.getByRole("link", { name: "Raccolta", exact: true }))
  await page.keyboard.press("Enter")
  const notes = [
    "Vorrei esportare il report mensile in PDF per il commercialista.",
    "Mi serve il PDF dei report da mandare al mio socio.",
    "Il report in PDF lo stampo ogni mese.",
    "Senza PDF devo fare screenshot del report.",
    "Il PDF del report mi serve per le riunioni.",
  ]
  for (const text of notes) {
    await tabTo(page, page.getByLabel("Note", { exact: true }))
    await page.keyboard.type(text)
    await tabTo(page, page.getByRole("button", { name: "Aggiungi le note" }))
    await page.keyboard.press("Enter")
    await expect(page.getByText("Aggiunte a questa Research. Le trovi in Feedback.")).toBeVisible()
  }

  await tabTo(page, page.getByRole("link", { name: "Sintesi", exact: true }), "Shift+Tab")
  await page.keyboard.press("Enter")
  await tabTo(page, page.getByRole("button", { name: "Scrivi un'ipotesi" }))
  await page.keyboard.press("Enter")
  await expect(page.getByLabel("Nuova ipotesi")).toBeFocused()
  await page.keyboard.type("I clienti vogliono il report in PDF")
  await page.keyboard.press("Enter")
  await expect(page.getByText("Ipotesi aggiunta. Il verdetto arriva con la prossima analisi.")).toBeVisible()

  const analyze = page.getByRole("button", { name: "Analizza 5 feedback" })
  await tabTo(page, analyze, "Shift+Tab")
  await page.keyboard.press("Enter")
  await expect(page.getByRole("status").filter({ hasText: "Analisi finita: 1 tema. 1 verdetto: 1 confermata." })).toBeVisible()

  const hypothesis = page.getByRole("listitem").filter({ has: page.getByRole("heading", { level: 3, name: "I clienti vogliono il report in PDF" }) })
  await expect(hypothesis).toContainText("Confermata")
  await expect(hypothesis).toContainText("1 a favore · 0 contro · su 5 letti")
  await expect(hypothesis).toContainText("A favore")
  // The fake model quotes the most recent note in full: a verified quote, highlighted.
  await expect(hypothesis.locator("blockquote mark")).toHaveText(notes[4])
  await expect(hypothesis).toContainText("Tutti i 5 feedback letti erano già arrivati quando l'hai scritta")
  await expect(page.getByRole("heading", { level: 3, name: "I clienti chiedono l'esportazione in PDF" })).toBeVisible()
  // Still the same button, which now says what 1 analysis left buys: the themes alone (S4).
  await expect(page.getByRole("button", { name: "Analizza solo i temi di 5 feedback" })).toBeFocused()
})
