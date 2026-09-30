import { expect, test } from "@playwright/test"
import { admin, confirmationLink, insertFeedback, signedInUser } from "./helpers"

// "Chiedi ai tuoi feedback" in the browser. The fake Anthropic API (e2e/fake-anthropic.mts) answers every
// question by citing the first feedback it received: no real model is ever called.

// Same default and same env var as e2e/fake-anthropic.mts and playwright.config.ts, so a run on a
// different port (FAKE_ANTHROPIC_PORT set before invoking Playwright) still reaches GET /calls.
const FAKE_ANTHROPIC_PORT = Number(process.env.FAKE_ANTHROPIC_PORT ?? 4010)

test("ask a question from the keyboard and read the answer", async ({ page }) => {
  const email = `e2e-ask-${crypto.randomUUID().slice(0, 8)}@test.voce`
  await page.goto("/signup")
  await page.getByLabel("Nome del prodotto").fill("Prova Chiedi")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password", { exact: true }).fill("password-e2e-voce")
  await page.getByRole("button", { name: "Crea il workspace" }).click()
  await expect(page.getByText("Controlla la tua email")).toBeVisible()
  await page.goto(await confirmationLink(email))
  await expect(page).toHaveURL(/\/research$/)

  await page.getByLabel("La tua domanda").fill("Cosa chiedono del PDF?")
  await page.getByRole("button", { name: "Crea la Research" }).click()
  await page.getByRole("link", { name: "Raccolta", exact: true }).click()
  const feedback = "Vorrei esportare il report mensile in PDF per il commercialista."
  await page.getByLabel("Note", { exact: true }).fill(feedback)
  await page.getByLabel("Canale", { exact: true }).fill("Supporto")
  await page.getByRole("button", { name: "Aggiungi le note" }).click()
  await expect(page.getByText("Aggiunte a questa Research. Le trovi in Feedback.")).toBeVisible()

  // From here on, keyboard only: the Chiedi tab of the Research, the field has the focus, type and press Enter.
  await page.getByRole("link", { name: "Chiedi", exact: true }).click()
  await expect(page).toHaveURL(/\/research\/[0-9a-f-]{36}\/ask$/)

  const field = page.getByLabel("La tua domanda")
  await expect(field).toBeFocused()
  await page.keyboard.type("Cosa chiedono del PDF?")
  await page.keyboard.press("Enter")

  const answer = page.getByRole("region", { name: "Risposta a «Cosa chiedono del PDF?»" })
  await expect(answer).toBeVisible()
  await expect(answer.getByText("feedback ne parla", { exact: true })).toBeVisible()
  await expect(answer.getByText("1", { exact: true })).toBeVisible()
  await expect(answer.getByText("100% dei 1 letti", { exact: true })).toBeVisible()
  await expect(answer.locator("blockquote")).toHaveCount(1)
  await expect(answer.locator("blockquote mark")).toHaveText(feedback)
  await expect(answer.locator("blockquote cite")).toContainText("Supporto")
  await expect(field).toBeFocused()

  // The answer emptied the field. A second question goes on top; the first folds into one line.
  await expect(field).toHaveValue("")
  await page.keyboard.type("E dei report?")
  await page.keyboard.press("Enter")
  await expect(page.getByRole("region", { name: "Risposta a «E dei report?»" })).toBeVisible()
  await expect(field).toBeFocused()
  const first = page.getByRole("region", { name: "Risposta a «Cosa chiedono del PDF?»" })
  await expect(first.locator("blockquote")).toHaveCount(0)
  await first.getByRole("button", { name: /Cosa chiedono del PDF\?/ }).click()
  await expect(first.getByRole("button", { name: /Cosa chiedono del PDF\?/ })).toHaveAttribute("aria-expanded", "true")
  await expect(first.locator("blockquote")).toHaveCount(1)

  // The answers stay while moving between the tabs, and go away with a reload.
  await page.getByRole("link", { name: "Feedback", exact: true }).click()
  await expect(page).toHaveURL(/\/feedback$/)
  await page.getByRole("link", { name: "Chiedi", exact: true }).click()
  await expect(page.getByRole("region", { name: /^Risposta a/ })).toHaveCount(2)
  await expect(page.getByText("Le risposte restano qui finché non ricarichi la pagina. Per tenerne una, usa Copia.")).toBeVisible()
  await page.reload()
  await expect(page.getByLabel("La tua domanda")).toBeFocused()
  await expect(page.getByRole("region", { name: /^Risposta a/ })).toHaveCount(0)
})

