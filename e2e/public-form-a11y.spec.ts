import { expect, test } from "@playwright/test"
import { admin, createResearch } from "./helpers"

// The public form with a screen reader or a keyboard: every state sits in a main landmark, and after
// sending, the focus moves to the thank-you heading instead of falling back to the top of the page.
test("the public form has a main landmark and focuses the thank-you after sending", async ({ page }) => {
  const { data, error } = await admin.auth.admin.createUser({
    email: `e2e-form-a11y-${crypto.randomUUID().slice(0, 8)}@test.voce`,
    password: "password-e2e-voce",
    email_confirm: true,
    user_metadata: { workspace_name: "Prova modulo" },
  })
  if (error) throw error
  const { data: member } = await admin.from("workspace_members").select("workspace_id").eq("user_id", data.user.id).single()
  const { formSlug } = await createResearch(member!.workspace_id as string, "form-a11y")

  await page.goto(`/f/${formSlug}`)
  await expect(page.getByRole("main")).toBeVisible()
  await page.getByLabel("Il tuo feedback").fill("Il PDF delle fatture ci mette un minuto.")
  await page.getByRole("button", { name: "Invia" }).click()

  const thanks = page.getByRole("heading", { name: "Ricevuto. Grazie." })
  await expect(thanks).toBeFocused()
  await expect(page.getByRole("main")).toBeVisible()
})
