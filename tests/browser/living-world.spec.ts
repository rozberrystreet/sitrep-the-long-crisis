import { expect, test, type Page } from '@playwright/test'

async function startLiving(page: Page) {
  await page.goto('/')
  await page.getByRole('combobox', { name: 'Campaign edition' }).selectOption('living')
  await expect(page.getByText('14 daily dispatches')).toBeVisible()
  await page.getByRole('textbox', { name: 'Call sign', exact: true }).fill('Wren')
  await page.getByRole('button', { name: 'Open first dispatch' }).press('Enter')
  await expect(page.getByRole('heading', { name: 'A second stamp at the narrows.' })).toBeFocused()
}

test('a household follows a price back to its source and completes fourteen days offline', async ({
  page,
  context,
}) => {
  await startLiving(page)
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true))
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true)
  await context.setOffline(true)
  for (let day = 1; day <= 14; day++) {
    await expect(
      page.getByText('Daily SITREP · Day ' + day + ' of 14', { exact: true })
    ).toBeVisible()
    if (day === 3) {
      await page.getByText('Morning transactions', { exact: true }).click()
      await expect(page.getByText(/Six prepaid portions arrived at the door/)).toBeVisible()
    }
    if (day === 13)
      await expect(page.getByRole('button', { name: /Reserve a crate/ })).toBeDisabled()
    await page
      .getByRole('button', { name: day === 1 ? /Reserve a crate/ : /Take a recovery day/ })
      .click()
    await expect(page.getByRole('heading', { name: 'Household ledger' })).toBeVisible()
    if (day === 1) {
      await expect(page.getByText('Day 3 · Reserved crate')).toBeVisible()
      await page.reload()
      await expect(page.getByRole('heading', { name: 'Reserve a crate.' })).toBeVisible()
      await page.getByRole('button', { name: /Trace change: Paid for a future crate/ }).click()
      await expect(page.getByRole('heading', { name: 'Where this came from' })).toBeFocused()
      await page.getByRole('button', { name: /Day 1 · Melbourne shops price/ }).click()
      await page.getByRole('button', { name: /Day 1 · Melbourne depot stock/ }).click()
      await page.getByRole('button', { name: /Day 1 · Melbourne route adjustment/ }).click()
      await expect(
        page.getByRole('button', { name: /Strait Customs Board · A second stamp/ })
      ).toBeVisible()
      await page.getByRole('button', { name: 'Return to ledger' }).click()
      await expect(
        page.getByRole('button', { name: /Trace change: Paid for a future crate/ })
      ).toBeFocused()
    }
    await page
      .getByRole('button', { name: day === 14 ? 'Read campaign review' : 'Open next dispatch' })
      .click()
  }
  const closing = page.getByRole('heading', { name: 'Fourteen days at the strait.' })
  await expect(closing).toBeVisible()
  await page.reload()
  await expect(closing).toBeVisible()
  const archive = page
    .locator('details')
    .filter({ has: page.getByText('Day 1 · Reserve a crate', { exact: true }) })
  await archive.locator('summary').click()
  await expect(
    archive.getByRole('button', { name: /Trace change: Paid for a future crate/ })
  ).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
test('stale v2 tabs recover the committed choice and corrupt v2 saves require explicit replacement', async ({
  page,
  context,
}) => {
  await startLiving(page)
  const other = await context.newPage()
  await other.goto('/')
  await expect(other.getByRole('heading', { name: 'Your next move' })).toBeVisible()
  await page.getByRole('button', { name: /Join the food rota/ }).click()
  await expect(page.getByRole('heading', { name: 'Household ledger' })).toBeVisible()
  await other.getByRole('button', { name: /Reserve a crate/ }).click()
  await expect(other.getByRole('alert')).toContainText('Another tab changed')
  await other.getByRole('button', { name: 'Reload saved issue' }).click()
  await expect(other.getByRole('heading', { name: 'Join the food rota.' })).toBeVisible()
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('sitrep-issues', 1)
        request.onsuccess = () => {
          const db = request.result
          const tx = db.transaction('desk', 'readwrite')
          const store = tx.objectStore('desk')
          const get = store.get('current')
          get.onsuccess = () =>
            store.put(JSON.stringify({ ...JSON.parse(get.result), revision: 999 }), 'current')
          tx.oncomplete = () => {
            db.close()
            resolve()
          }
          tx.onerror = () => reject(tx.error)
        }
        request.onerror = () => reject(request.error)
      })
  )
  await page.reload()
  await expect(page.getByRole('alert')).toContainText('could not be read')
  await page.getByRole('button', { name: 'Replace saved issue' }).click()
  await expect(page.getByRole('combobox', { name: 'Campaign edition' })).toHaveValue('legacy')
})
