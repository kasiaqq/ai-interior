import { expect, test } from '@playwright/test'
import { generateJapandi, stubApi } from './fixtures'

test('restyles a photo in two styles and compares them', async ({ page }) => {
  await stubApi(page)
  await generateJapandi(page)
  await expect(page.getByRole('heading', { name: 'Japandi · variant 1' })).toBeVisible()

  await page.getByRole('button', { name: 'Industrial' }).click()
  await expect(page.getByRole('heading', { name: 'Industrial · variant 1' })).toBeVisible()

  await page.getByRole('link', { name: /All results in this session \(2\)/ }).click()
  await expect(page.getByRole('heading', { name: 'Two takes on the same room' })).toBeVisible()
  for (const box of await page.getByRole('checkbox', { name: 'Compare' }).all()) await box.check()
  await expect(page.getByLabel('Comparison')).toContainText('Japandi · variant 1 and Industrial · variant 1')
})

test('keeps the photo and choices when the daily quota is used up', async ({ page }) => {
  await stubApi(page, { quotaUsedUp: true })
  await generateJapandi(page)
  await expect(page.getByText('Come back tomorrow')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Try again' })).toHaveCount(0)

  await page.getByRole('link', { name: 'Back to styles' }).click()
  await expect(page.getByRole('heading', { name: 'Pick a style for your living room' })).toBeVisible()
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

  test('fits the screen, keeps actions in reach and slides by touch', async ({ page }) => {
    await stubApi(page)
    await generateJapandi(page)
    await expect(page.getByRole('heading', { name: 'Japandi · variant 1' })).toBeVisible()

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
    await expect(page.getByRole('button', { name: 'Start over' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Download' })).toBeInViewport()

    const slider = page.getByRole('slider', { name: 'Compare before and after' })
    const frame = await page.locator('.slider').boundingBox()
    await page.locator('.slider').tap({ position: { x: frame!.width * 0.2, y: frame!.height / 2 } })
    const value = Number(await slider.getAttribute('aria-valuenow'))
    expect(value).toBeGreaterThan(10)
    expect(value).toBeLessThan(30)
  })
})
