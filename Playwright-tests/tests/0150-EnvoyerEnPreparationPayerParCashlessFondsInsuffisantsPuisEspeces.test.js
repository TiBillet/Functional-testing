import {test, expect} from '@playwright/test'
import {
  userAgentString,
  tagId,
  connection,
  goPointSale,
  resetCardCashless,
  emulateTagIdNfc
} from '../mesModules/commun.js'

test.use({userAgent: userAgentString})
test.use({viewport: {width: 1024, height: 800}})

const urlTester = 'http://localhost:8001/wv/'

let page

test.describe('Envoyer en préparation, paiemant par cashless fonds insuffisants puis par espèces.', () => {
  test('Contexte, vider carte de "Robocop".', async ({browser}) => {
    page = await browser.newPage()
    await connection(page, urlTester)

    // vider carte Robocop
    await resetCardCashless(page, tagId.carteRobocop)
  })

  test('Envoyer en préparation et payer en une fois 3 tarticles.', async () => {
    // attente affichage menu burger
    await page.locator('.navbar-menu i[class~="menu-burger-icon"]').waitFor({state: 'visible'})

    // aller au point de vente "RESTO"
    await goPointSale(page, 'RESTO')
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'Sélectionner une table : Resto'}).waitFor({state: 'visible'})

    // sélectionne la table S06
    await page.locator('#tables-liste div[class~="table-bouton"] >> text=S05').click()

    // pv resto affiché
    await expect(page.locator('.titre-vue >> text=Nouvelle commande sur table S05, PV Resto')).toBeVisible()

    // sélection des articles
    await page.locator('#products div[data-name-pdv="Resto"] bouton-article[nom="Eau 1L"]').click()
    await page.locator('#products div[data-name-pdv="Resto"] bouton-article[nom="CdBoeuf"]').click()
    await page.locator('#products div[data-name-pdv="Resto"] bouton-article[nom="Chimay Bleue"]').click({clickCount: 2})

    // valider commande
    await page.locator('#bt-valider').click()

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless').waitFor({state: 'visible'})

    // clique sur "ENVOYER EN PREPARATION ET PAYER EN UNE SEULE FOIS"
    await page.locator('#popup-cashless #test-prepa2').click()
  })


  test('Payer en Cashless, carte de "Robocop" contient 0 crédit.', async () => {
    // attendre moyens de paiement
    await page.locator('#popup-cashless .selection-type-paiement', {hasText: 'Type(s) de paiement'}).waitFor({state: 'visible'})

    // sélection du cashless comme moyen de paiement
    await page.locator('#popup-cashless bouton-basique >> text=CASHLESS').click()

    // Attente lecture carte
    await page.locator('#popup-cashless #popup-lecteur-nfc', {hasText: 'Attente lecture carte'}).waitFor({state: 'visible'})

    // émule carte robocop
    await emulateTagIdNfc(page, tagId.carteRobocop)

  })

  test("Retour de l'envoi en préparation.", async () => {
    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless').waitFor({state: 'visible'})

    // fond d'écran =  'rgb(114, 39, 39)'
    const backGroundColor = await page.evaluate(async () => {
      return document.querySelector('#popup-cashless').style.backgroundColor
    })
    expect(backGroundColor).toEqual('rgb(114, 39, 39)')

    // Fonds insuffisants
    await expect(page.locator('#popup-cashless .popup-titre1 >> text=Fonds insuffisants')).toBeVisible()

    // clique sur "ESPECE"
    await page.locator('#popup-cashless bouton-basique >> text=ESPECE').click()
  })

  test("Retour pour le paiement en espèces.", async () => {

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless').waitFor({state: 'visible'})

    // fond d'écran =  'rgb(51, 148, 72)'
    const backGroundColor = await page.evaluate(async () => {
      return document.querySelector('#popup-cashless').style.backgroundColor
    })
    expect(backGroundColor).toEqual('rgb(51, 148, 72)')

    // Transaction OK !
    await expect(page.locator('#popup-cashless .popup-titre1 >> text=Transaction OK !')).toBeVisible()

    // Envoyée en préparation.
    await expect(page.locator('#popup-cashless .test-msg-prepa >> text=Envoyée en préparation.')).toBeVisible()

    // total commande
    await expect(page.locator('#popup-cashless .popup-msg1', {hasText: 'Total'})).toHaveText('Total (espèce) : 32.10')

    // bouton "RETOUR" présent
    await expect(page.locator('#popup-cashless #popup-retour')).toBeVisible()

    // sortir de "popup-cashless"
    await page.locator('#popup-retour').click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()

    await page.close()
  })

})