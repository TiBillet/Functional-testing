import {test, expect} from '@playwright/test'
import {updateNfc, emulateMasterNfc} from '../mesModules/majNfc.js'

test.use({userAgent: '{"hostname":"phenix", "token": "$a;b2yuM5454@4!cd", "password":"PQVot?TKFzSvjmkY", "modeNfc":"NFCLO", "front":"FOR", "ip":"192.168.1.4"}'})
test.use({viewport: {width: 1024, height: 800}})

const urlTester = 'http://localhost:8001/wv/login_hardware'

let page

test.describe.configure({mode: 'serial'})

test.describe('Points de ventes avec commande', () => {

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

  test('Point de vente avec commande.', async () => {

    await expect(page.locator('.menu-burger-icon')).toBeVisible()

    // Clique sur le menu burger
    await page.locator('.menu-burger-icon').click()
    // Click text=POINTS DE VENTES
    await page.locator('text=POINTS DE VENTES').click()

    // Click #menu-burger-conteneur >> text=Resto
    await page.locator('#menu-burger-conteneur >> text=Resto').click();

    // Click #tables-liste div >> nth=2
    await expect(page.locator('#tables-liste div[class~="test-table-ephemere"]')).toBeVisible()
  })

  test('Point de vente avec service direct.', async () => {
    await expect(page.locator('.menu-burger-icon')).toBeVisible()

    // Clique sur le menu burger
    await page.locator('.menu-burger-icon').click()
    // Click text=POINTS DE VENTES
    await page.locator('text=POINTS DE VENTES').click()

    // Click #menu-burger-conteneur >> text=Bar 1
    await page.locator('#menu-burger-conteneur >> text=Bar 1').click()

    // Click text=Service Direct - Bar 1
    await expect(page.locator('text=Service Direct - Bar 1')).toBeVisible()
  })

})