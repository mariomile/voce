import { expect, test, type Page } from "@playwright/test"
import { insertFeedback, signedInUser } from "./helpers"

// A phone, 390 px wide: the app bar fits and signs out, and no page of the app runs off the screen.
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

// Visible text and controls that end past the phone's right edge. A table scrolls sideways in its own box.
// Measured against 390 px, not innerWidth: a mobile browser widens its layout viewport to fit what overflows.
function offScreen(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll("a, button, input, textarea, h1, h2, h3, p, img, svg, canvas")]
      .filter((el) => !el.closest('[data-slot="table-container"]'))
      .filter((el) => {
        const box = el.getBoundingClientRect()
        return box.width > 0 && box.height > 0 && box.right > 391
      })
      .map((el) => `${el.tagName} "${(el.textContent ?? "").trim().slice(0, 30)}"`)
  )
}

test("on a phone the app bar fits the screen and signs out", async ({ page }) => {
  await signedInUser(page, "phone")
  const bar = page.getByRole("banner")
  for (const item of [
    bar.getByRole("link", { name: "Research" }),
    bar.getByRole("link", { name: "Piano" }),
    bar.getByText("Free", { exact: true }),
    bar.getByRole("group", { name: "Lingua" }),
    bar.getByRole("button", { name: "Esci" }),
  ])
    await expect(item).toBeInViewport({ ratio: 1 })

  await bar.getByRole("button", { name: "Esci" }).tap()
  await expect(page).toHaveURL(/\/login$/)
})

test("on a phone no page of the app runs off the screen", async ({ page }) => {
  const user = await signedInUser(page, "phone-pages")
  await insertFeedback(user, [
    "Il collegamento con la banca si interrompe ogni lunedì e devo rifarlo da capo.",
    "Vorrei esportare le fatture in Excel per il commercialista.",
  ])
  const research = `/research/${user.researchId}`
  for (const path of ["/research", "/research/new", research, `${research}/ask`, `${research}/feedback`, `${research}/collect`, "/billing", `${research}/sala`]) {
    await page.goto(path)
    await expect(page.locator("h1").first()).toBeVisible()
    expect(await offScreen(page), path).toEqual([])
  }
})
