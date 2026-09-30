import { expect, test, type Page } from "@playwright/test"
import { admin, createResearch } from "./helpers"

// The public form on a phone, as the room of a masterclass opens it from the QR code. Runs in Chromium and, in
// the webkit-iphone project, in WebKit with an iPhone profile. Headless browsers show no keyboard: an open
// keyboard is a window shrunk to 390x400, the height left above an iPhone keyboard, with the focused field
// brought to the middle of it, as iOS Safari and Chrome for Android do when the keyboard opens.
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

const KEYBOARD_OPEN = { width: 390, height: 400 }

async function openKeyboard(page: Page) {
  await page.setViewportSize(KEYBOARD_OPEN)
  await page.evaluate(() => document.activeElement?.scrollIntoView({ block: "center" }))
}

async function openForm(page: Page, label: string) {
  const { data, error } = await admin.auth.admin.createUser({
    email: `e2e-${label}-${crypto.randomUUID().slice(0, 8)}@test.voce`,
    password: "password-e2e-voce",
    email_confirm: true,
    user_metadata: { workspace_name: "Prova telefono" },
  })
  if (error) throw error
  const { data: member } = await admin.from("workspace_members").select("workspace_id").eq("user_id", data.user.id).single()
  const research = await createResearch(member!.workspace_id as string, label)
  await page.goto(`/f/${research.formSlug}`)
  return research
}

async function feedbackOf(researchId: string) {
  const { data } = await admin.from("feedback").select("text, email").eq("research_id", researchId)
  return data
}

test("with the keyboard open, Invia stays in sight under the text and Return makes a new line", async ({ page }) => {
  const { researchId } = await openForm(page, "form-phone")
  const text = page.getByLabel("Il tuo feedback")
  const send = page.getByRole("button", { name: "Invia" })

  await text.tap()
  await openKeyboard(page)
  await expect(send).toBeInViewport({ ratio: 1 })

  // One focus line, not the ring on top of the field's own line.
  await expect(text).toHaveCSS("outline-style", "none")
  await expect(text).toHaveCSS("border-bottom-color", "rgb(30, 33, 39)")
  // 16 px or more: iOS does not zoom the page when the field is tapped.
  expect(parseFloat(await text.evaluate((el) => getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16)

  await page.keyboard.type("Il PDF delle fatture non si apre")
  await page.keyboard.press("Enter")
  await page.keyboard.type("e devo passare al computer.")
  await expect(text).toHaveValue("Il PDF delle fatture non si apre\ne devo passare al computer.")
  expect(await feedbackOf(researchId)).toEqual([])
  await expect(send).toBeInViewport({ ratio: 1 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(KEYBOARD_OPEN.width)

  await send.tap()
  await expect(page.getByRole("heading", { name: "Ricevuto. Grazie." })).toBeFocused()
  expect(await feedbackOf(researchId)).toEqual([
    { text: "Il PDF delle fatture non si apre\ne devo passare al computer.", email: null },
  ])

  // Another one: the empty field takes the focus, ready for the keyboard.
  await page.getByRole("button", { name: "Scrivi un altro feedback" }).tap()
  await expect(text).toBeFocused()
  await expect(text).toHaveValue("")
})

test("the email opens on request and the keyboard's send key sends", async ({ page }) => {
  const { researchId } = await openForm(page, "form-email")
  await page.getByLabel("Il tuo feedback").fill("Vorrei l'export in Excel.")
  await expect(page.getByLabel(/^Email/)).toHaveCount(0)

  await page.getByRole("button", { name: "Vuoi essere ricontattato? Lascia la tua email" }).tap()
  const email = page.getByLabel(/^Email/)
  await expect(email).toBeFocused()
  await expect(email).toHaveAttribute("inputmode", "email")
  await expect(email).toHaveAttribute("autocapitalize", "none")
  await expect(email).toHaveAttribute("enterkeyhint", "send")

  await page.keyboard.type("anna@esempio.it")
  await page.keyboard.press("Enter")
  await expect(page.getByRole("heading", { name: "Ricevuto. Grazie." })).toBeVisible()
  expect(await feedbackOf(researchId)).toEqual([{ text: "Vorrei l'export in Excel.", email: "anna@esempio.it" }])
})

test("when the connection drops, the text stays and sending again works, once", async ({ page }) => {
  const { researchId } = await openForm(page, "form-offline")
  const text = page.getByLabel("Il tuo feedback")
  await text.fill("Il Wi-Fi della sala è lento.")

  // The server action is a POST to the page: it fails as it would with no network.
  const offline = (url: URL) => url.pathname.startsWith("/f/")
  await page.route(offline, (route) => (route.request().method() === "POST" ? route.abort("internetdisconnected") : route.continue()))
  await page.getByRole("button", { name: "Invia" }).tap()
  await expect(page.locator("form").getByRole("alert")).toHaveText(
    "Non è partito: la connessione non risponde. Il testo è ancora qui, riprova."
  )
  await expect(text).toHaveValue("Il Wi-Fi della sala è lento.")
  expect(await feedbackOf(researchId)).toEqual([])

  await page.unroute(offline)
  await page.getByRole("button", { name: "Invia" }).tap()
  await expect(page.getByRole("heading", { name: "Ricevuto. Grazie." })).toBeVisible()
  expect(await feedbackOf(researchId)).toEqual([{ text: "Il Wi-Fi della sala è lento.", email: null }])
})
