import {test, expect} from '@playwright/test'
import {updateNfc, emulateMasterNfc, emulateUnknownNfc} from '../mesModules/majNfc.js'

test.use({userAgent: '{"hostname":"phenix", "token": "$a;b2yuM5454@4!cd", "password":"PQVot?TKFzSvjmkY", "modeNfc":"NFCLO", "front":"FOR", "ip":"192.168.1.4"}'})
test.use({viewport: {width: 1024, height: 800}})

const urlTester = 'http://localhost:8001/wv/login_hardware'

let page, pageAdmin

test.describe.configure({mode: 'serial'})

test.describe.only('Check carte.', () => {

  test.beforeAll(async ({browser}) => {
    // 1 - connexion appareil client
    page = await browser.newPage()
    await page.goto(urlTester)
    await expect(await page.locator('text=Cliquer pour continuer la demande d\'activation !')).toBeVisible()


    // 2 - 1 connexion page admin
    pageAdmin = await browser.newPage()
    await pageAdmin.goto('http://localhost:8001/')
    await pageAdmin.locator('#password').fill('mi5Iechi')
    await pageAdmin.locator('#username').fill('TestAdmin')
    await pageAdmin.locator('#submit').click()
    await pageAdmin.locator('.sidebar-dependent .sidebar-section a:first-child:has-text("Appareils")').click()

    // await expect(page.locator('text=attente', {ignoreCase: true})).toBeVisible()
    // await expect(page.locator('text=lecture carte', {ignoreCase: true})).toBeVisible()
    // await expect(page.locator('text=carte maîtresse', {ignoreCase: true})).toBeVisible()
    //
    // await updateNfc(page)
    // await emulateMasterNfc(page)
  })

  test.afterAll(async () => {
    await page.close()
  })
  test('Pause', async () => {
    await page.pause()
  })
  /*
    test('"Attente lecture carte" et bouton "RETOUR".', async () => {
      // Clique sur le menu burger
      await page.locator('.menu-burger-icon').click()
      // Click text=POINTS DE VENTES
      await page.locator('text=POINTS DE VENTES').click()

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
    })

    test('Carte inconnue', async () => {
      // Clique sur le bouton "CHECK CARTE")
      await page.locator('#page-commandes-footer div:has-text("CHECK CARTE")').first().click()

      await emulateUnknownNfc(page)

      // Le text "carte inconnue" est affciché.
      await expect(page.locator('text=carte inconnue')).toBeVisible()

      // Click #popup-retour div:has-text("RETOUR") >> nth=0
      await page.locator('#popup-retour div:has-text("RETOUR")').first().click();

      // #popup-cashless éffacé
      await expect(page.locator('#popup-cashless')).toBeHidden()

    })
  */
})