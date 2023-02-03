import {test, expect} from '@playwright/test'
import {updateNfc, emulateMasterNfc, emulateUnknownNfc} from '../mesModules/majNfc.js'

test.use({userAgent: '{"hostname":"phenix", "token": "$a;b2yuM5454@4!cd", "password":"PQVot?TKFzSvjmkY", "modeNfc":"NFCLO", "front":"FOR", "ip":"192.168.1.4"}'})
test.use({viewport: {width: 1024, height: 800}})

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

  test('Valeur total achats', async () => {
    // Clique sur le menu burger
    await page.locator('.menu-burger-icon').click()

    // Click text=POINTS DE VENTES
    await page.locator('text=POINTS DE VENTES').click()

    // Clique sur point de vente Resto
    await page.locator('#menu-burger-conteneur >> text=Resto').click()

    // Cliquer table S01
    await page.locator('text=S01').click()

    // Click text=CdBoeuf x 2
    await page.locator('div[data-name-pdv="Resto"]  bouton-article >> text=CdBoeuf').click({
      clickCount: 2
    })
    // Click text=Eau 50cL x 2
    await page.locator('div[data-name-pdv="Resto"] >> text=Eau 50cL').click({
      clickCount: 2
    })
    // Click text=Pression 50 2.5 € 0 >> nth=0
    await page.locator('div[data-name-pdv="Resto"] >> text=Pression 50').click({
      clickCount: 2
    })

    // Click #bt-valider
    await page.locator('#bt-valider').click()

    // envoyer en préparation
    await page.locator('#test-prepa1').click()

    // Click text=Transaction OK ! Envoyée en préparation. RETOUR
    await expect(page.locator('text=Transaction OK ! Envoyée en préparation. RETOUR')).toBeVisible()

    // Click #popup-retour div:has-text("RETOUR") >> nth=0
    await page.locator('#popup-retour div:has-text("RETOUR")').first().click();

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()

    await page.pause()
    /*
    // Click #menu-burger-conteneur >> text=Bar 1
    await page.locator('#menu-burger-conteneur >> text=Bar 1').click()

    // Click text=Service Direct - Bar 1
    await expect(page.locator('text=Service Direct - Bar 1')).toBeVisible()

    // Clique sur le bouton "CHECK CARTE")
    await page.locator('#page-commandes-footer div:has-text("CHECK CARTE")').first().click()


    // text=Attente lecture carte visible
    await expect(page.locator('text=Attente lecture carte')).toBeVisible()

    // #popup-retour visible
    await expect(page.locator('#popup-retour')).toBeVisible()

    // Click #popup-retour div:has-text("RETOUR") >> nth=0
    await page.locator('#popup-retour div:has-text("RETOUR")').first().click();

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()
    */
  })

})