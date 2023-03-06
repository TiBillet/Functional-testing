import {test, expect} from '@playwright/test'
import {
  getEnv,
  userAgentString,
  connection,
  tagId,
  resetCardCashless,
  creditCardCashlessOnion,
  goPointSale,
  emulateTagIdNfc,
  selectArticles,
  confirmation
} from '../../mesModules/commun.js'

test.use({userAgent: userAgentString})
test.use({ignoreHTTPSErrors: true})
test.use({viewport: {width: 1100, height: 900}})

const env = getEnv()
const tenant = env.tenantToTest
const urlRoot = 'https://' + env.cashlessServer[tenant].subDomain + '.' + env.domain
const urlTester = urlRoot + '/wv/'
let page

test.describe.skip('Retour consigne de Demeter.', () => {
  test('Connexion, vider carte, 50 crédits, 2.50 crédits cadeaux', async ({browser}) => {
    page = await browser.newPage()
    await connection(page, urlTester)

    // vider carte
    await resetCardCashless(page, tagId(tenant).carteRobocop)

    // créditer de 50 crédits
    await creditCardCashlessOnion(page, tagId(tenant).carteRobocop, "TestCoin +10", 5)
    // créditer de 2.50 crédits cadeaux
    await creditCardCashlessOnion(page, tagId(tenant).carteRobocop, "TestCoin Cadeau +1", 2)
    await creditCardCashlessOnion(page, tagId(tenant).carteRobocop, "TestCoin Cadeau +0.5", 1)

    // --- check crédits carte ok ---
    // attente pv "CASHLESS"
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'Service Direct - Cashless'}).waitFor({state: 'visible'})

    // Clique sur le bouton "CHECK CARTE")
    await page.locator('#page-commandes-footer', {hasText: 'CHECK CARTE'}).click()

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless', {hasText: 'Attente lecture carte'}).waitFor({state: 'visible'})

    // émule la carte nfc de Robocop
    await emulateTagIdNfc(page, tagId(tenant).carteRobocop)

    await expect(page.locator('#popup-cashless > div div[class="popup-msg1 test-item-monnaie"] span[class="test-valeur-monnaie"]').locator('nth=0')).toHaveText('2.5')
    await expect(page.locator('#popup-cashless > div div[class="popup-msg1 test-item-monnaie"] span[class="test-valeur-monnaie"]').locator('nth=1')).toHaveText('50')

    // sortir de "popup-cashless"
    await page.locator('#popup-retour').click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()
  })

  test('Prendre une "biere3" et retour consigne', async () => {
    await goPointSale(page, 'BAR 1')

    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'Service Direct - Bar 1'}).waitFor({state: 'visible'})

    // sélection des articles
    const listeArticles = [{nom: "biere3", nb: 1, prix: 3.6}, {nom: "Retour Consigne", nb: 1, prix: -1}]
    // const listeArticles = [{nom: "Retour Consigne", nb: 1, prix: -1}]
    await selectArticles(page, listeArticles, "Bar 1")

    // valider commande
    await page.locator('#bt-valider').click()

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless').waitFor({state: 'visible'})

    // paiement par ESPECE
   await page.locator('#popup-cashless bouton-basique >> text=ESPECE').click()


    // confirmation
    await confirmation(page, 'espece')

     // VALIDER
    await page.locator('#popup-confirme-valider').click()

await page.pause()
    await page.close()
  })
})