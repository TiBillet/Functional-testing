import {test, expect} from '@playwright/test'

test.describe.configure({mode: 'serial'})
let page

test.describe('test', async () => {

  test.beforeAll(async ({browser}) => {
    page = await browser.newPage();
    // Click button:has-text("Tout refuser")
    await page.goto('https://google.com/');

    await page.locator('button:has-text("Tout refuser")').click();
    await page.waitForURL('https://www.google.com/');

    const url = await page.url();
    expect(url).toContain('google');
  })

  test.afterAll(async () => {
    await page.close();
  })

  test('Search for Playwright', async () => {

    await page.locator('input[name="q"]').fill('Playwright')
    await page.keyboard.press('Enter')
    let text = await page.innerText('//h3[contains(text(),"Playwright:")]')
    expect(text).toContain('Playwright: Fast and reliable')

  })
})
