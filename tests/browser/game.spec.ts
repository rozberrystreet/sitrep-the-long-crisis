import { test, expect, type Page } from '@playwright/test'

async function start(page: Page) {
  await page.goto('/')
  await page.getByRole('textbox', { name: 'Call sign', exact: true }).fill('Wren')
  await page.getByRole('combobox', { name: 'Home city', exact: true }).selectOption('Auckland')
  const household = page.getByRole('combobox', { name: 'Household', exact: true })
  await household.selectOption({ label: 'With dependants' })
  await expect(household).toHaveValue('With dependants')
  await page.getByRole('button', { name: 'Open first dispatch' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'A queue forms at the narrows.' })).toBeFocused()
}
test('onboard, file a week, restore the closing edition and replay', async ({ page }) => {
  await start(page)
  await expect(page.getByText(/In Auckland, New Zealand/)).toContainText('3 portions')
  await expect(page.getByText('Fictional simulation', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  for (let day = 1; day <= 7; day++) {
    await page.getByRole('button', { name: /Share a delivery/ }).click()
    await expect(page.getByRole('heading', { name: 'What changed' })).toBeVisible()
    if (day === 1) {
      await page.reload()
      await expect(page.getByRole('table', { name: 'Household balance' })).toBeVisible()
    }
    await page
      .getByRole('button', { name: day < 7 ? 'Open next dispatch' : 'Read week in review' })
      .click()
  }
  const weekInReview = page.getByRole('heading', { name: 'Week in review.' })
  await expect(weekInReview).toBeVisible()
  await page.reload()
  await expect(weekInReview).toBeVisible()
  await page.getByText('Day 7 · Share a delivery', { exact: true }).click()
  await expect(page.locator('details[open]')).toContainText('Two portions from the shared delivery')
  await page.getByRole('button', { name: 'Start another issue' }).click()
  await page.getByRole('button', { name: 'Keep playing' }).click()
  await expect(weekInReview).toBeVisible()
  await page.getByRole('button', { name: 'New issue', exact: true }).click()
  await page.getByRole('button', { name: 'Replace saved issue' }).click()
  const callSign = page.getByRole('textbox', { name: 'Call sign', exact: true })
  await expect(callSign).toBeEmpty()
  await page.reload()
  await expect(callSign).toBeEmpty()
  await expect(page.getByRole('combobox', { name: 'Occupation', exact: true })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Starting reserve', exact: true })).toBeVisible()
  await expect(
    page.getByRole('textbox', { name: 'Scenario seed', exact: true })
  ).toHaveAccessibleDescription('Use the same seed to replay the same world events.')
})
test('competing tabs cannot replace a committed decision with a stale one', async ({
  page,
  context,
}) => {
  await start(page)
  const other = await context.newPage()
  await other.goto('/')
  await expect(other.getByText('Your next move')).toBeVisible()
  await page.getByRole('button', { name: /Take an extra shift/ }).click()
  await expect(page.getByText('What changed')).toBeVisible()
  await other.getByRole('button', { name: /Share a delivery/ }).click()
  await expect(other.getByRole('alert')).toContainText('Another tab changed')
  await other.getByRole('button', { name: 'Reload saved issue' }).click()
  await expect(other.getByRole('heading', { name: 'Take an extra shift.' })).toBeVisible()
})
test('an unreadable record remains available until explicitly replaced', async ({ page }) => {
  await start(page)
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('sitrep-issues', 1)
        open.onsuccess = () => {
          const db = open.result,
            tx = db.transaction('desk', 'readwrite')
          tx.objectStore('desk').put('damaged', 'current')
          tx.oncomplete = () => {
            db.close()
            resolve()
          }
          tx.onerror = () => reject(tx.error)
        }
      })
  )
  await page.reload()
  await expect(page.getByRole('alert')).toContainText('could not be read')
  await page.getByRole('button', { name: 'Replace saved issue' }).click()
  await expect(page.getByRole('textbox', { name: 'Call sign', exact: true })).toBeVisible()
})
