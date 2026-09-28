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
    await expect(page.getByText("Free up to 100 feedback. No card needed.").first()).toBeVisible()

    await page.getByRole("link", { name: "Log in" }).click()
    await expect(page).toHaveURL(/\/login$/)
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
  // The masterclass form: a workspace answering at /f/phc26 (claimed for the test when no one has it).
  const { data: existing } = await admin.from("workspaces").select("id").eq("form_slug", "phc26").maybeSingle()
  let claimed: { id: string; slug: string } | null = null
  if (!existing) {
    const { workspaceId } = await signedInUser(page, "phc26")
    const { data, error } = await admin.from("workspaces").select("form_slug").eq("id", workspaceId).single()
    if (error) throw error
    claimed = { id: workspaceId, slug: data.form_slug as string }
    const update = await admin.from("workspaces").update({ form_slug: "phc26", form_question: null }).eq("id", workspaceId)
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
      await phone.getByLabel(/^Email/).fill("non-una-email")
      await phone.getByRole("button", { name: "Invia" }).click()
      await expect(phone.getByText("Questa email sembra incompleta. Correggila o lasciala vuota.")).toBeVisible()
      await phone.getByLabel(/^Email/).fill("")
      await phone.getByRole("button", { name: "Invia" }).click()
      await expect(phone.getByText("Ricevuto. Grazie.")).toBeVisible()
    }
    await english.close()

    // The rest of the app keeps following the browser.
    const other = await browser.newContext({ locale: "en-US", baseURL })
    const landing = await other.newPage()
    await landing.goto("/")
    await expect(landing.locator("html")).toHaveAttribute("lang", "en")
    await other.close()
  } finally {
    if (claimed) await admin.from("workspaces").update({ form_slug: claimed.slug }).eq("id", claimed.id)
  }
})
