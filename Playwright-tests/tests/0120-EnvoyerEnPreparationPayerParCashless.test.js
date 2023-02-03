import {test, expect} from '@playwright/test'
import {
  userAgentString,
  tagId,
  connection,
  goPointSale,
  selectArticles,
  resetCardCashless,
  creditCardCashless,
  emulateTagIdNfc
} from '../mesModules/commun.js'

test.use({userAgent: userAgentString})
test.use({viewport: {width: 1024, height: 800}})

const urlTester = 'http://localhost:8001/wv/'

let page

test.describe('Envoyer en préparation, paiemant cashless, payer en une seule fois.', () => {
  test('Contexte, vider, créditer carte de robocop de 40 crédits.', async ({browser}) => {
    page = await browser.newPage()
    await connection(page, urlTester)

    // vider carte robocop
    await resetCardCashless(page, tagId.carteRobocop)
    // recharge carte de robocop
    await creditCardCashless(page, tagId.carteRobocop, 4, 0)
  })

  test('Envoyer en préparation et payer en une fois 3 tarticles.', async () => {
    // attente affichage menu burger
    await page.locator('.navbar-menu i[class~="menu-burger-icon"]').waitFor({state: 'visible'})

    // aller au point de vente "RESTO"
    await goPointSale(page, 'RESTO')
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'Sélectionner une table : Resto'}).waitFor({state: 'visible'})

    // sélectionne la première table
    await page.locator('#tables-liste div[class~="table-bouton"] >> text=S02').click()

    // pv resto affiché
    await expect(page.locator('.titre-vue >> text=Nouvelle commande sur table S02, PV Resto')).toBeVisible()

    // sélection des articles
    const listeArticles = [{nom: "Despé", nb: 2, prix: 3.2}, {nom: "CdBoeuf", nb: 1, prix: 25},
      {nom: "Café", nb: 2, prix: 1}]
    await selectArticles(page, listeArticles, "Resto")

    // valider commande
    await page.locator('#bt-valider').click()

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless').waitFor({state: 'visible'})

    // clique sur "ENVOYER EN PREPARATION ET PAYER EN UNE SEULE FOIS"
    await page.locator('#popup-cashless #test-prepa2').click()
  })

  test("Total ok, payer en Cashless.", async () => {
    // attendre moyens de paiement
    await page.locator('#popup-cashless .selection-type-paiement', {hasText: 'Type(s) de paiement'}).waitFor({state: 'visible'})

    // bouton "CASHLESS" présent
    await expect(page.locator('#popup-cashless bouton-basique >> text=CASHLESS')).toBeVisible()

    // total = 33.4€
    await expect(page.locator('#popup-cashless bouton-basique', {hasText: 'CASHLESS'}).locator('.sous-element-texte >> text=TOTAL 33.4 €')).toBeVisible()

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

    // fond d'écran ver =  'rgb(51, 148, 72)'
    const backGroundColor = await page.evaluate(async () => {
      return document.querySelector('#popup-cashless').style.backgroundColor
    })
    expect(backGroundColor).toEqual('rgb(51, 148, 72)')

    // Transaction OK !
    await expect(page.locator('#popup-cashless .popup-titre1 >> text=Transaction OK !')).toBeVisible()

    // Envoyée en préparation.
    await expect(page.locator('#popup-cashless .test-msg-prepa >> text=Envoyée en préparation.')).toBeVisible()

    // total commande
    await expect(page.locator('#popup-cashless .popup-msg1', {hasText: 'Total'})).toHaveText('Total (carte nfc) : 33.4')

    // Crédits sur carte avant commande
    await expect(page.locator('#popup-cashless #test-total-carte-avant-achats')).toHaveText('40.00')

    // reste sur carte
    await expect(page.locator('#popup-cashless .test-carte-apres-achats')).toHaveText('Reste sur carte : 6.60')

    // sortir de "popup-cashless"
    await page.locator('#popup-retour').click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()

    await page.close()
  })
})
