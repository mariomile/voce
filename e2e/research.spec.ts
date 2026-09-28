import { expect, test } from "@playwright/test"
import { admin, createResearch, daysAgo, insertFeedback, signedInUser } from "./helpers"

// The Research: first run, list, creation, the page with its tabs, the not-found page, and the
// public form and QR code of each Research.

const UUID = /\/research\/[0-9a-f-]{36}$/

test("first run: the question field has the focus and creates the first Research from the keyboard", async ({ page }) => {
  await signedInUser(page, "primo", { research: false })
  await expect(page.getByRole("heading", { name: "Qui tieni le tue domande sui clienti, con le loro risposte." })).toBeVisible()
  await expect(page.getByRole("link", { name: "Nuova Research" })).toHaveCount(0)
  const field = page.getByLabel("La tua domanda")
  await expect(field).toBeFocused()

  // An empty question: RC1 under the field, the focus back in it.
  await page.keyboard.press("Enter")
  await expect(page.getByText("Scrivi la domanda a cui vuoi rispondere.", { exact: false })).toBeVisible()
  await expect(field).toHaveAttribute("aria-invalid", "true")
  await expect(field).toBeFocused()

  await page.keyboard.type("Perché i team piccoli non passano a Pro?")
  await page.keyboard.press("Enter")
  await expect(page).toHaveURL(UUID)
  const title = page.getByRole("heading", { level: 1, name: "Perché i team piccoli non passano a Pro?" })
  await expect(title).toBeFocused()
  await expect(page.getByText("Ancora nessun feedback. Il modulo è attivo.")).toBeVisible()
  // The Sintesi without feedback: the three ways to collect, the public form of this Research first.
  await expect(page.getByRole("img", { name: "QR code del modulo pubblico" })).toBeVisible()
  await expect(page.getByRole("link", { name: "Scegli il file" })).toHaveAttribute("href", /\/collect#csv$/)

  await page.getByRole("link", { name: "Tutte le Research" }).click()
  await expect(page).toHaveURL(/\/research$/)
  await expect(page.getByRole("heading", { name: "Le tue Research" })).toBeVisible()
  await expect(page.getByRole("link", { name: "Perché i team piccoli non passano a Pro?" })).toBeVisible()
  await expect(page.getByText("Nessun feedback ancora")).toBeVisible()
})

test("Nuova Research opens /research/new with the field focused, and Annulla goes back", async ({ page }) => {
  await signedInUser(page, "nuova")
  await page.getByRole("link", { name: "Nuova Research" }).click()
  await expect(page).toHaveURL(/\/research\/new$/)
  await expect(page.getByLabel("La tua domanda")).toBeFocused()
  await page.getByRole("link", { name: "Annulla" }).click()
  await expect(page).toHaveURL(/\/research$/)

  await page.goto("/research/new")
  await page.getByLabel("La tua domanda").fill("a".repeat(201))
  await page.getByRole("button", { name: "Crea la Research" }).click()
  await expect(page.getByText("La domanda supera i 200 caratteri: tienila a una domanda sola.")).toBeVisible()
  await page.getByLabel("La tua domanda").fill("Cosa blocca l'import dei dati?")
  await page.getByRole("button", { name: "Crea la Research" }).click()
  await expect(page).toHaveURL(UUID)
  await expect(page.getByRole("heading", { level: 1, name: "Cosa blocca l'import dei dati?" })).toBeFocused()
})

test("the list shows each Research with its count and form state", async ({ page }) => {
  const user = await signedInUser(page, "elenco")
  await insertFeedback(user, ["Uno.", "Due.", "Tre."])
  const off = await createResearch(user.workspaceId, "spenta")
  await admin.from("research").update({ form_enabled: false }).eq("id", off.researchId)
  await page.goto("/research")
  const rows = page.getByRole("article")
  await expect(rows).toHaveCount(2)
  await expect(rows.nth(0)).toContainText("Domanda di spenta?")
  await expect(rows.nth(0)).toContainText("Nessun feedback ancora · Modulo spento")
  await expect(rows.nth(1)).toContainText("3feedback")
  await expect(rows.nth(1).getByRole("link", { name: "Domanda di elenco?" })).toHaveAttribute(
    "href",
    `/research/${user.researchId}`
  )
})

test("the app bar has Research and Piano, and Sintesi is current on the Research and on a theme but not on Chiedi, Feedback, Raccolta", async ({ page }) => {
  const user = await signedInUser(page, "schede")
  const bar = page.getByRole("navigation", { name: "Sezioni dell'app" })
  await expect(bar.getByRole("link")).toHaveText(["Research", "Piano"])
  await expect(bar.getByRole("link", { name: "Research" })).toHaveAttribute("aria-current", "page")

  await page.goto(`/research/${user.researchId}`)
  const tabs = page.getByRole("navigation", { name: "Sezioni della Research" })
  await expect(tabs.getByRole("link")).toHaveText(["Sintesi", "Chiedi", "Feedback", "Raccolta"])
  await expect(tabs.getByRole("link", { name: "Sintesi" })).toHaveAttribute("aria-current", "page")
  await expect(tabs.getByRole("link", { name: "Raccolta" })).not.toHaveAttribute("aria-current", "page")
  await expect(bar.getByRole("link", { name: "Research" })).toHaveAttribute("aria-current", "page")

  await tabs.getByRole("link", { name: "Raccolta" }).click()
  await expect(page).toHaveURL(`/research/${user.researchId}/collect`)
  await expect(tabs.getByRole("link", { name: "Raccolta" })).toHaveAttribute("aria-current", "page")
  await expect(tabs.getByRole("link", { name: "Sintesi" })).not.toHaveAttribute("aria-current", "page")

  await tabs.getByRole("link", { name: "Chiedi" }).click()
  await expect(page).toHaveURL(`/research/${user.researchId}/ask`)
  await expect(tabs.getByRole("link", { name: "Chiedi" })).toHaveAttribute("aria-current", "page")
  await expect(tabs.getByRole("link", { name: "Sintesi" })).not.toHaveAttribute("aria-current", "page")

  await tabs.getByRole("link", { name: "Feedback" }).click()
  await expect(page).toHaveURL(`/research/${user.researchId}/feedback`)
  await expect(tabs.getByRole("link", { name: "Feedback" })).toHaveAttribute("aria-current", "page")
  await expect(tabs.getByRole("link", { name: "Sintesi" })).not.toHaveAttribute("aria-current", "page")

  // A theme of the Research belongs to the Sintesi.
  await insertFeedback(user, ["Vorrei il report in PDF.", "Mi serve il PDF del report."])
  await tabs.getByRole("link", { name: "Sintesi" }).click()
  await page.getByRole("button", { name: "Analizza 2 feedback" }).click()
  await page.getByRole("link", { name: "I clienti chiedono l'esportazione in PDF" }).click()
  await expect(page).toHaveURL(new RegExp(`/research/${user.researchId}/themes/[0-9a-f-]{36}$`))
  await expect(tabs.getByRole("link", { name: "Sintesi" })).toHaveAttribute("aria-current", "page")
  await expect(page.getByRole("heading", { level: 2, name: "I clienti chiedono l'esportazione in PDF" })).toBeVisible()
  await page.getByRole("link", { name: "Tutti i temi" }).click()
  await expect(page).toHaveURL(`/research/${user.researchId}`)
})

test("every path under /research without a session goes to /login", async ({ page }) => {
  const id = crypto.randomUUID()
  for (const path of [
    "/research",
    "/research/new",
    `/research/${id}`,
    `/research/${id}/feedback`,
    `/research/${id}/ask`,
    `/research/${id}/themes/${crypto.randomUUID()}`,
    `/research/${id}/collect`,
    `/research/${id}/sala`,
  ]) {
    await page.goto(path)
    await expect(page).toHaveURL(/\/login$/)
  }
})

test("the themes, ask, feedback, collection and room routes of today answer 404", async ({ page, request }) => {
  await signedInUser(page, "vecchie")
  for (const path of ["/themes", `/themes/${crypto.randomUUID()}`, "/ask", "/feedback", "/collect", "/collect/qr", "/sala", "/sala/status"]) {
    const response = await page.goto(path)
    expect(response?.status(), path).toBe(404)
  }
  expect((await request.get("/collect", { maxRedirects: 0 })).status()).toBe(404)
})

test("another workspace's, a deleted and a non-uuid Research show the same not-found page with status 404", async ({ page }) => {
  const other = await createResearch(
    (await admin.from("workspace_members").select("workspace_id").limit(1).single()).data!.workspace_id,
    "altrui"
  )
  const user = await signedInUser(page, "nf")
  const deleted = await createResearch(user.workspaceId, "eliminata")
  await admin.from("research").delete().eq("id", deleted.researchId)
  try {
    const pages: string[] = []
    for (const id of [other.researchId, deleted.researchId, "non-un-uuid"]) {
      const response = await page.goto(`/research/${id}`)
      expect(response?.status(), id).toBe(404)
      await expect(page.getByRole("heading", { name: "Non trovo questa Research." })).toBeVisible()
      await expect(page.getByText("Forse è stata eliminata, o il link è di un altro account.")).toBeVisible()
      await expect(page.getByRole("link", { name: "Tutte le Research" })).toHaveAttribute("href", "/research")
      pages.push(await page.locator("main").innerText())
    }
    expect(new Set(pages).size).toBe(1)
    const collect = await page.goto(`/research/${other.researchId}/collect`)
    expect(collect?.status()).toBe(404)
    const qr = await page.request.get(`/research/${other.researchId}/qr`)
    expect(qr.status()).toBe(404)
  } finally {
    await admin.from("research").delete().eq("id", other.researchId)
  }
})

test("the Raccolta shows the link and QR of this Research and /qr downloads the QR of its slug", async ({ page }) => {
  const user = await signedInUser(page, "raccolta")
  await createResearch(user.workspaceId, "altra")
  await page.goto(`/research/${user.researchId}/collect`)
  await expect(page.getByRole("link", { name: new RegExp(`/f/${user.formSlug}$`) })).toBeVisible()
  await expect(page.getByRole("img", { name: "QR code del modulo pubblico" })).toBeVisible()
  const download = page.getByRole("link", { name: "Scarica il QR code" })
  await expect(download).toHaveAttribute("href", `/research/${user.researchId}/qr`)
  const qr = await page.request.get(`/research/${user.researchId}/qr`)
  expect(qr.status()).toBe(200)
  expect(qr.headers()["content-type"]).toBe("image/png")
  expect(qr.headers()["content-disposition"]).toBe(`attachment; filename="voce-qr-${user.formSlug}.png"`)
  await expect(page.getByRole("link", { name: "Apri lo schermo della sala" })).toHaveAttribute(
    "href",
    `/research/${user.researchId}/sala`
  )
})

test("a regenerated link answers 404 on the old slug", async ({ page }) => {
  const user = await signedInUser(page, "nuovo-link")
  await page.goto(`/research/${user.researchId}/collect`)
  await page.getByRole("button", { name: "Genera un nuovo link" }).click()
  await page.getByRole("button", { name: "Genera il nuovo link" }).click()
  await expect(page.getByRole("link", { name: new RegExp(`/f/${user.formSlug}$`) })).toHaveCount(0)
  const { data } = await admin.from("research").select("form_slug").eq("id", user.researchId).single()
  expect(data!.form_slug).not.toBe(user.formSlug)
  expect((await page.goto(`/f/${user.formSlug}`))?.status()).toBe(404)
  expect((await page.goto(`/f/${data!.form_slug}`))?.status()).toBe(200)
  await expect(page.getByLabel("Il tuo feedback")).toBeVisible()
})

test("a disabled form and a full Free workspace show FormUnavailable", async ({ page }) => {
  const user = await signedInUser(page, "non-disponibile")
  const second = await createResearch(user.workspaceId, "seconda")
  await admin.from("research").update({ form_enabled: false }).eq("id", user.researchId)
  await page.goto(`/f/${user.formSlug}`)
  await expect(page.getByText("Per ora questo modulo non accetta nuovi feedback.")).toBeVisible()
  await expect(page.getByLabel("Il tuo feedback")).toHaveCount(0)

  // 100 feedback across the Research of a Free workspace: every form is full.
  await insertFeedback(user, Array.from({ length: 60 }, (_, i) => `Prima ${i}`))
  await insertFeedback(second, Array.from({ length: 40 }, (_, i) => `Seconda ${i}`))
  await page.goto(`/f/${second.formSlug}`)
  await expect(page.getByText("Per ora questo modulo non accetta nuovi feedback.")).toBeVisible()
})

test("notes pasted in the Raccolta land in this Research, as Intervista, and show in its Feedback tab", async ({ page }) => {
  const user = await signedInUser(page, "note")
  const other = await createResearch(user.workspaceId, "altra-note")
  await insertFeedback(other, ["Di un'altra Research."])
  await page.goto(`/research/${user.researchId}/collect`)
  await expect(page.getByRole("heading", { name: "Incolla le note di un'intervista" })).toBeVisible()
  await expect(page.getByLabel("Canale", { exact: true })).toHaveValue("Intervista")
  await expect(page.getByText("Le note non si salvano finché non le aggiungi.")).toBeVisible()

  // N1: nothing pasted, the focus goes back to the field.
  await page.getByRole("button", { name: "Aggiungi le note" }).click()
  const notes = page.getByLabel("Note", { exact: true })
  await expect(page.getByText("Incolla le note prima di aggiungerle.")).toBeVisible()
  await expect(notes).toHaveAttribute("aria-invalid", "true")
  await expect(notes).toBeFocused()

  // N2: 10,001 characters, the counter says so.
  await notes.fill("a".repeat(10001))
  await expect(page.getByText("10.001 / 10.000")).toBeVisible()
  await page.getByRole("button", { name: "Aggiungi le note" }).click()
  await expect(page.getByText("Le note superano i 10.000 caratteri.", { exact: false })).toBeVisible()
  await expect(notes).toBeFocused()

  const text = "Usa Voce solo il lunedì.\nIl report lo apre il socio, non lei."
  await notes.fill(text)
  await page.getByLabel("Persona o ruolo").fill("Giulia, CFO")
  await page.getByRole("button", { name: "Aggiungi le note" }).click()
  await expect(page.getByText("Aggiunte a questa Research. Le trovi in Feedback.")).toBeVisible()
  await expect(notes).toHaveValue("")

  await page.getByRole("link", { name: "Feedback", exact: true }).click()
  const rows = page.getByRole("row")
  await expect(rows).toHaveCount(2)
  await expect(rows.nth(1)).toContainText("Usa Voce solo il lunedì.")
  await expect(rows.nth(1)).toContainText("Intervista")
  await expect(rows.nth(1)).toContainText("Giulia, CFO")
  await expect(page.getByText("Di un'altra Research.")).toHaveCount(0)
})

test("the Feedback tab of an empty Research points to the Raccolta", async ({ page }) => {
  const user = await signedInUser(page, "feedback-vuoto")
  await page.goto(`/research/${user.researchId}/feedback`)
  await expect(page.getByText("Qui trovi ogni feedback di questa Research", { exact: false })).toBeVisible()
  await expect(page.getByRole("link", { name: "Aggiungi feedback" })).toHaveAttribute(
    "href",
    `/research/${user.researchId}/collect#notes`
  )
})

test("the Sintesi analyzes the Research and says what changed since the analysis before", async ({ page }) => {
  const user = await signedInUser(page, "sintesi")
  const other = await createResearch(user.workspaceId, "sintesi-altra")
  await insertFeedback(other, ["Di un'altra Research, da non leggere."])
  await insertFeedback(user, ["Vorrei il report in PDF.", "Mi serve il PDF del report."])
  await page.goto(`/research/${user.researchId}`)
  await expect(page.getByRole("heading", { level: 2, name: "2 feedback, ancora nessun tema" })).toBeVisible()
  await expect(page.getByText("Con meno di 5 feedback i temi dicono poco", { exact: false })).toBeVisible()

  const button = page.getByRole("button", { name: "Analizza 2 feedback" })
  await button.click()
  await expect(page.getByRole("status").filter({ hasText: "Analisi finita: 1 tema." })).toBeVisible()
  await expect(page.getByRole("heading", { level: 2, name: "Temi" })).toBeVisible()
  const theme = page.getByRole("heading", { level: 3, name: "I clienti chiedono l'esportazione in PDF" })
  await expect(theme).toBeVisible()
  // The first analysis of the Research: nothing to compare with.
  await expect(page.getByText("Dall'analisi del", { exact: false })).toHaveCount(0)
  await expect(page.getByText("Di un'altra Research", { exact: false })).toHaveCount(0)

  await insertFeedback(user, ["Il PDF lo aspetto da mesi."])
  await page.reload()
  await page.getByRole("button", { name: "Analizza 3 feedback" }).click()
  await expect(page.getByText("Dall'analisi del", { exact: false })).toContainText("1 feedback in più, 0 temi nuovi.")
  await expect(page.getByRole("article").filter({ has: theme })).toContainText("+1 dal")
})

test("the analyze button keeps the focus through the analysis and announces the result", async ({ page }) => {
  const user = await signedInUser(page, "sintesi-focus")
  await insertFeedback(user, ["Vorrei il report in PDF.", "Mi serve il PDF del report."])
  await page.goto(`/research/${user.researchId}`)
  const button = page.getByRole("button", { name: "Analizza 2 feedback" })
  await button.focus()
  await page.keyboard.press("Enter")
  await expect(page.getByRole("status").filter({ hasText: "Analisi finita: 1 tema." })).toBeVisible()
  await expect(page.getByRole("button", { name: "Analizza 2 feedback" })).toBeFocused()
})

test("with a hypothesis one click saves the themes and a verdict with a verified quote", async ({ page }) => {
  const user = await signedInUser(page, "verdetto")
  await insertFeedback(user, ["Vorrei il report in PDF.", "Mi serve il PDF del report."])
  const { data: hypothesis, error } = await admin
    .from("research_hypotheses")
    .insert({ workspace_id: user.workspaceId, research_id: user.researchId, text: "I clienti vogliono il PDF" })
    .select("id")
    .single()
  if (error) throw error
  await page.goto(`/research/${user.researchId}`)
  await page.getByRole("button", { name: "Analizza 2 feedback" }).click()
  await expect(page.getByRole("status").filter({ hasText: "Analisi finita: 1 tema." })).toBeVisible()

  const { data: analyses } = await admin.from("analyses").select("kind, status").eq("workspace_id", user.workspaceId)
  expect(analyses!.map((a) => `${a.kind} ${a.status}`).sort()).toEqual(["themes done", "verdict done"])
  const { data: verdict } = await admin
    .from("hypothesis_verdicts")
    .select("verdict, feedback_read, verdict_feedback (stance, quote_rank, highlight)")
    .eq("hypothesis_id", hypothesis.id)
    .single()
  expect(verdict).toMatchObject({ verdict: "confirmed", feedback_read: 2 })
  expect(verdict!.verdict_feedback).toEqual([{ stance: "for", quote_rank: 1, highlight: "Vorrei il report in PDF." }])
})

test("a verdict that fails while the themes succeed says so (S6) in the Ipotesi section, and counts once", async ({ page }) => {
  const user = await signedInUser(page, "verdetto-fallito")
  await insertFeedback(user, ["Vorrei il report in PDF.", "Mi serve il PDF del report."])
  const { error } = await admin
    .from("research_hypotheses")
    .insert({ workspace_id: user.workspaceId, research_id: user.researchId, text: "FUORI_SCHEMA" })
  if (error) throw error
  await page.goto(`/research/${user.researchId}`)
  await page.getByRole("button", { name: "Analizza 2 feedback" }).click()
  await expect(page.getByRole("status").filter({ hasText: "Analisi finita: 1 tema." })).not.toContainText("Il verdetto")
  const hypotheses = page.getByRole("region", { name: "Ipotesi" })
  await expect(hypotheses.getByRole("status").filter({ hasText: "Il verdetto non è arrivato e non conta nel limite del mese" })).toBeVisible()
  const { data: analyses } = await admin.from("analyses").select("kind, status").eq("workspace_id", user.workspaceId)
  expect(analyses!.map((a) => `${a.kind} ${a.status}`).sort()).toEqual(["themes done", "verdict failed"])
})

// Analyses of the month the workspace already used: done themes analyses, with no theme.
async function usedAnalyses(user: { workspaceId: string; researchId: string }, count: number) {
  const { error } = await admin.from("analyses").insert(
    Array.from({ length: count }, () => ({
      workspace_id: user.workspaceId,
      research_id: user.researchId,
      kind: "themes" as const,
      period_start: daysAgo(30),
      feedback_count: 1,
      status: "done" as const,
    }))
  )
  if (error) throw error
}

async function hypothesis(user: { workspaceId: string; researchId: string }, text: string) {
  const { error } = await admin.from("research_hypotheses").insert({ workspace_id: user.workspaceId, research_id: user.researchId, text })
  if (error) throw error
}

test("the cost is said before the click: 2 analyses with hypotheses, the themes alone with 1 left (S4)", async ({ page }) => {
  const user = await signedInUser(page, "quota-s4")
  await insertFeedback(user, ["Vorrei il report in PDF.", "Mi serve il PDF del report."])
  await hypothesis(user, "I clienti vogliono il PDF")
  await page.goto(`/research/${user.researchId}`)
  await expect(page.getByText("Userai 2 delle 3 analisi di", { exact: false })).toContainText("una per i temi, una per il verdetto delle ipotesi.")

  await usedAnalyses(user, 2)
  await page.reload()
  const S4 = "basta per i temi, non per il verdetto, che ne usa un'altra."
  await expect(page.getByText(S4, { exact: false })).toBeVisible()
  await page.getByRole("button", { name: "Analizza solo i temi di 2 feedback" }).click()
  await expect(page.getByRole("status").filter({ hasText: "Analisi finita: 1 tema." })).toContainText(S4)
  const { data: analyses } = await admin.from("analyses").select("kind, status").eq("workspace_id", user.workspaceId)
  expect(analyses!.map((a) => `${a.kind} ${a.status}`)).toEqual(["themes done", "themes done", "themes done"])
  await expect(page.getByText("Nessun verdetto ancora. Arriva con la prossima analisi.")).toBeVisible()
})

test("Solo il verdetto: after the themes, a new hypothesis gets its verdict for 1 analysis", async ({ page }) => {
  const user = await signedInUser(page, "solo-verdetto")
  await insertFeedback(user, ["Vorrei il report in PDF.", "Mi serve il PDF del report."])
  await hypothesis(user, "I clienti vogliono il PDF")
  await page.goto(`/research/${user.researchId}`)
  await expect(page.getByRole("button", { name: /Solo il verdetto/ })).toHaveCount(0)
  await page.getByRole("button", { name: "Analizza 2 feedback" }).click()
  await expect(page.getByRole("status").filter({ hasText: "Analisi finita: 1 tema. 1 verdetto: 1 confermata." })).toBeVisible()
  // Every verdict is up to date: nothing to redo.
  await expect(page.getByRole("button", { name: /Solo il verdetto/ })).toHaveCount(0)

  await hypothesis(user, "I clienti vogliono Excel")
  await page.reload()
  const verdictOnly = page.getByRole("button", { name: "Solo il verdetto di 2 ipotesi" })
  await expect(page.getByText("Userai 1 delle 3 analisi di", { exact: false })).toBeVisible()
  await verdictOnly.focus()
  await page.keyboard.press("Enter")
  await expect(page.getByRole("status").filter({ hasText: "2 verdetti: 2 confermate." })).toBeVisible()
  // Every verdict is up to date and the button is gone: the focus is on the section title.
  await expect(verdictOnly).toHaveCount(0)
  await expect(page.getByRole("heading", { level: 2, name: "Ipotesi" })).toBeFocused()
  await expect(page.getByRole("listitem").filter({ hasText: "I clienti vogliono Excel" })).toContainText("Confermata")
  const { data: analyses } = await admin.from("analyses").select("kind, status").eq("workspace_id", user.workspaceId)
  expect(analyses!.map((a) => `${a.kind} ${a.status}`).sort()).toEqual(["themes done", "verdict done", "verdict done"])
})

test("analyses used up: the analyze button and Solo il verdetto are off with the note of the plan", async ({ page }) => {
  const user = await signedInUser(page, "quota-finita")
  await insertFeedback(user, ["Vorrei il report in PDF.", "Mi serve il PDF del report."])
  await hypothesis(user, "I clienti vogliono il PDF")
  await usedAnalyses(user, 3)
  await page.goto(`/research/${user.researchId}`)
  await expect(page.getByRole("button", { name: "Analizza 2 feedback" })).toHaveAttribute("aria-disabled", "true")
  const verdictOnly = page.getByRole("button", { name: "Solo il verdetto di 1 ipotesi" })
  await expect(verdictOnly).toHaveAttribute("aria-disabled", "true")
  await expect(page.getByText("Hai usato le 3 analisi di", { exact: false })).toHaveCount(2)
  // Playwright will not click an aria-disabled button: the keyboard still can.
  await verdictOnly.focus()
  await page.keyboard.press("Enter")
  await expect(verdictOnly).toBeFocused()
  const { data: analyses } = await admin.from("analyses").select("kind").eq("workspace_id", user.workspaceId)
  expect(analyses).toHaveLength(3)
})

test("hypotheses: write, edit and delete from the keyboard, with the focus where the design puts it", async ({ page }) => {
  const user = await signedInUser(page, "ipotesi")
  await insertFeedback(user, ["Il prezzo per utente è troppo alto per noi."])
  await page.goto(`/research/${user.researchId}`)
  const section = page.getByRole("region", { name: "Ipotesi" })
  await expect(section.getByText("Hai un'idea da mettere alla prova?", { exact: false })).toBeVisible()

  // Scrivi un'ipotesi: the field opens with the focus; Annulla gives the button back.
  await section.getByRole("button", { name: "Scrivi un'ipotesi" }).click()
  const field = section.getByLabel("Nuova ipotesi")
  await expect(field).toBeFocused()
  await section.getByRole("button", { name: "Annulla" }).click()
  await expect(section.getByRole("button", { name: "Scrivi un'ipotesi" })).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(field).toBeFocused()

  // H1 on an empty hypothesis: the focus back in the field.
  await page.keyboard.press("Enter")
  await expect(section.getByText("Scrivi l'ipotesi come una frase", { exact: false })).toBeVisible()
  await expect(field).toHaveAttribute("aria-invalid", "true")
  await expect(field).toBeFocused()

  await page.keyboard.type("I team piccoli non passano a Pro per il prezzo.")
  await page.keyboard.press("Enter")
  await expect(section.getByRole("heading", { level: 3, name: "I team piccoli non passano a Pro per il prezzo." })).toBeVisible()
  await expect(section.getByText("Nessun verdetto ancora. Arriva con la prossima analisi.")).toBeVisible()
  await expect(section.getByRole("status").filter({ hasText: "Ipotesi aggiunta." })).toBeVisible()
  await expect(field).toHaveValue("")
  await expect(field).toBeFocused()

  // Modifica: Esc cancels and gives the focus back to Modifica; Enter saves.
  const edit = section.getByRole("button", { name: "Modifica l'ipotesi: I team piccoli non passano a Pro per il prezzo." })
  await edit.click()
  const editing = section.getByLabel("Testo dell'ipotesi")
  await expect(editing).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(edit).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(editing).toBeFocused()
  await editing.fill("I team piccoli non passano a Pro perché il prezzo è per utente.")
  await page.keyboard.press("Enter")
  const renamed = "I team piccoli non passano a Pro perché il prezzo è per utente."
  await expect(section.getByRole("heading", { level: 3, name: renamed })).toBeVisible()
  await expect(section.getByRole("button", { name: `Modifica l'ipotesi: ${renamed}` })).toBeFocused()

  // Elimina: H6 in the row with the focus on Annulla; Esc cancels; confirming lands on the h2.
  const remove = section.getByRole("button", { name: `Elimina l'ipotesi: ${renamed}` })
  await remove.click()
  await expect(section.getByText("Elimini l'ipotesi e il suo verdetto. Non si può annullare.")).toBeVisible()
  await expect(section.getByRole("button", { name: "Annulla" })).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(remove).toBeFocused()
  await page.keyboard.press("Enter")
  await page.keyboard.press("Tab")
  await expect(section.getByRole("button", { name: "Elimina l'ipotesi", exact: true })).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(section.getByRole("heading", { level: 2, name: "Ipotesi" })).toBeFocused()
  await expect(section.getByRole("heading", { level: 3 })).toHaveCount(0)
})

test("hypotheses: 5 at most, H3 in place of the field, and E-SESS with the text kept", async ({ page, context }) => {
  const user = await signedInUser(page, "ipotesi-max")
  const { error } = await admin.from("research_hypotheses").insert(
    [1, 2, 3, 4].map((n) => ({ workspace_id: user.workspaceId, research_id: user.researchId, text: `Ipotesi ${n}` }))
  )
  if (error) throw error
  await page.goto(`/research/${user.researchId}`)
  const section = page.getByRole("region", { name: "Ipotesi" })
  const field = section.getByLabel("Nuova ipotesi")
  await field.fill("La quinta")
  await page.keyboard.press("Enter")
  await expect(section.getByText("Questa Research ha già 5 ipotesi, il massimo. Eliminane una per scriverne un'altra.")).toBeVisible()
  await expect(field).toHaveCount(0)
  await expect(section.getByRole("heading", { level: 2, name: "Ipotesi" })).toBeFocused()

  await section.getByRole("button", { name: "Modifica l'ipotesi: La quinta" }).click()
  await context.clearCookies()
  await section.getByLabel("Testo dell'ipotesi").fill("La quinta, cambiata")
  await page.keyboard.press("Enter")
  await expect(section.getByText("La sessione è scaduta.", { exact: false })).toBeVisible()
  await expect(section.getByRole("link", { name: "Accedi" })).toHaveAttribute("href", "/login")
  await expect(section.getByLabel("Testo dell'ipotesi")).toHaveValue("La quinta, cambiata")
})