test("a suggested question and a follow-up fill the field without sending, and Copia copies the answer", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  const { field } = await openAsk(page, "suggest")
  // No themes and no hypotheses in this Research: the starters.
  await page.getByRole("button", { name: "Cosa chiedono più spesso i clienti?" }).click()
  await expect(field).toHaveValue("Cosa chiedono più spesso i clienti?")
  await expect(field).toBeFocused()
  await expect(page.getByRole("region", { name: /^Risposta a/ })).toHaveCount(0)
  await page.keyboard.press("Enter")
  const answer = page.getByRole("region", { name: "Risposta a «Cosa chiedono più spesso i clienti?»" })
  await expect(answer).toBeVisible()

  await answer.getByRole("button", { name: "Copia" }).click()
  await expect(answer.getByRole("button", { name: "Copiata" })).toBeVisible()
  await expect(status(page)).toHaveText("Risposta copiata: domanda, risposta e citazioni con le fonti.")
  const copied = await page.evaluate(() => navigator.clipboard.readText())
  expect(copied).toContain("Domanda: Cosa chiedono più spesso i clienti?")
  expect(copied).toContain("1 feedback ne parla, su 1 letti.")
  expect(copied).toMatch(/- “Vorrei esportare il report mensile in PDF\.” \(Supporto, \d+ \w+\)/)

  await answer.getByRole("button", { name: "Cosa propongono?" }).click()
  await expect(field).toHaveValue("Su «Cosa chiedono più spesso i clienti?»: cosa propongono i clienti come soluzione?")
  await expect(field).toBeFocused()
  await expect(page.getByRole("region", { name: /^Risposta a/ })).toHaveCount(1)
})

test("the Chiedi tab without a session goes to /login", async ({ page }) => {
  await page.goto("/research/00000000-0000-4000-8000-000000000000/ask")
  await expect(page).toHaveURL(/\/login$/)
})

test("GET of the Chiedi tab with a forged next-action header still redirects to /login", async ({ request }) => {
  // The proxy skips its own redirect on the Chiedi tab when a server action is calling in without a
  // session, so the action can answer "session" itself (E8) instead of a bare redirect. That exception
  // must only apply to the POST a server action actually uses: a GET carrying the same header is a page
  // load, and must still be sent to /login rather than rendering the page and failing on RLS.
  const response = await request.get("/research/00000000-0000-4000-8000-000000000000/ask", {
    headers: { "next-action": "forged" },
    maxRedirects: 0,
  })
  expect(response.status()).toBe(307)
  expect(response.headers()["location"]).toMatch(/\/login$/)
})

// ===== One message per reason (AC 37): exact text, the question stays, the focus stays =====

const month = new Intl.DateTimeFormat("it-IT", { month: "long", timeZone: "Europe/Rome" }).format(new Date())
// The month after the current one, on the Italian calendar: when the quota comes back.
const nextMonth = () =>
  new Intl.DateTimeFormat("it-IT", { month: "long", timeZone: "Europe/Rome" }).format(
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 15)
  )

async function openAsk(page: import("@playwright/test").Page, label: string) {
  const user = await signedInUser(page, label)
  await insertFeedback(user, ["Vorrei esportare il report mensile in PDF."])
  await page.goto(`/research/${user.researchId}/ask`)
  const field = page.getByLabel("La tua domanda")
  await expect(field).toBeFocused()
  return { ...user, field }
}

async function addQuestions(workspaceId: string, count: number, status: "done" | "running" = "done") {
  const { error } = await admin.from("questions").insert(
    Array.from({ length: count }, () => ({
      workspace_id: workspaceId,
      status,
      outcome: status === "done" ? "answered" : null,
      feedback_considered: 1,
    }))
  )
  if (error) throw error
}

const status = (page: import("@playwright/test").Page) => page.getByRole("status")

test("E1: an empty question is not sent", async ({ page }) => {
  const { field } = await openAsk(page, "e1")
  await page.keyboard.type("   ")
  await page.keyboard.press("Enter")
  await expect(page.getByText("Scrivi una domanda prima di inviarla. Per esempio: cosa dicono i clienti dei prezzi?")).toBeVisible()
  await expect(field).toHaveAttribute("aria-invalid", "true")
  await expect(field).toHaveAttribute("aria-describedby", "ask-error")
  await expect(field).toBeFocused()
})

