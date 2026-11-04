import { expect, test } from '@playwright/test'
import { generateJapandi, roomPhoto, stubApi } from './fixtures'

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

test('starts each step on its heading and names the tab after it', async ({ page }) => {
  await stubApi(page)
  await page.goto('/')
  await expect(page).toHaveTitle('Upload a photo · AI Interior')
  await expect(page.locator('h1')).not.toBeFocused()

  await page.locator('input[type="file"]').setInputFiles(roomPhoto())
  await expect(page).toHaveTitle('Room type · AI Interior')
  await expect(page.getByRole('heading', { name: 'What room is this?' })).toBeFocused()

  await page.getByText('Living room', { exact: true }).click()
  await page.getByRole('button', { name: 'Continue to styles' }).click()
  await expect(page).toHaveTitle('Pick a style · AI Interior')
  await expect(page.getByRole('heading', { name: 'Pick a style for your living room' })).toBeFocused()

  await page.locator('label', { hasText: 'Japandi' }).click()
  await page.getByRole('button', { name: 'Generate Japandi' }).click()
  await expect(page).toHaveTitle('Japandi · variant 1 · AI Interior')
  await expect(page.getByRole('heading', { name: 'Japandi · variant 1' })).toBeFocused()

  await page.getByRole('link', { name: /All results in this session/ }).click()
  await expect(page).toHaveTitle('All results · AI Interior')
  await expect(page.getByRole('heading', { name: 'One take on the same room' })).toBeFocused()
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
