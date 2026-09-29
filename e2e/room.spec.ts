import { expect, test } from "@playwright/test"
import { admin, createResearch, daysAgo, insertFeedback, signedInUser } from "./helpers"

// The room screen of a Research: projected during a live session, the audience answers its public
// form from their phones. It shows counts, theme titles and the verdict of the hypotheses, never the text of a
// feedback: each response is a dot on a canvas, and the analysis sorts the dots into one bubble per theme.
// The analysis goes to the fake Anthropic API (e2e/fake-anthropic.mts), which groups every feedback into one
// theme and confirms every hypothesis with the first feedback.

test("the room of a Research shows its form question and QR and counts only its public form responses", async ({ page, browser }) => {
  const user = await signedInUser(page, "sala")
  // Not from the public form: the analysis reads it, the counter does not count it.
  const support = "Vorrei esportare il report mensile in PDF per il commercialista."
  await insertFeedback(user, [support])
  // A public form response of another Research of the same workspace: not this room's.
  const other = await createResearch(user.workspaceId, "sala-altra")
  await publicResponses(other, ["Una risposta a un'altra Research."])

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
  // No hypotheses: no verdict to show.
  await expect(page.getByRole("button", { name: "Verdetto" })).toHaveCount(0)

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

// Responses as the public form saves them: channel "Modulo pubblico".
async function publicResponses(research: { workspaceId: string; researchId: string }, texts: string[]) {
  const { error } = await admin.from("feedback").insert(
    texts.map((text) => ({ workspace_id: research.workspaceId, research_id: research.researchId, text, channel: "Modulo pubblico" }))
  )
  if (error) throw error
}

test("with hypotheses, Analizza le risposte also runs the verdict: its word and counts, never the quotes", async ({ page }) => {
  const user = await signedInUser(page, "sala-ipotesi")
  const responses = ["Mi serve il PDF dei report.", "Vorrei esportare il report in PDF."]
  await publicResponses(user, responses)
  const { error } = await admin
    .from("research_hypotheses")
    .insert({ workspace_id: user.workspaceId, research_id: user.researchId, text: "I clienti vogliono il PDF" })
  if (error) throw error

  await page.goto(`/research/${user.researchId}/sala`)
  await expect(page.getByText("Con i temi arriva anche il verdetto delle ipotesi.")).toBeVisible()
  await page.getByRole("button", { name: "Analizza le risposte" }).click()
  // The themes first, as without hypotheses; the speaker shows the verdict when they choose.
  await expect(page.getByText("I clienti chiedono l'esportazione in PDF")).toBeVisible()
  await page.getByRole("button", { name: "Verdetto" }).click()
  await expect(page.getByRole("button", { name: "Verdetto" })).toHaveAttribute("aria-pressed", "true")
  await expect(page.getByRole("heading", { name: "Il verdetto" })).toBeVisible()
  await expect(page.getByText("I clienti vogliono il PDF")).toBeVisible()
  await expect(page.getByText("Confermata")).toBeVisible()
  await expect(page.getByText("1 a favore · 0 contro · su 2 letti")).toBeVisible()
  // The fake model quotes a whole feedback: the quote never reaches the projector.
  for (const response of responses) await expect(page.getByText(response)).toHaveCount(0)

  // The same analysis as the Sintesi: the themes and the verdict, 2 analyses.
  const { data: analyses } = await admin.from("analyses").select("kind, status").eq("workspace_id", user.workspaceId).order("kind")
  expect(analyses).toEqual([
    { kind: "themes", status: "done" },
    { kind: "verdict", status: "done" },
  ])
})

test("the verdict that did not come says so, and a verdict without this click's themes shows alone", async ({ page }) => {
  const user = await signedInUser(page, "sala-verdetto-mancato")
  await publicResponses(user, ["Mi serve il PDF dei report.", "Vorrei esportare il report in PDF."])
  const hypothesis = async (text: string) => {
    await admin.from("research_hypotheses").delete().eq("research_id", user.researchId)
    const { error } = await admin
      .from("research_hypotheses")
      .insert({ workspace_id: user.workspaceId, research_id: user.researchId, text })
    if (error) throw error
  }

  // The verdict fails (the fake model answers without JSON): the themes show, the Verdetto view says why.
  await hypothesis("FUORI_SCHEMA")
  await page.goto(`/research/${user.researchId}/sala`)
  await page.getByRole("button", { name: "Analizza le risposte" }).click()
  await expect(page.getByText("I clienti chiedono l'esportazione in PDF")).toBeVisible()
  await page.getByRole("button", { name: "Verdetto" }).click()
  await expect(page.getByText("Il verdetto non è arrivato", { exact: false })).toBeVisible()

  // The themes fail and the verdict comes: the verdict alone, never the themes of before.
  await hypothesis("I clienti vogliono il PDF")
  await publicResponses(user, ["TEMI_FUORI_SCHEMA"])
  await page.getByRole("button", { name: "Torna al QR code" }).click()
  await page.getByRole("button", { name: "Analizza le risposte" }).click()
  await expect(page.getByRole("heading", { name: "Il verdetto" })).toBeVisible()
  await expect(page.getByText("I temi non sono arrivati e non contano nel limite del mese: il verdetto sì.")).toBeVisible()
  await expect(page.getByText("Confermata")).toBeVisible()
  await expect(page.getByRole("button", { name: "Bolle" })).toHaveCount(0)
  await expect(page.getByText("I clienti chiedono l'esportazione in PDF")).toHaveCount(0)
  await expect(page.getByText("TEMI_FUORI_SCHEMA")).toHaveCount(0)
})

test("a Research deleted while the room is open: status 404 and R1 instead of the QR", async ({ page }) => {
  const user = await signedInUser(page, "sala-eliminata")
  await page.goto(`/research/${user.researchId}/sala`)
  await expect(page.getByRole("img", { name: "QR code del modulo pubblico" })).toBeVisible()

  await admin.from("research").delete().eq("id", user.researchId)
  expect((await page.request.get(`/research/${user.researchId}/sala/status`)).status()).toBe(404)
  await expect(page.getByText("Questa Research non c'è più.")).toBeVisible({ timeout: 10_000 })
  await expect(page.getByText("Il modulo non accetta risposte.")).toBeVisible()
  await expect(page.getByRole("link", { name: "Torna alle Research" })).toHaveAttribute("href", "/research")
  await expect(page.getByRole("img", { name: "QR code del modulo pubblico" })).toHaveCount(0)
})

test("the room button is off with the quota note", async ({ page }) => {
  const user = await signedInUser(page, "sala-quota")
  await publicResponses(user, ["Mi serve il PDF dei report."])
  const { error } = await admin.from("analyses").insert(
    [1, 2, 3].map(() => ({
      workspace_id: user.workspaceId,
      research_id: user.researchId,
      kind: "themes" as const,
      period_start: daysAgo(30),
      feedback_count: 1,
      status: "done" as const,
    }))
  )
  if (error) throw error

  await page.goto(`/research/${user.researchId}/sala`)
  const analyze = page.getByRole("button", { name: "Analizza le risposte" })
  await expect(analyze).toHaveAttribute("aria-disabled", "true")
  await expect(page.getByText("Hai usato le 3 analisi di", { exact: false })).toBeVisible()
  // Playwright will not click an aria-disabled button: the keyboard still can, and nothing starts.
  await analyze.focus()
  await page.keyboard.press("Enter")
  await expect(analyze).toBeFocused()
  const { data: analyses } = await admin.from("analyses").select("id").eq("workspace_id", user.workspaceId)
  expect(analyses).toHaveLength(3)
})

test("/sala opens the room of the Research created last, or the list when there is none", async ({ page, browser }) => {
  const user = await signedInUser(page, "sala-ultima")
  const latest = await createResearch(user.workspaceId, "sala-ultima-nuova")
  await page.goto("/sala")
  await expect(page).toHaveURL(`/research/${latest.researchId}/sala`)

  const empty = await (await browser.newContext()).newPage()
  await signedInUser(empty, "sala-vuota", { research: false })
  await empty.goto("/sala")
  await expect(empty).toHaveURL(/\/research$/)
})
