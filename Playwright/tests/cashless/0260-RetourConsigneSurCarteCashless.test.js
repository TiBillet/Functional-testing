import {test, expect} from '@playwright/test'
import {
  userAgentString,
  connection,
  tagId,
  resetCardCashless,
  creditCardCashless,
  goPointSale,
  emulateTagIdNfc
} from '../../mesModules/commun.js'

test.use({userAgent: userAgentString})
test.use({viewport: {width: 600, height: 800}})

const urlTester = 'http://localhost:8001/wv/'

let page

test.describe('Retour consigne sur carte cashless.', () => {
  test('Context, connexion.', async ({browser}) => {
    page = await browser.newPage()
    await connection(page, urlTester)

    // vider carte
    await resetCardCashless(page, tagId.carteRobocop)

    // créditer la carte de robocop de 3x10 crédits et de 0x5 crédit cadeau
    await creditCardCashless(page, tagId.carteRobocop, 1, 0)
  })

  // test bascule bouton "Addition" et la liste
  test('Préparations(table EX02), chek carte, 10 crédits.', async () => {
    await goPointSale(page, 'CASHLESS')

    // attente pv "CASHLESS"
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'Service Direct - Cashless'}).waitFor({state: 'visible'})

    // Clique sur le bouton "CHECK CARTE")
    await page.locator('#page-commandes-footer', {hasText: 'CHECK CARTE'}).click()

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless', {hasText: 'Attente lecture carte'}).waitFor({state: 'visible'})

    // émule la carte nfc de Robocop
    emulateTagIdNfc(page, tagId.carteRobocop)

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless', {hasText: 'ROBOCOP'}).waitFor({state: 'visible'})

    // la carte contient 10 crédits
    await expect(page.locator('#popup-cashless div .check-carte-ok-total-carte')).toHaveText('Sur carte : 10')

    // Cliquer sur le bouton "RETOUR"
    await page.locator('#popup-retour').click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()
  })

  test('Préparations(table EX02), prendre un "Retour Consigne".', async () => {
    // attente pv "CASHLESS"
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'Service Direct - Cashless'}).waitFor({state: 'visible'})

    // clique sur article "Retour Consigne"
    await page.locator('#products div[data-name-pdv="Cashless"] bouton-article[nom="Retour Consigne"]').click()

    // TOTAL
    await expect(page.locator('#bt-valider-total')).toHaveText('TOTAL -1 €')

    // VALIDER
    await page.locator('#bt-valider').click()

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless').waitFor({state: 'visible'})

    // paiement par cashless
    await page.locator('#popup-cashless bouton-basique >> text=CASHLESS').click()

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless', {hasText: 'Attente lecture carte'}).waitFor({state: 'visible'})

    // émule la carte nfc de Robocop
    emulateTagIdNfc(page, tagId.carteRobocop)

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless', {hasText: 'OK'}).waitFor({state: 'visible'})

     // fond d'écran =  'rgb(51, 148, 72)'
    const backGroundColor = await page.evaluate(async () => {
      return document.querySelector('#popup-cashless').style.backgroundColor
    })
    expect(backGroundColor).toEqual('rgb(51, 148, 72)')

    await expect(page.locator('#popup-cashless .popup-titre1', {hasText: 'Retour de consigne OK !'})).toBeVisible()

    await expect(page.locator('#popup-cashless .popup-paragraphe div:nth-child(2)')).toHaveText('Votre carte est crédité de 1 TestCoin')

    // Cliquer sur le bouton "RETOUR"
    await page.locator('#popup-retour').click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()
  })

  test('Préparations(table EX02), check carte = 11 crédits.', async () => {
    // attente pv "CASHLESS"
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'Service Direct - Cashless'}).waitFor({state: 'visible'})

    // Clique sur le bouton "CHECK CARTE")
    await page.locator('#page-commandes-footer', {hasText: 'CHECK CARTE'}).click()

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless', {hasText: 'Attente lecture carte'}).waitFor({state: 'visible'})

    // émule la carte nfc de Robocop
    emulateTagIdNfc(page, tagId.carteRobocop)

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless', {hasText: 'ROBOCOP'}).waitFor({state: 'visible'})

    // la carte contient 11 crédits
    await expect(page.locator('#popup-cashless div .check-carte-ok-total-carte')).toHaveText('Sur carte : 11')

    // Cliquer sur le bouton "RETOUR"
    await page.locator('#popup-retour').click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()
    await page.close()
  })
})
