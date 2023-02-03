import {test, expect} from '@playwright/test'
import {updateNfc, emulateMasterNfc, emulateUnknownNfc} from '../mesModules/majNfc.js'

test.use({userAgent: '{"hostname":"phenix", "token": "$a;b2yuM5454@4!cd", "password":"PQVot?TKFzSvjmkY", "modeNfc":"NFCLO", "front":"FOR", "ip":"192.168.1.4"}'})
test.use({viewport: {width: 600, height: 800}})

const urlTester = 'http://localhost:8001/wv/login_hardware'

let page

test.describe.configure({mode: 'serial'})

test.describe('Envoyer en préparation', () => {

  test.beforeAll(async ({browser}) => {
    page = await browser.newPage()
    await page.goto(urlTester)

    await expect(page.locator('text=attente', {ignoreCase: true})).toBeVisible()
    await expect(page.locator('text=lecture carte', {ignoreCase: true})).toBeVisible()
    await expect(page.locator('text=carte maîtresse', {ignoreCase: true})).toBeVisible()

    await updateNfc(page)
    await emulateMasterNfc(page)
  })

  test.afterAll(async () => {
    await page.close()
  })

  test('ne rien faire', async () => {
    await page.pause()
  })

  })