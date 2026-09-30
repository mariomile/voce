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

// The keyboard goes through the app bar in the order it reads, left to right and top to bottom.
for (const width of [390, 1440])
  test(`the app bar's focus order follows its layout at ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await signedInUser(page, `bar-order-${width}`)
    const order = await page.getByRole("banner").evaluate((bar) => {
      const items = [...bar.querySelectorAll<HTMLElement>("a, button")].map((el) => {
        const box = el.getBoundingClientRect()
        return { name: el.textContent?.trim() ?? "", top: Math.round(box.top), left: Math.round(box.left) }
      })
      // Rows first: items whose tops are within 12 px sit on the same row.
      const visual = [...items].sort((a, b) => (Math.abs(a.top - b.top) > 12 ? a.top - b.top : a.left - b.left))
      return { dom: items.map((i) => i.name), visual: visual.map((i) => i.name) }
    })
    expect(order.dom).toEqual(order.visual)
  })

// Text actions are about 21 px tall: on a touch screen an invisible layer makes each one 44 px tall to the finger.
test("on a phone the text actions take a tap 10 px above or below their text", async ({ page }) => {
  const user = await signedInUser(page, "phone-taps")
  await page.goto(`/research/${user.researchId}/collect`)
  const bar = page.getByRole("banner")
  for (const action of [
    bar.getByRole("button", { name: "Esci" }),
    bar.getByRole("button", { name: "English" }),
    page.getByRole("link", { name: "Tutte le Research" }),
    page.getByRole("button", { name: "Elimina la Research" }),
  ]) {
    const hits = await action.evaluate((el) => {
      el.scrollIntoView({ block: "center" })
      const box = el.getBoundingClientRect()
      const x = box.left + box.width / 2
      return [box.top - 10, box.bottom + 10].map((y) => el.contains(document.elementFromPoint(x, y)))
    })
    expect(hits, await action.textContent() ?? "").toEqual([true, true])
  }
})

// A feedback with a long unbroken string (a pasted link) and the Elimina at the table's edge: on a phone the
// feedback table does not scroll sideways.
test("on a phone the feedback table does not scroll sideways", async ({ page }) => {
  const user = await signedInUser(page, "phone-table")
  await insertFeedback(user, [`Il link esempio.it/?id=${"FATTURA".repeat(20)} non si apre.`])
  await page.goto(`/research/${user.researchId}/feedback`)
  const table = page.locator('[data-slot="table-container"]')
  await expect(table.getByRole("button", { name: "Elimina" })).toBeVisible()
  expect(await table.evaluate((el) => el.scrollWidth - el.clientWidth)).toBe(0)
})
