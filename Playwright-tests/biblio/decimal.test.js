import {test, expect} from '@playwright/test'
import {updateNfc, emulateMasterNfc, emulateUnknownNfc} from '../mesModules/majNfc.js'

test.use({userAgent: '{"hostname":"phenix", "token": "$a;b2yuM5454@4!cd", "password":"PQVot?TKFzSvjmkY", "modeNfc":"NFCLO", "front":"FOR", "ip":"192.168.1.4"}'})
test.use({viewport: {width: 1024, height: 800}})

const urlTester = 'http://localhost:8001/wv/login_hardware'

let page

test.describe.configure({mode: 'serial'})

test.describe('Décimal', () => {

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

  test('Message "attente lecture carte" et bouton "RETOUR" ok', async () => {
    // Clique sur le menu burger
    await page.locator('.menu-burger-icon').click()

    // Click text=POINTS DE VENTES
    await page.locator('text=POINTS DE VENTES').click()

    // Clique sur point de vente "Bar 1"
    await page.locator('#menu-burger-conteneur >> text=Bar 1').click()

    // Click text=Chimay Bleue 2.8 € 0 >> nth=1
    await page.locator('div[data-name-pdv="Bar 1"] bouton-article >> text=Chimay Bleue').click({
      clickCount: 3
    })

    // Click text=Pression 50 2.5 € 0 >> nth=1
    await page.locator('div[data-name-pdv="Bar 1"]  bouton-article >> text=Pression 50').click()
    // Click text=Guinness 4.99 € 0 >> nth=1
    await page.locator('div[data-name-pdv="Bar 1"]  bouton-article >> text=Guinness').click()
    // Click text=Despé 3.2 € 0 >> nth=1
    await page.locator('div[data-name-pdv="Bar 1"]  bouton-article >> text=Despé ').click()

    await expect(page.locator('#bt-valider')).toContainText('TOTAL 19.09 €')
  })

})