test("E2: over 300 characters, while typing and on Enter", async ({ page }) => {
  const { field } = await openAsk(page, "e2")
  await field.fill("a".repeat(301))
  const error = page.getByText("La domanda supera i 300 caratteri: accorciala a una sola richiesta.")
  await expect(error).toBeVisible()
  await expect(page.getByText("301 di 300")).toBeVisible()
  await page.keyboard.press("Enter")
  await expect(error).toBeVisible()
  await expect(field).toHaveValue("a".repeat(301))
  await expect(field).toBeFocused()
})

test("E3: Free quota used up from another tab", async ({ page }) => {
  const { workspaceId, field } = await openAsk(page, "e3")
  await addQuestions(workspaceId, 10)
  await page.keyboard.type("Cosa chiedono del PDF?")
  await page.keyboard.press("Enter")
  await expect(page.getByRole("heading", { name: `Hai usato le 10 domande di ${month}` })).toBeVisible()
  await expect(page.getByRole("link", { name: "Passa a Pro" })).toHaveAttribute("href", "/billing")
  // Accessibility: the status region announces the same notice a sighted user sees above the field.
  await expect(status(page)).toHaveText(
    `Hai usato le 10 domande di ${month}. Con Pro diventano 100 al mese. Altrimenti tornano disponibili il 1 ${nextMonth()}.`
  )
  await expect(field).toHaveValue("Cosa chiedono del PDF?")
  await expect(field).toBeFocused()
})

test("E4: Pro quota used up from another tab", async ({ page }) => {
  const { workspaceId, field } = await openAsk(page, "e4")
  await admin.from("subscriptions").update({ plan: "pro" }).eq("workspace_id", workspaceId)
  await addQuestions(workspaceId, 100)
  await page.keyboard.type("Cosa chiedono del PDF?")
  await page.keyboard.press("Enter")
  await expect(page.getByRole("heading", { name: `Hai usato le 100 domande di ${month}` })).toBeVisible()
  await expect(page.getByRole("link", { name: "Passa a Pro" })).toHaveCount(0)
  // Accessibility: the plan is read fresh from the server (this workspace was Free at page load).
  await expect(status(page)).toHaveText(`Hai usato le 100 domande di ${month}. Tornano disponibili il 1 ${nextMonth()}.`)
  await expect(field).toHaveValue("Cosa chiedono del PDF?")
  await expect(field).toBeFocused()
})

test("E5: another question is running", async ({ page }) => {
  const { workspaceId, field } = await openAsk(page, "e5")
  await addQuestions(workspaceId, 1, "running")
  await page.keyboard.type("Cosa chiedono del PDF?")
  await page.keyboard.press("Enter")
  await expect(status(page)).toHaveText(
    "C'è già una domanda in corso, forse da un'altra scheda. Aspetta qualche secondo e riprova."
  )
  await expect(field).toHaveValue("Cosa chiedono del PDF?")
  await expect(field).toBeFocused()
})

test("E6: the answer did not arrive, and the question counts", async ({ page }) => {
  const { field } = await openAsk(page, "e6")
  await page.keyboard.type("FUORI_SCHEMA sul PDF?")
  await page.keyboard.press("Enter")
  await expect(status(page)).toHaveText(
    `La risposta non è arrivata. La domanda conta lo stesso tra quelle del mese: ti restano 9 domande di ${month}. Riprova tra poco.`
  )
  await expect(field).toHaveValue("FUORI_SCHEMA sul PDF?")
  await expect(field).toBeFocused()
})

test("E6 while on another tab: back on Chiedi, the message and the question are there", async ({ page }) => {
  const { field } = await openAsk(page, "e6-away")
  // LENTA holds the answer for 20 seconds, FUORI_SCHEMA makes it fail.
  await page.keyboard.type("LENTA FUORI_SCHEMA sul PDF?")
  await page.keyboard.press("Enter")
  await expect(page.getByRole("region", { name: "Risposta in arrivo…" })).toBeVisible()
  await page.getByRole("link", { name: "Feedback", exact: true }).click()
  await expect(page).toHaveURL(/\/feedback$/)
  await page.waitForTimeout(22_000)
  await page.getByRole("link", { name: "Chiedi", exact: true }).click()
  await expect(status(page)).toHaveText(
    `La risposta non è arrivata. La domanda conta lo stesso tra quelle del mese: ti restano 9 domande di ${month}. Riprova tra poco.`
  )
  await expect(field).toHaveValue("LENTA FUORI_SCHEMA sul PDF?")
})

