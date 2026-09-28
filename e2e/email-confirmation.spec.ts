import { expect, test, type Page } from "@playwright/test"
import { defaultTemplateLink } from "./helpers"

// The confirmation link of Supabase's default email template, the one production sends today.

async function signUp(page: Page) {
  const email = `e2e-confirm-${crypto.randomUUID().slice(0, 8)}@test.voce`
  await page.goto("/signup")
  await page.getByLabel("Nome del prodotto").fill("Prova conferma")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password", { exact: true }).fill("password-e2e-voce")
  await page.getByRole("button", { name: "Crea il workspace" }).click()
  await expect(page.getByText("Controlla la tua email")).toBeVisible()
  return email
}

test("the default template link lands the user signed in on the Research", async ({ page }) => {
  const email = await signUp(page)
  await page.goto(await defaultTemplateLink(email))
  await expect(page).toHaveURL(/\/research$/)
})

test("opened in another browser, the link confirms the email and asks to sign in", async ({ page, browser }) => {
  const email = await signUp(page)
  const other = await browser.newContext()
  const otherPage = await other.newPage()
  await otherPage.goto(await defaultTemplateLink(email))
  await expect(otherPage).toHaveURL(/\/login\?confirmed=1$/)
  await expect(otherPage.getByRole("status")).toHaveText("Email confermata. Accedi per entrare nel tuo workspace.")
  await otherPage.getByLabel("Email").fill(email)
  await otherPage.getByLabel("Password", { exact: true }).fill("password-e2e-voce")
  await otherPage.getByRole("button", { name: "Accedi" }).click()
  await expect(otherPage).toHaveURL(/\/research$/)
  await other.close()
})
