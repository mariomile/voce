import { expect, test } from "@playwright/test"
import { admin, signedInUser } from "./helpers"

// English is the second language. It comes from the browser on the first visit, then from the IT/EN
// switch, which is remembered. Italian stays the default. The public form is always Italian.

test.describe("an English browser", () => {
  test.use({ locale: "en-US" })

  test("gets the landing page and the login in English", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("html")).toHaveAttribute("lang", "en")
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("The loudest customer doesn't set the roadmap.")
    await expect(page.getByText("Access is closed for now.").first()).toBeVisible()
    await expect(page.getByRole("link", { name: "Request access" }).first()).toHaveAttribute(
      "href",
      "mailto:mario@buildrs.xyz?subject=Voce",
    )

    // Access is closed: the landing no longer links the login, which stays at its address.
    await page.goto("/login")
    await expect(page).toHaveTitle("Log in to Voce")
    await expect(page.getByRole("heading", { name: "Log in to Voce" })).toBeVisible()
    await page.getByLabel("Email").fill("nobody@test.voce")
    await page.getByLabel("Password", { exact: true }).fill("wrong-password")
    await page.getByRole("button", { name: "Log in" }).click()
    await expect(page.getByRole("alert").filter({ hasText: "Wrong email or password." })).toBeVisible()
  })

  test("switches to Italian from the footer and keeps it", async ({ page }) => {
    await page.goto("/")
    const switcher = page.getByRole("group", { name: "Language" })
    await expect(switcher.getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "true")
    await switcher.getByRole("button", { name: "Italiano" }).click()
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Chi si lamenta più forte non decide la roadmap.")
    await expect(page.locator("html")).toHaveAttribute("lang", "it")

    await page.goto("/login")
    await expect(page.getByRole("heading", { name: "Accedi a Voce" })).toBeVisible()
  })
})

test.describe("an Italian browser", () => {
  test("gets Italian, and English after the switch", async ({ page, context }) => {
    await page.goto("/")
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Chi si lamenta più forte non decide la roadmap.")
    await page.getByRole("group", { name: "Lingua" }).getByRole("button", { name: "English" }).click()
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("The loudest customer doesn't set the roadmap.")
    expect((await context.cookies()).find((c) => c.name === "NEXT_LOCALE")?.value).toBe("en")

    await page.reload()
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("The loudest customer doesn't set the roadmap.")
  })
})

test("/f/phc26 stays in Italian for an English browser that chose English", async ({ page, browser, baseURL }) => {
  // The masterclass form: a Research answering at /f/phc26 (claimed for the test when no one has it).
  const { data: existing } = await admin.from("research").select("id").eq("form_slug", "phc26").maybeSingle()
  let claimed: { id: string; slug: string } | null = null
  if (!existing) {
    const { researchId, formSlug } = await signedInUser(page, "phc26")
    claimed = { id: researchId, slug: formSlug }
    const update = await admin.from("research").update({ form_slug: "phc26", form_question: null }).eq("id", researchId)
    if (update.error) throw update.error
  }
  try {
    const english = await browser.newContext({ locale: "en-US", baseURL })
    await english.addCookies([{ name: "NEXT_LOCALE", value: "en", url: baseURL! }])
    const phone = await english.newPage()
    await phone.goto("/f/phc26")
    await expect(phone.locator("html")).toHaveAttribute("lang", "it")
    await expect(phone.getByText("Raccolto con Voce", { exact: false }).first()).toBeVisible()
    if (claimed) {
      await expect(phone.getByRole("heading", { name: /^Cosa vuoi dire al team di / })).toBeVisible()
      // Validation, submission and the success state stay Italian too.
      await phone.getByLabel("Il tuo feedback").fill("Il report in PDF mi serve ogni mese.")
      await phone.getByRole("button", { name: "Vuoi essere ricontattato? Lascia la tua email" }).click()
      await phone.getByLabel(/^Email/).fill("non-una-email")
      await phone.getByRole("button", { name: "Invia" }).click()
      await expect(phone.getByText("Questa email sembra incompleta. Correggila o lasciala vuota.")).toBeVisible()
      await phone.getByLabel(/^Email/).fill("")
      await phone.getByRole("button", { name: "Invia" }).click()
      await expect(phone.getByText("Ricevuto. Grazie.")).toBeVisible()
      // The response lands in the Research that owns the slug.
      const { data } = await admin.from("feedback").select("channel").eq("research_id", claimed.id)
      expect(data).toEqual([{ channel: "Modulo pubblico" }])
    }
    await english.close()

    // The rest of the app keeps following the browser.
    const other = await browser.newContext({ locale: "en-US", baseURL })
    const landing = await other.newPage()
    await landing.goto("/")
    await expect(landing.locator("html")).toHaveAttribute("lang", "en")
    await other.close()
  } finally {
    if (claimed) await admin.from("research").update({ form_slug: claimed.slug }).eq("id", claimed.id)
  }
})

test("the form shows the Research form question, or the default when null", async ({ page, browser, baseURL }) => {
  const { researchId, formSlug } = await signedInUser(page, "domanda-modulo")
  const english = await browser.newContext({ locale: "en-US", baseURL })
  await english.addCookies([{ name: "NEXT_LOCALE", value: "en", url: baseURL! }])
  const phone = await english.newPage()
  await phone.goto(`/f/${formSlug}`)
  await expect(phone.getByRole("heading", { name: "Cosa vuoi dire al team di Prova domanda-modulo?" })).toBeVisible()
  await admin.from("research").update({ form_question: "Come usi il report in PDF?" }).eq("id", researchId)
  await phone.reload()
  await expect(phone.getByRole("heading", { name: "Come usi il report in PDF?" })).toBeVisible()
  await expect(phone.locator("html")).toHaveAttribute("lang", "it")
  await english.close()
})