test("E7: the request does not reach Voce", async ({ page }) => {
  const { field } = await openAsk(page, "e7")
  await page.route("**/ask", (route) =>
    route.request().method() === "POST" ? route.abort("internetdisconnected") : route.continue()
  )
  await page.keyboard.type("Cosa chiedono del PDF?")
  await page.keyboard.press("Enter")
  await expect(status(page)).toHaveText(
    "Non riesco a raggiungere Voce: controlla la connessione e riprova. Se la domanda era già partita, conta tra quelle del mese."
  )
  await expect(field).toHaveValue("Cosa chiedono del PDF?")
  await expect(field).toBeFocused()
})

test("E8: the session expired", async ({ page, context }) => {
  const { field } = await openAsk(page, "e8")
  await context.clearCookies()
  await page.keyboard.type("Cosa chiedono del PDF?")
  await page.keyboard.press("Enter")
  await expect(status(page)).toContainText("La sessione è scaduta. Accedi di nuovo per fare la domanda.")
  await expect(status(page).getByRole("link", { name: "Accedi" })).toHaveAttribute("href", "/login")
  await expect(field).toHaveValue("Cosa chiedono del PDF?")
  await expect(field).toBeFocused()
})

test("E9: the feedback of the Research are gone", async ({ page }) => {
  const { workspaceId, researchId, field } = await openAsk(page, "e9")
  await admin.from("feedback").delete().eq("workspace_id", workspaceId)
  await page.keyboard.type("Cosa chiedono del PDF?")
  await page.keyboard.press("Enter")
  await expect(status(page)).toContainText("In questa Research non ci sono più feedback su cui rispondere.")
  await expect(status(page).getByRole("link", { name: "Aggiungi feedback" })).toHaveAttribute(
    "href",
    `/research/${researchId}/collect`
  )
  await expect(field).toHaveValue("Cosa chiedono del PDF?")
  await expect(field).toBeFocused()
})

// ===== The quota on screen (AC 34, 35, 39) =====

test("the quota note before and after the first question", async ({ page }) => {
  const { field } = await openAsk(page, "quota-note")
  await expect(page.getByText(`Userai 1 delle 10 domande di ${month}.`)).toBeVisible()
  await field.fill("Cosa chiedono del PDF?")
  await page.keyboard.press("Enter")
  await expect(page.getByRole("region", { name: /Risposta a/ })).toBeVisible()
  await expect(page.getByText(`Ti restano 9 domande di ${month}.`)).toBeVisible()
})

test("Free at 10 questions: notice and Passa a Pro, button off", async ({ page }) => {
  const user = await signedInUser(page, "free-full")
  await insertFeedback(user, ["Vorrei esportare il report mensile in PDF."])
  await addQuestions(user.workspaceId, 10)
  await page.goto(`/research/${user.researchId}/ask`)
  await expect(page.getByRole("heading", { name: `Hai usato le 10 domande di ${month}` })).toBeVisible()
  await expect(page.getByRole("link", { name: "Passa a Pro" })).toHaveAttribute("href", "/billing")
  await expect(page.getByRole("button", { name: "Chiedi a 1 feedback" })).toHaveAttribute("aria-disabled", "true")
  await expect(page.getByLabel("La tua domanda")).not.toBeFocused()
})

test("Pro at 100 questions: notice without button", async ({ page }) => {
  const user = await signedInUser(page, "pro-full")
  await admin.from("subscriptions").update({ plan: "pro" }).eq("workspace_id", user.workspaceId)
  await insertFeedback(user, ["Vorrei esportare il report mensile in PDF."])
  await addQuestions(user.workspaceId, 100)
  await page.goto(`/research/${user.researchId}/ask`)
  await expect(page.getByRole("heading", { name: `Hai usato le 100 domande di ${month}` })).toBeVisible()
  await expect(page.getByRole("link", { name: "Passa a Pro" })).toHaveCount(0)
  await expect(page.getByRole("button", { name: "Chiedi a 1 feedback" })).toHaveAttribute("aria-disabled", "true")
})

test("the tenth answer stays visible under the notice", async ({ page }) => {
  const { workspaceId, field } = await openAsk(page, "tenth")
  await addQuestions(workspaceId, 9)
  await page.reload()
  await expect(page.getByText(`Ti resta 1 domanda di ${month}.`)).toBeVisible()
  await field.fill("Cosa chiedono del PDF?")
  await page.keyboard.press("Enter")
  await expect(page.getByRole("region", { name: "Risposta a «Cosa chiedono del PDF?»" })).toBeVisible()
  await expect(page.getByRole("heading", { name: `Hai usato le 10 domande di ${month}` })).toBeVisible()
  await expect(page.getByRole("button", { name: "Chiedi a 1 feedback" })).toHaveAttribute("aria-disabled", "true")
})

