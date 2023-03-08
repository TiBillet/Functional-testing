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

// test bloqué pour cause de branche, une fois la branche "retour_consigne" mergée, le test pourra être appelé !
test.describe.skip('Retour consigne.', () => {
  test('Connexion.', async ({browser}) => {
    page = await browser.newPage()
    await connection(page, urlTester)
  })

  test('Choix de "retour consigne" bloque la sélection des autres articles', async () => {
    // await initContexte(page)

    await goPointSale(page, 'BAR 1')

    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'Service Direct - Bar 1'}).waitFor({state: 'visible'})

    // un article "Retour Consigne"
    await page.locator(`#products div[data-name-pdv="Bar 1"] bouton-article[nom="Retour Consigne"]`).click()

    // test articles désactivés (non cliquables)
    const testArticlesInactif = await page.evaluate(async () => {
      let retour = true
      const articles = glob.data.find(obj => obj.name === 'Bar 1').articles
      for (let i = 0; i < articles.length; i++) {
        const displayValue = document.querySelector(`#products div[data-name-pdv="Bar 1"] bouton-article[nom="${articles[i].name}"]`).shadowRoot.querySelector('#bt-rideau').style.display
        if (articles[i].name !== "Retour Consigne" && displayValue === 'none') {
          retour = false
          break
        }
      }
      return retour
    })
    expect(testArticlesInactif).toEqual(true)
  })

  test('Un "retour consigne" paiement par espèce.', async () => {
    await goPointSale(page, 'BAR 1')

    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'Service Direct - Bar 1'}).waitFor({state: 'visible'})

    // un article "Retour Consigne"
    await page.locator(`#products div[data-name-pdv="Bar 1"] bouton-article[nom="Retour Consigne"]`).click()

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

    // retour message serveur "'Retour de consigne OK !"
    await expect(page.locator('#popup-cashless .popup-titre1', {hasText: 'Retour de consigne OK !'})).toBeVisible()

    // fond d'écran =  'rgb(51, 148, 72)'
    const backGroundColor = await page.evaluate(async () => {
      return document.querySelector('#popup-cashless').style.backgroundColor
    })
    expect(backGroundColor).toEqual('rgb(51, 148, 72)')

    await expect(page.locator('#popup-cashless .popup-paragraphe div:nth-child(2)')).toHaveText('A rembourser : 1')

    // Cliquer sur le bouton "RETOUR"
    await page.locator('#popup-retour').click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()
  })

  test('Deux "retour consigne" paiement par espèce.', async () => {
    await goPointSale(page, 'BAR 1')

    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'Service Direct - Bar 1'}).waitFor({state: 'visible'})

    // deux articles "Retour Consigne"
    await page.locator(`#products div[data-name-pdv="Bar 1"] bouton-article[nom="Retour Consigne"]`).click({clickCount: 2})

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

    // retour message serveur "'Retour de consigne OK !"
    await expect(page.locator('#popup-cashless .popup-titre1', {hasText: 'Retour de consigne OK !'})).toBeVisible()

    // fond d'écran =  'rgb(51, 148, 72)'
    const backGroundColor = await page.evaluate(async () => {
      return document.querySelector('#popup-cashless').style.backgroundColor
    })
    expect(backGroundColor).toEqual('rgb(51, 148, 72)')

    // message de remboursement
    await expect(page.locator('#popup-cashless .popup-paragraphe div:nth-child(2)')).toHaveText('A rembourser : 2')

    // Cliquer sur le bouton "RETOUR"
    await page.locator('#popup-retour').click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()
  })

  test('Charger la carte cashless de 20 crédit seulement', async () => {

    // vider carte
    await resetCardCashless(page, tagId(tenant).carteTest)

    // créditer de 50 crédits
    await creditCardCashlessOnion(page, tagId(tenant).carteTest, "TestCoin +10", 2)

    // --- check crédits carte ok ---
    // attente pv "CASHLESS"
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'Service Direct - Cashless'}).waitFor({state: 'visible'})

    // Clique sur le bouton "CHECK CARTE")
    await page.locator('#page-commandes-footer', {hasText: 'CHECK CARTE'}).click()

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless', {hasText: 'Attente lecture carte'}).waitFor({state: 'visible'})

    // émule la carte nfc de Robocop
    await emulateTagIdNfc(page, tagId(tenant).carteTest)

    await expect(page.locator('#popup-cashless > div div[class="popup-msg1 test-item-monnaie"] span[class="test-valeur-monnaie"]')).toHaveText('20')

    // sortir de "popup-cashless"
    await page.locator('#popup-retour').click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()
  })

  test('Trois "retour consigne" paiement par cashless.', async () => {
    await goPointSale(page, 'BAR 1')

    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'Service Direct - Bar 1'}).waitFor({state: 'visible'})

    // trois articles "Retour Consigne"
    await page.locator(`#products div[data-name-pdv="Bar 1"] bouton-article[nom="Retour Consigne"]`).click({clickCount: 3})

    // valider commande
    await page.locator('#bt-valider').click()

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless').waitFor({state: 'visible'})

    // paiement par cashless
    await page.locator('#popup-cashless bouton-basique >> text=CASHLESS').click()

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless', {hasText: 'Attente lecture carte'}).waitFor({state: 'visible'})

    // émule la carte nfc de Robocop
    emulateTagIdNfc(page, tagId(tenant).carteTest)

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless', {hasText: 'OK'}).waitFor({state: 'visible'})

    // retour message serveur "'Retour de consigne OK !"
    await expect(page.locator('#popup-cashless .popup-titre1', {hasText: 'Retour de consigne OK !'})).toBeVisible()

    // fond d'écran =  'rgb(51, 148, 72)'
    const backGroundColor = await page.evaluate(async () => {
      return document.querySelector('#popup-cashless').style.backgroundColor
    })
    expect(backGroundColor).toEqual('rgb(51, 148, 72)')

    // message creditation carte cashless
    await expect(page.locator('#popup-cashless .popup-paragraphe div[class="popup-msg1 test-msg-retour-consigne-nfc"]')).toHaveText('Votre carte est crédité de 3 TestCoin')

    // Cliquer sur le bouton "RETOUR"
    await page.locator('#popup-retour').click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()

     // --- check crédits carte = 23 ---
    await page.locator('#page-commandes-footer', {hasText: 'CHECK CARTE'}).click()

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless', {hasText: 'Attente lecture carte'}).waitFor({state: 'visible'})

    // émule la carte nfc de Robocop
    await emulateTagIdNfc(page, tagId(tenant).carteTest)

    await expect(page.locator('#popup-cashless > div div[class="popup-msg1 test-item-monnaie"] span[class="test-valeur-monnaie"]')).toHaveText('23')

    // sortir de "popup-cashless"
    await page.locator('#popup-retour').click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()
    await page.close()
  })
})