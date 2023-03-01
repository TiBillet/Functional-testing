import {test, expect} from '@playwright/test'
import {getEnv, userAgentString, connection, goPointSale} from '../../mesModules/commun.js'

test.use({userAgent: userAgentString})
test.use({ignoreHTTPSErrors: true})
test.use({viewport: {width: 1024, height: 800}})

const env = getEnv()
const tenant = env.tenantToTest
const urlRoot = 'https://' + env.cashlessServer[tenant].subDomain + '.' + env.domain
const urlTester = urlRoot + '/wv/'
let page

test.describe('Point de ventes, moyens de paiement.', () => {
  test('Tous', async ({browser}) => {
    page = await browser.newPage()
    await connection(page, urlTester)

    // attente affichage menu burger
    await page.locator('.navbar-menu i[class~="menu-burger-icon"]').waitFor({state: 'visible'})

    // aller au point de vente "BAR 1"
    await goPointSale(page, 'BAR 1')

    // Service Direct - Bar 1
    await expect(page.locator('text=Service Direct - Bar 1')).toBeVisible()

    // articles
    await page.locator('#products div[data-name-pdv="Bar 1"] bouton-article[nom="Pression 50"]').click()

    // VALIDER
    await page.locator('#bt-valider').click()

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless').waitFor({state: 'visible'})

    // moyens de paiement
    await expect(page.locator('#popup-cashless bouton-basique >> text=CASHLESS')).toBeVisible()
    await expect(page.locator('#popup-cashless bouton-basique >> text=ESPECE')).toBeVisible()
    await expect(page.locator('#popup-cashless bouton-basique >> text=CB')).toBeVisible()
    // bouton retour
    await expect(page.locator('#popup-cashless bouton-basique >> text=RETOUR')).toBeVisible()

    // sortir de "popup-cashless"
    await page.locator('#popup-retour').click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()
  })

  test('CB et Cashless', async () => {
    // attente affichage menu burger
    await page.locator('.navbar-menu i[class~="menu-burger-icon"]').waitFor({state: 'visible'})

    // aller au point de vente "PVCB"
    await goPointSale(page, 'PVCB')

    // Service Direct - PvCb
    await expect(page.locator('text=Service Direct - PvCb')).toBeVisible()

    // articles
    await page.locator('#products div[data-name-pdv="PvCb"] bouton-article[nom="Pression 50"]').click()

    // VALIDER
    await page.locator('#bt-valider').click()

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless').waitFor({state: 'visible'})

    // moyens de paiement
    await expect(page.locator('#popup-cashless bouton-basique >> text=CASHLESS')).toBeVisible()
    await expect(page.locator('#popup-cashless bouton-basique >> text=ESPECE')).toHaveCount(0)
    await expect(page.locator('#popup-cashless bouton-basique >> text=CB')).toBeVisible()

    // bouton retour
    await expect(page.locator('#popup-cashless bouton-basique >> text=RETOUR')).toBeVisible()

    // sortir de "popup-cashless"
    await page.locator('#popup-retour').click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()
  })

  test('Especes et Cashless', async () => {
    // attente affichage menu burger
    await page.locator('.navbar-menu i[class~="menu-burger-icon"]').waitFor({state: 'visible'})

    // aller au point de vente "PVESPECE"
    await goPointSale(page, 'PVESPECE')

    // Service Direct - PvCb
    await expect(page.locator('text=Service Direct - PvEspece')).toBeVisible()

    // articles
    await page.locator('#products div[data-name-pdv="PvEspece"] bouton-article[nom="Pression 33"]').click()

    // VALIDER
    await page.locator('#bt-valider').click()

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless').waitFor({state: 'visible'})

    // moyens de paiement
    await expect(page.locator('#popup-cashless bouton-basique >> text=CASHLESS')).toBeVisible()
    await expect(page.locator('#popup-cashless bouton-basique >> text=ESPECE')).toBeVisible()
    await expect(page.locator('#popup-cashless bouton-basique >> text=CB')).toHaveCount(0)

    // bouton retour
    await expect(page.locator('#popup-cashless bouton-basique >> text=RETOUR')).toBeVisible()

    // sortir de "popup-cashless"
    await page.locator('#popup-retour').click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()
  })

  test('Pas de paiement Cashless (PV Cashless).', async () => {
    // attente affichage menu burger
    await page.locator('.navbar-menu i[class~="menu-burger-icon"]').waitFor({state: 'visible'})

    // aller au point de vente "CASHLESS"
    await goPointSale(page, 'CASHLESS')

    // Service Direct - PvCb
    await expect(page.locator('text=Service Direct - Cashless')).toBeVisible()

    // 10 crédits
    await page.locator('#products div[data-name-pdv="Cashless"] bouton-article[nom="TestCoin +10"]').click()

    // VALIDER
    await page.locator('#bt-valider').click()

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless').waitFor({state: 'visible'})

    // moyens de paiement
    await expect(page.locator('#popup-cashless bouton-basique >> text=CASHLESS')).toHaveCount(0)
    await expect(page.locator('#popup-cashless bouton-basique >> text=ESPECE')).toBeVisible()
    await expect(page.locator('#popup-cashless bouton-basique >> text=CB')).toBeVisible()

    // bouton retour
    await expect(page.locator('#popup-cashless bouton-basique >> text=RETOUR')).toBeVisible()

    // sortir de "popup-cashless"
    await page.locator('#popup-retour').click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()
    await page.close()
  })

})