test("billing and landing show the question quota", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByText("10 domande ai feedback al mese")).toBeVisible()
  await expect(page.getByText("100 domande ai feedback al mese")).toBeVisible()
  await signedInUser(page, "billing")
  await page.goto("/billing")
  await expect(page.getByText(/10 domande ai feedback al mese/)).toBeVisible()
  await expect(page.getByText(/100 domande ai feedback al mese/)).toBeVisible()
})

// ===== Nothing to ask (AC 33) =====

test("no feedback in the Research: text A and the way to its Raccolta, no field", async ({ page }) => {
  const user = await signedInUser(page, "empty-a")
  await page.goto(`/research/${user.researchId}/ask`)
  await expect(page.getByText("Qui farai domande ai tuoi feedback e leggerai le risposte con le parole dei clienti.")).toBeVisible()
  await expect(page.getByRole("link", { name: "Aggiungi feedback" })).toHaveAttribute(
    "href",
    `/research/${user.researchId}/collect`
  )
  await expect(page.getByLabel("La tua domanda")).toHaveCount(0)
})

test("feedback of any age can be asked: no 90-day window", async ({ page }) => {
  const user = await signedInUser(page, "old-feedback")
  await insertFeedback(user, ["Vecchio uno.", "Vecchio due."], 400)
  await page.goto(`/research/${user.researchId}/ask`)
  await expect(page.getByLabel("La tua domanda")).toBeFocused()
  await expect(page.getByRole("button", { name: "Chiedi ai 2 feedback" })).toBeVisible()
})

// ===== Waiting (AC 36) =====

test("waiting state and the 15-second message", async ({ page }) => {
  await page.clock.install()
  const { field } = await openAsk(page, "wait")
  await page.keyboard.type("LENTA sul PDF?")
  await page.keyboard.press("Enter")
  const button = page.getByRole("button", { name: "Risposta in arrivo…" })
  await expect(button).toHaveAttribute("aria-disabled", "true")
  await expect(field).toHaveAttribute("readonly", "")
  await expect(field).toBeFocused()
  await expect(status(page)).toHaveText("Sto leggendo 1 feedback…")
  // The question moves to the top of the page, with what Voce is doing.
  await expect(field).toHaveValue("")
  const working = page.getByRole("region", { name: "Risposta in arrivo…" })
  await expect(working.getByRole("heading", { name: "LENTA sul PDF?" })).toBeVisible()
  await expect(working.getByRole("listitem")).toHaveText([
    "Leggo l'unico feedback di questa Research",
    "Cerco quelli che rispondono alla domanda",
    "Controllo che ogni citazione sia scritta così dal cliente",
  ])
  await page.clock.runFor(15_000)
  await expect(status(page)).toHaveText("Ci vuole più del solito. La risposta arriva: resta su questa pagina.")
  await expect(working.getByText("Ci vuole più del solito. La risposta arriva: resta su questa pagina.")).toBeVisible()
  await expect(field).toBeFocused()
  // The fake Anthropic API answers after 20 real seconds.
  await expect(page.getByRole("region", { name: "Risposta a «LENTA sul PDF?»" })).toBeVisible({ timeout: 30_000 })
})

test("two quick submits make one model call", async ({ page, request }) => {
  const { field } = await openAsk(page, "double")
  // A marker unique to this test run, so GET /calls only counts prompts this test sent: with the
  // LENTA marker the fake Anthropic API holds its answer for 20 real seconds, so both submits below land
  // while the first question is still in flight (a fast reply would make the second submit, once
  // the button is enabled again, a legitimate second question rather than a doubled one).
  const marker = `LENTA-DOPPIO-${crypto.randomUUID().slice(0, 8)}`
  const question = `${marker} sul PDF?`
  await field.fill(question)
  await page.keyboard.press("Enter")
  await page.keyboard.press("Enter")
  await expect(page.getByRole("region", { name: `Risposta a «${question}»` })).toBeVisible({ timeout: 30_000 })
  const calls = await request.get(`http://127.0.0.1:${FAKE_ANTHROPIC_PORT}/calls?marker=${marker}`)
  expect((await calls.json()).count).toBe(1)
})
