import { expect, test } from "@playwright/test"
import { admin, insertFeedback, signedInUser } from "./helpers"

// The Report tab: from a Research without a synthesis to a report written by the fake model, copied and printed,
// and the note when the Research changes after it.

test("the Report tab leads to the Sintesi first, then writes a report that counts as 1 analysis", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  const user = await signedInUser(page, "report")
  await insertFeedback(user, ["Vorrei il report in PDF.", "Mi serve il PDF del report."])
  const { error } = await admin
    .from("research_hypotheses")
    .insert({ workspace_id: user.workspaceId, research_id: user.researchId, text: "Chi scrive vuole il PDF" })
  if (error) throw error

  // No synthesis yet: the tab says where the report comes from and leads to the Sintesi.
  await page.goto(`/research/${user.researchId}/report`)
  await expect(page.getByRole("navigation", { name: "Sezioni della Research" }).getByRole("link", { name: "Report" })).toHaveAttribute(
    "aria-current",
    "page"
  )
  await expect(page.getByText("Il report parte dalla sintesi.")).toBeVisible()
  await page.getByRole("link", { name: "Vai alla Sintesi" }).click()
  await page.getByRole("button", { name: "Analizza 2 feedback" }).click()
  await expect(page.getByRole("status").filter({ hasText: "Analisi finita: 1 tema." })).toBeVisible()

  // With a synthesis: one click writes the report; the button keeps the focus and announces it.
  await page.goto(`/research/${user.researchId}/report`)
  await expect(page.getByText("Dalla sintesi del")).toContainText("2 feedback letti, 1 tema, 1 ipotesi.")
  const generate = page.getByRole("button", { name: "Genera il report" })
  await generate.focus()
  await page.keyboard.press("Enter")
  await expect(page.getByRole("status").filter({ hasText: "Report pronto." })).toBeVisible()
  await expect(page.getByRole("button", { name: "Rigenera" })).toBeFocused()

  const report = page.locator("[data-report]")
  for (const title of ["In breve", "Cosa abbiamo trovato", "Ipotesi e verdetti", "Cosa non sappiamo", "Cosa decidere adesso"])
    await expect(report.getByRole("heading", { name: title })).toBeVisible()
  // The numbers are the server's: 2 feedback in the theme, out of 2 read; the verdict counts of the synthesis.
  await expect(report).toContainText("Il tema più grande raccoglie 2 feedback su 2.")
  await expect(report).toContainText("1 a favore · 0 contro · su 2 letti")
  await expect(report.locator("mark").first()).toHaveText("Vorrei il report in PDF.")
  await expect(report).toContainText("Chi ha scritto ha scelto di farlo")

  const { data: analyses } = await admin.from("analyses").select("kind, status").eq("workspace_id", user.workspaceId)
  expect(analyses!.map((a) => `${a.kind} ${a.status}`).sort()).toEqual(["report done", "themes done", "verdict done"])
  await expect(page.getByRole("banner").first()).toContainText("3 di 3")

  // Copia come testo: the memo as markdown.
  await page.getByRole("button", { name: "Copia come testo" }).click()
  await expect(page.getByRole("status").filter({ hasText: "Report copiato" })).toBeVisible()
  const copied = await page.evaluate(() => navigator.clipboard.readText())
  expect(copied).toContain("# Report: Domanda di report?")
  expect(copied).toContain("## Cosa decidere adesso")

  // Printed: only the document, no app bar, no tabs, no buttons; the question as its title.
  await page.emulateMedia({ media: "print" })
  await expect(page.getByRole("navigation", { name: "Sezioni della Research" })).toBeHidden()
  await expect(page.getByRole("button", { name: "Rigenera" })).toBeHidden()
  await expect(report.getByRole("heading", { level: 1 })).toHaveText("Domanda di report?")
  await page.emulateMedia({ media: "screen" })

  // A feedback after the report: the tab says so and points to the Sintesi.
  await insertFeedback(user, ["Il PDF lo vorrei anche per le fatture."])
  await page.reload()
  await expect(page.getByText("La Research è cambiata dopo questo report.")).toBeVisible()
  await expect(page.getByText("1 feedback arrivato dopo il report")).toBeVisible()
})
