import {test, expect} from '@playwright/test'
import {
  userAgentString,
  tagId,
  connection,
  goPointSale,
  resetCardCashless,
  creditCardCashless,
  emulateTagIdNfc
} from '../mesModules/commun.js'

test.use({userAgent: userAgentString})
test.use({viewport: {width: 1024, height: 800}})

const urlTester = 'http://localhost:8001/wv/'

let page

test.describe('Vente directe', () => {
  test('Achat de 3 article par cashless', async ({browser}) => {
    page = await browser.newPage()
    await connection(page, urlTester)

    // vider carte
    await resetCardCashless(page, tagId.carteRobocop)

    // créditer la carte de robocop de 3x10 crédits et de 0x5 crédit cadeau
    await creditCardCashless(page, tagId.carteRobocop, 3, 0)

    // attente affichage menu burger
    await page.locator('.navbar-menu i[class~="menu-burger-icon"]').waitFor({state: 'visible'})

    // aller au point de vente "BAR 1"
    await goPointSale(page, 'BAR 1')

    // bien sur "Bar 1"
    await expect(page.locator('text=Service Direct - Bar 1')).toBeVisible()

    // articles
    await page.locator('#products div[data-name-pdv="Bar 1"] bouton-article[nom="Pression 50"]').click({clickCount: 2})
    await page.locator('#products div[data-name-pdv="Bar 1"] bouton-article[nom="Soft G"]').click()
    await page.locator('#products div[data-name-pdv="Bar 1"] bouton-article[nom="biere1"]').click()

    // --- addition ---
    // pression 50
    await expect(page.locator('#achats-liste .achats-ligne', {hasText: 'Pression 50'}).locator('.achats-col-qte')).toHaveText('2')
    await expect(page.locator('#achats-liste .achats-ligne', {hasText: 'Pression 50'}).locator('.achats-ligne-produit-contenu')).toHaveText('Pression 50')
    await expect(page.locator('#achats-liste .achats-ligne', {hasText: 'Pression 50'}).locator('.achats-col-prix-contenu')).toHaveText('2.5€')

    // DEV : modifie le nombre de soft
    // await page.evaluate(async () => {
    //   document.querySelector('#achats-liste .achats-ligne:nth-child(2) .achats-col-qte').innerText = 4
    // })

    // Soft G
    await expect(page.locator('#achats-liste .achats-ligne', {hasText: 'Soft G'}).locator('.achats-col-qte')).toHaveText('1')
    await expect(page.locator('#achats-liste .achats-ligne', {hasText: 'Soft G'}).locator('.achats-ligne-produit-contenu')).toHaveText('Soft G')
    await expect(page.locator('#achats-liste .achats-ligne', {hasText: 'Soft G'}).locator('.achats-col-prix-contenu')).toHaveText('1.5€')

    // biere1
    await expect(page.locator('#achats-liste .achats-ligne', {hasText: 'biere1'}).locator('.achats-col-qte')).toHaveText('1')
    await expect(page.locator('#achats-liste .achats-ligne', {hasText: 'biere1'}).locator('.achats-ligne-produit-contenu')).toHaveText('biere1')
    await expect(page.locator('#achats-liste .achats-ligne', {hasText: 'biere1'}).locator('.achats-col-prix-contenu')).toHaveText('1.5€')

    // TOTAL
    await expect(page.locator('#bt-valider-total')).toHaveText('TOTAL 8 €')

    // VALIDER
    await page.locator('#bt-valider').click()

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless').waitFor({state: 'visible'})

    // paiement par cashless
    await page.locator('#popup-cashless bouton-basique >> text=CASHLESS').click()

    // attente affichage "Attente lecture carte"
    await page.locator('#popup-cashless', {hasText: 'Attente lecture carte'}).waitFor({state: 'visible'})

    // carte nfc de robocop
    await emulateTagIdNfc(page, tagId.carteRobocop)

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless').waitFor({state: 'visible'})

    // Transaction OK !
    await expect(page.locator('#popup-cashless div[class="popup-titre1"] >> text=Transaction OK !')).toBeVisible()

    // Sur carte avant les achats
    await expect(page.locator('#test-total-carte-avant-achats')).toHaveText('30.00')

    // Total
    await expect(page.locator('#popup-cashless .test-total-achats')).toHaveText('Total (carte nfc) : 8.00')

    // Reste sur carte
    await expect(page.locator('#test-total-carte')).toHaveText('22.00')

    // nom de la monnaie "TestCoin"
    await expect(page.locator('#popup-cashless span[class="test-nom-monnaie"]')).toHaveText('TestCoin')

    // Carte chargés de 15 crédits
    await expect(page.locator('#popup-cashless span[class="test-valeur-monnaie"]')).toHaveText('22')

    // sortir de "popup-cashless"
    await page.locator('#popup-retour').click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()
  })

  test('Achat de 2 article par cb.', async () => {
    // vider carte
    await resetCardCashless(page, tagId.carteRobocop)

    // créditer la carte de robocop de 3x10 crédits et de 0x5 crédit cadeau
    await creditCardCashless(page, tagId.carteRobocop, 2, 1)

    // attente affichage menu burger
    await page.locator('.navbar-menu i[class~="menu-burger-icon"]').waitFor({state: 'visible'})

    // aller au point de vente "BAR 1"
    await goPointSale(page, 'BAR 1')

    // bien sur "Bar 1"
    await expect(page.locator('text=Service Direct - Bar 1')).toBeVisible()

    // articles
    await page.locator('#products div[data-name-pdv="Bar 1"] bouton-article[nom="Eau 1L"]').click()
    await page.locator('#products div[data-name-pdv="Bar 1"] bouton-article[nom="Chimay Rouge"]').click()

    // --- addition ---
    // Eau 1L
    await expect(page.locator('#achats-liste .achats-ligne', {hasText: 'Eau 1L'}).locator('.achats-col-qte')).toHaveText('1')
    await expect(page.locator('#achats-liste .achats-ligne', {hasText: 'Eau 1L'}).locator('.achats-ligne-produit-contenu')).toHaveText('Eau 1L')
    await expect(page.locator('#achats-liste .achats-ligne', {hasText: 'Eau 1L'}).locator('.achats-col-prix-contenu')).toHaveText('1.5€')

    // DEV : modifie le nombre de soft
    // await page.evaluate(async () => {
    //   document.querySelector('#achats-liste .achats-ligne:nth-child(2) .achats-col-qte').innerText = 4
    // })

    // Chimay Rouge
    await expect(page.locator('#achats-liste .achats-ligne', {hasText: 'Chimay Rouge'}).locator('.achats-col-qte')).toHaveText('1')
    await expect(page.locator('#achats-liste .achats-ligne', {hasText: 'Chimay Rouge'}).locator('.achats-ligne-produit-contenu')).toHaveText('Chimay Rouge')
    await expect(page.locator('#achats-liste .achats-ligne', {hasText: 'Chimay Rouge'}).locator('.achats-col-prix-contenu')).toHaveText('2.6€')

    // TOTAL
    await expect(page.locator('#bt-valider-total')).toHaveText('TOTAL 4.1 €')

    // VALIDER
    await page.locator('#bt-valider').click()

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless').waitFor({state: 'visible'})

    // paiement par cashless
    await page.locator('#popup-cashless bouton-basique >> text=CB').click()

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless').waitFor({state: 'visible'})

    // Transaction OK !
    await expect(page.locator('#popup-cashless div[class="popup-titre1"] >> text=Transaction OK !')).toBeVisible()

    // Total
    await expect(page.locator('#popup-cashless .test-total-achats')).toHaveText('Total (carte bancaire) : 4.10')

    // sortir de "popup-cashless"
    await page.locator('#popup-retour').click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()
    await page.close()
  })
})
