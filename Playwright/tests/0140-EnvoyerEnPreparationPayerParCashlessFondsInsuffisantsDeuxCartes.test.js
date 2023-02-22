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

test.describe('Envoyer en préparation, paiemant cashless uniquement, fonds insuffisants sur les deux cartes.', () => {
  test('Contexte, vider carte de "Robocop" et de "Test".', async ({browser}) => {
    page = await browser.newPage()
    await connection(page, urlTester)

    // vider carte Robocop
    await resetCardCashless(page, tagId.carteRobocop)

    // vider carte Test
    await resetCardCashless(page, tagId.carteTest)
  })

  test('Envoyer en préparation et payer en une fois 3 tarticles.', async () => {
    // attente affichage menu burger
    await page.locator('.navbar-menu i[class~="menu-burger-icon"]').waitFor({state: 'visible'})

    // aller au point de vente "RESTO"
    await goPointSale(page, 'RESTO')
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'Sélectionner une table : Resto'}).waitFor({state: 'visible'})

    // sélectionne la première table
    await page.locator('#tables-liste div[class~="table-bouton"] >> text=S04').click()

    // pv resto affiché
    await expect(page.locator('.titre-vue >> text=Nouvelle commande sur table S04, PV Resto')).toBeVisible()

    // sélection des articles
    await page.locator('#products div[data-name-pdv="Resto"] bouton-article[nom="Pression 50"]').click({clickCount: 2})
    await page.locator('#products div[data-name-pdv="Resto"] bouton-article[nom="CdBoeuf"]').click()
    await page.locator('#products div[data-name-pdv="Resto"] bouton-article[nom="Gateau"]').click()

    // valider commande
    await page.locator('#bt-valider').click()

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless').waitFor({state: 'visible'})

    // clique sur "ENVOYER EN PREPARATION ET PAYER EN UNE SEULE FOIS"
    await page.locator('#popup-cashless #test-prepa2').click()
  })

  test('Payer en Cashless, carte de "Test" contient 0 crédit.', async () => {
    // attendre moyens de paiement
    await page.locator('#popup-cashless .selection-type-paiement', {hasText: 'Type(s) de paiement'}).waitFor({state: 'visible'})

    // sélection du cashless comme moyen de paiement
    await page.locator('#popup-cashless bouton-basique >> text=CASHLESS').click()

    // Attente lecture carte
    await page.locator('#popup-cashless #popup-lecteur-nfc', {hasText: 'Attente lecture carte'}).waitFor({state: 'visible'})

    // émule carte robocop
    await emulateTagIdNfc(page, tagId.carteTest)

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

    // manque
    await expect(page.locator('#popup-cashless .popup-msg1 >> text=Il manque 38.00')).toBeVisible()

    // bouton "ESPECE" présent
    await expect(page.locator('#popup-cashless bouton-basique >> text=ESPECE')).toBeVisible()
    // TOTAL du bouton présent
    await expect(page.locator('#popup-cashless bouton-basique', {hasText: 'ESPECE'}).locator('.sous-element-texte >> text=TOTAL 38.00 €')).toBeVisible()

    // bouton "CB" présent
    await expect(page.locator('#popup-cashless bouton-basique >> text=CB')).toBeVisible()
    // TOTAL du bouton présent
    await expect(page.locator('#popup-cashless bouton-basique', {hasText: 'CB'}).locator('.sous-element-texte >> text=TOTAL 38.00 €')).toBeVisible()

    // bouton "2EME CARTE" présent
    await expect(page.locator('#popup-cashless bouton-basique >> text=2EME CARTE')).toBeVisible()
    // TOTAL du bouton présent
    await expect(page.locator('#popup-cashless bouton-basique', {hasText: '2EME CARTE'}).locator('.sous-element-texte >> text=TOTAL 38.00 €')).toBeVisible()

    // clique sur "2EME CARTE"
    await page.locator('#popup-cashless bouton-basique >> text=2EME CARTE').click()

    // Attente lecture carte
    await page.locator('#popup-cashless #popup-lecteur-nfc', {hasText: 'Attente lecture carte'}).waitFor({state: 'visible'})

    // émule carte robocop
    await emulateTagIdNfc(page, tagId.carteRobocop)
  })

  test("Retour pour la 2ème carte (fonds insuffisants).", async () => {
    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless').waitFor({state: 'visible'})

    // fond d'écran =  'rgb(114, 39, 39)'
    const backGroundColor = await page.evaluate(async () => {
      return document.querySelector('#popup-cashless').style.backgroundColor
    })
    expect(backGroundColor).toEqual('rgb(114, 39, 39)')

    // Fonds insuffisants
    await expect(page.locator('#popup-cashless .popup-titre1 >> text=Fonds insuffisants')).toBeVisible()

    // manque
    await expect(page.locator('#popup-cashless .popup-msg1 >> text=Il manque 38.00')).toBeVisible()

    // bouton "ESPECE" présent
    await expect(page.locator('#popup-cashless bouton-basique >> text=ESPECE')).toBeVisible()
    // TOTAL du bouton présent
    await expect(page.locator('#popup-cashless bouton-basique', {hasText: 'ESPECE'}).locator('.sous-element-texte >> text=TOTAL 38.00 €')).toBeVisible()

    // bouton "CB" présent
    await expect(page.locator('#popup-cashless bouton-basique >> text=CB')).toBeVisible()
    // TOTAL du bouton présent
    await expect(page.locator('#popup-cashless bouton-basique', {hasText: 'CB'}).locator('.sous-element-texte >> text=TOTAL 38.00 €')).toBeVisible()

    // bouton "2EME CARTE" présent
    await expect(page.locator('#popup-cashless bouton-basique >> text=2EME CARTE')).toBeVisible()
    // TOTAL du bouton présent
    await expect(page.locator('#popup-cashless bouton-basique', {hasText: '2EME CARTE'}).locator('.sous-element-texte >> text=TOTAL 38.00 €')).toBeVisible()


    // bouton "RETOUR" présent
    await expect(page.locator('#popup-cashless #popup-retour')).toBeVisible()

    // sortir de "popup-cashless"
    await page.locator('#popup-retour').click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()

    // addition pas vide
    await expect(page.locator('#achats-liste')).not.toBeEmpty()

    // total 38€
    await expect(page.locator('#bt-valider-total')).toHaveText('TOTAL 38 €')

    await page.close()
  })

})