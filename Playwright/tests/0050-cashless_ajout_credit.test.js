import {test, expect} from '@playwright/test'
import {userAgentString, connection, goPointSale, tagId, emulateTagIdNfc, confirmation, evaluateOnclickFunctionString} from '../mesModules/commun.js'

test.use({userAgent: userAgentString})
test.use({viewport: {width: 1024, height: 800}})

const urlTester = 'http://localhost:8001/wv/'
let page

test.describe('Ajout crédit et crédit cadeau', () => {
  test('Vider carte utilisateur "robocop".', async ({browser}) => {
    // 1 - connexion appareil client
    page = await browser.newPage()
    await page.goto(urlTester)
    await connection(page, urlTester)

    // attente affichage menu burger
    await page.locator('.navbar-menu i[class~="menu-burger-icon"]').waitFor({state: 'visible'})

    // aller au point de vente "CASHLESS"
    await goPointSale(page, 'CASHLESS')

    // titre = "Service Direct -  Cashless"
    await expect(page.locator('.navbar-horizontal .titre-vue >> text=Service Direct -  Cashless')).toBeVisible()

    // VIDER CARTE
    await page.locator('#products div[data-name-pdv="Cashless"] bouton-article[nom="VIDER CARTE"]').click()

    // cliquer sur bouton "VALIDER"
    await page.locator('#bt-valider').click()

    // carte nfc de robocop
    await emulateTagIdNfc(page, tagId.carteRobocop)

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless').waitFor({state: 'visible'})

    // Vidage carte OK !
    await expect(page.locator('#popup-cashless div[class="popup-titre1"] >> text=Vidage carte OK !')).toBeVisible()

    // sortir de "popup-cashless"
    await page.locator('#popup-retour').click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()
  })

  test('Charge carte 15 crédit pour utilisateur "robocop", plus test présence moyens paiement.', async () => {
    // titre avec le mot "Cashless"
    await page.locator('.navbar-horizontal >> text=Cashless').waitFor({state: 'visible'})

    // 10 crédits
    await page.locator('#products div[data-name-pdv="Cashless"] bouton-article[nom="TestCoin +10"]').click()

    // 5 crédits
    await page.locator('#products div[data-name-pdv="Cashless"] bouton-article[nom="TestCoin +5"]').click()

    // cliquer sur bouton "VALIDER"
    await page.locator('#bt-valider').click()

    // test présence bouton "ESPECE"
    await expect(page.locator('#popup-cashless bouton-basique >> text=ESPECE')).toBeVisible()

    // test présence bouton "CB"
    await expect(page.locator('#popup-cashless bouton-basique >> text=CB')).toBeVisible()

    // test bouton "CASHLESS" non présent
    const btCashlessExist = await page.evaluate(async () => {
      return document.querySelector('#popup-cashless bouton-basique[texte~="CASHLESS"]')
    })
    expect(btCashlessExist).toEqual(null)

    // charger la carte en espèces
    await page.locator('#popup-cashless bouton-basique >> text=ESPECE').click()

    await confirmation(page, 'espece')

    // test bouton retour
    await page.locator('#popup-confirme-retour').click()

    // retour ok
    // popup de confirmation supprimer
    await expect(page.locator('#popup-cashless-confirm')).not.toBeVisible()
    // test présence bouton "ESPECE"
    await expect(page.locator('#popup-cashless bouton-basique >> text=ESPECE')).toBeVisible()
    // test présence bouton "CB"
    await expect(page.locator('#popup-cashless bouton-basique >> text=CB')).toBeVisible()
    // test présence bouton "RETOUR"
    await expect(page.locator('#popup-retour')).toBeVisible()

    // charger la carte en espèces
    await page.locator('#popup-cashless bouton-basique >> text=ESPECE').click()

    // cliquersur le bouton valider
    await page.locator('#popup-confirme-valider').click()

    // carte nfc de robocop
    await emulateTagIdNfc(page, tagId.carteRobocop)

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless').waitFor({state: 'visible'})

    // Transaction OK !
    await expect(page.locator('#popup-cashless div[class="popup-titre1"] >> text=Transaction OK !')).toBeVisible()

    // Sur carte avant les achats
    await expect(page.locator('#test-total-carte-avant-achats')).toHaveText('0.00')

    // Total
    await expect(page.locator('#popup-cashless .test-total-achats')).toHaveText('Total (espèce) : 15.00')

    // Reste sur carte
    await expect(page.locator('#test-total-carte')).toHaveText('15.00')

    // nom de la monnaie "TestCoin"
    await expect(page.locator('#popup-cashless span[class="test-nom-monnaie"]')).toHaveText('TestCoin')

    // Carte chargés de 15 crédits
    await expect(page.locator('#popup-cashless span[class="test-valeur-monnaie"]')).toHaveText('15')

    // sortir de "popup-cashless"
    await page.locator('#popup-retour').click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()
  })

  test('Charge carte 5 crédit cadeau pour utilisateur "robocop".', async () => {
    // 5 crédits cadeau
    await page.locator('#products div[data-name-pdv="Cashless"] bouton-article[nom="TestCoin Cadeau +5"]').click()

    // cliquer sur bouton "VALIDER"
    await page.locator('#bt-valider').click()

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless').waitFor({state: 'visible'})

    // carte nfc de robocop
    await emulateTagIdNfc(page, tagId.carteRobocop)

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless').waitFor({state: 'visible'})

    // Transaction OK !
    await expect(page.locator('#popup-cashless div[class="popup-titre1"] >> text=Transaction OK !')).toBeVisible()

    // Reste sur carte
    await expect(page.locator('#test-total-carte')).toHaveText('20.00')

    // TestCoin Cadeau
    await expect(page.locator('#popup-cashless .test-item-monnaie').nth(1).locator('.test-nom-monnaie')).toHaveText('TestCoin Cadeau')
    // 5
    await expect(page.locator('#popup-cashless .test-item-monnaie').nth(1).locator('.test-valeur-monnaie')).toHaveText('5')

    // sortir de "popup-cashless"
    await page.locator('#popup-retour').click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()

    await page.close()
  })

})