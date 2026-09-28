import { expect, test } from "@playwright/test"
import { admin, signedInUser } from "./helpers"

// English is the second language. It comes from the browser on the first visit, then from the IT/EN
// switch, which is remembered. Italian stays the default. The public form follows the browser only.

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

test("the public form follows the respondent's browser, not the switch", async ({ page, browser, baseURL }) => {
  const { workspaceId } = await signedInUser(page, "form-lang")
  const { data, error } = await admin.from("workspaces").select("form_slug").eq("id", workspaceId).single()
  if (error) throw error
  const slug = data.form_slug as string

  // An Italian browser that chose English in the switch on this device still gets the form in Italian.
  const italian = await browser.newContext({ locale: "it-IT", baseURL })
  await italian.addCookies([{ name: "NEXT_LOCALE", value: "en", url: baseURL! }])
  const phone = await italian.newPage()
  await phone.goto(`/f/${slug}`)
  await expect(phone.locator("html")).toHaveAttribute("lang", "it")
  await italian.close()

  const english = await browser.newContext({ locale: "en-GB", baseURL })
  const other = await english.newPage()
  await other.goto(`/f/${slug}`)
  await expect(other.locator("html")).toHaveAttribute("lang", "en")
  await english.close()
})
