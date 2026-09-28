import { expect, test } from "@playwright/test"

// The password field of the login and sign-up forms: show and hide, Caps Lock, errors on the field.

test("the eye button shows and hides the password without leaving the field or submitting", async ({ page }) => {
  await page.goto("/login")
  const password = page.getByLabel("Password", { exact: true })
  await password.fill("segreto-123")

  const show = page.getByRole("button", { name: "Mostra password" })
  await expect(show).toHaveAttribute("aria-pressed", "false")
  await password.focus()
  await show.click()
  await expect(password).toHaveAttribute("type", "text")
  await expect(password).toBeFocused()
  const hide = page.getByRole("button", { name: "Nascondi password" })
  await expect(hide).toHaveAttribute("aria-pressed", "true")
  await expect(page).toHaveURL(/\/login$/)

  // From the keyboard the button keeps its own focus, and Space toggles it back.
  await hide.focus()
  await page.keyboard.press("Space")
  await expect(password).toHaveAttribute("type", "password")
  await expect(page.getByRole("button", { name: "Mostra password" })).toBeFocused()
  await expect(page).toHaveURL(/\/login$/)
})

test("typing with Caps Lock on says so", async ({ page }) => {
  await page.goto("/signup")
  const password = page.getByLabel("Password", { exact: true })
  await password.focus()
  // Headless Chromium does not turn Caps Lock on from a key press: the key event carries the state.
  const typeWithCapsLock = (on: boolean) =>
    password.evaluate((input, on) => {
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true, modifierCapsLock: on } as KeyboardEventInit))
    }, on)
  const warning = page.getByText("Bloc Maiusc è attivo.")
  await typeWithCapsLock(true)
  await expect(warning).toBeVisible()
  await expect(password).toHaveAttribute("aria-describedby", "password-hint password-caps")
  await typeWithCapsLock(false)
  await expect(warning).toBeHidden()
})

test("a double click signs in once, and a wrong sign-in is announced", async ({ page }) => {
  await page.goto("/login")
  await page.getByLabel("Email").fill(`nessuno-${crypto.randomUUID().slice(0, 8)}@test.voce`)
  await page.getByLabel("Password", { exact: true }).fill("password-sbagliata")
  let calls = 0
  page.on("request", (request) => {
    if (request.method() === "POST" && request.headers()["next-action"]) calls++
  })
  const submit = page.getByRole("button", { name: "Accedi" })
  await submit.dblclick()
  await expect(page.getByRole("alert").filter({ hasText: "Email o password non corretti." })).toBeVisible()
  await expect(submit).toBeEnabled()
  expect(calls).toBe(1)
})

test("a sign-up error sits under its field, which takes the focus", async ({ page }) => {
  await page.goto("/signup")
  await page.getByLabel("Nome del prodotto").fill("   ")
  await page.getByLabel("Email").fill(`nuovo-${crypto.randomUUID().slice(0, 8)}@test.voce`)
  await page.getByLabel("Password", { exact: true }).fill("password-e2e-voce")
  await page.getByRole("button", { name: "Crea il workspace" }).click()
  const workspace = page.getByLabel("Nome del prodotto")
  await expect(workspace).toHaveAttribute("aria-invalid", "true")
  await expect(workspace).toHaveAttribute("aria-describedby", "workspace-hint workspace-error")
  await expect(page.locator("#workspace-error")).toHaveText("Scrivi il nome del prodotto, al massimo 60 caratteri.")
  await expect(workspace).toBeFocused()
})
