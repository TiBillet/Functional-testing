import {test, expect} from '@playwright/test'
import {
  getEnv,
  userAgentString,
  connection,
  tagId,
  resetCardCashless,
  creditCardCashless,
  goPointSale,
  emulateTagIdNfc,
  selectArticles,
  confirmation,
  totalListeArticles,
  connectionAdmin
} from '../../mesModules/commun.js'

test.use({userAgent: userAgentString})
test.use({ignoreHTTPSErrors: true})
test.use({viewport: {width: 1100, height: 900}})

const env = getEnv()
const tenant = env.tenantToTest
const urlRoot = 'https://' + env.cashlessServer[tenant].subDomain + '.' + env.domain
const urlTester = urlRoot + '/wv/'
let page

// pour la sélection des articles
const listeArticles = [{nom: "Soft P", nb: 1, prix: 1}, {nom: "Soft G", nb: 1, prix: 1.5},
  {nom: "Guinness", nb: 1, prix: 4.99}, {nom: "Despé", nb: 1, prix: 3.2}, {nom: "Chimay Bleue", nb: 1, prix: 2.8},
  {nom: "Chimay Rouge", nb: 1, prix: 2.6}, {nom: "CdBoeuf", nb: 1, prix: 25}, {nom: "Gateau", nb: 1, prix: 8}
]

// pour tester le template ticket Z (données récupérées dans l'app et testées dans l'admin)
let compListArticles = []

test.describe('Check Ticket Z.', () => {
  test('Context, connexion.', async ({browser}) => {
    page = await browser.newPage()
    await connection(page, urlTester)
  })

  test('Crédits: 5 cadeau + 20, le tout en paiement CB.', async () => {
    // vider carte
    await resetCardCashless(page, tagId(tenant).carteTest)

    // créditer la carte de robocop de 1x10 crédits et de 0x5 crédit cadeau
    await creditCardCashless(page, tagId(tenant).carteTest, 2, 1, 'cb')

    // --- check crédits carte ok ---
    // attente pv "CASHLESS"
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'Service Direct - Cashless'}).waitFor({state: 'visible'})

    // Clique sur le bouton "CHECK CARTE")
    await page.locator('#page-commandes-footer', {hasText: 'CHECK CARTE'}).click()

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless', {hasText: 'Attente lecture carte'}).waitFor({state: 'visible'})

    // émule la carte nfc de carteTest
    await emulateTagIdNfc(page, tagId(tenant).carteTest)

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless', {hasText: 'TEST'}).waitFor({state: 'visible'})

    // fond d'écran =  'rgb(51, 148, 72)'
    const backGroundColor = await page.evaluate(async () => {
      return document.querySelector('#popup-cashless').style.backgroundColor
    })
    expect(backGroundColor).toEqual('rgb(51, 148, 72)')

    await expect(page.locator('#popup-cashless > div div[class="popup-msg1 test-item-monnaie"]', {hasText: "- TestCoin : 20"})).toBeVisible()
    await expect(page.locator('#popup-cashless > div div[class="popup-msg1 test-item-monnaie"]', {hasText: "- TestCoin Cadeau : 5"})).toBeVisible()

    // sortir de "popup-cashless"
    await page.locator('#popup-retour').click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()
  })

  test('Articles: 1 SoftP + 1 SoftG + 1 Guinness + 1 Despe + 1 CHimay Bleue + 1 Chimay rouge + 2 CdBoeuf + 1 Gateau', async () => {
    await goPointSale(page, 'BAR 1')

    // attente pv "Bar 1"
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'Service Direct - Bar 1'}).waitFor({state: 'visible'})

    await selectArticles(page, listeArticles, "Bar 1")

    // valider commande
    await page.locator('#bt-valider').click()

    // attente affichage "Type(s) de paiement"
    await page.locator('#popup-cashless', {hasText: 'Type(s) de paiement'}).waitFor({state: 'visible'})

    // payer en cashless
    await page.locator('#popup-cashless bouton-basique >> text=CASHLESS').click()

    // émule la carte nfc de carteTest
    await emulateTagIdNfc(page, tagId(tenant).carteTest)

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless').waitFor({state: 'visible'})

    // fond d'écran =  'rgb(114, 39, 39)'
    let backGroundColor = await page.evaluate(async () => {
      return document.querySelector('#popup-cashless').style.backgroundColor
    })
    expect(backGroundColor).toEqual('rgb(114, 39, 39)')

    // Fonds insuffisants
    await expect(page.locator('#popup-cashless .popup-titre1 >> text=Fonds insuffisants')).toBeVisible()

    // clique sur "CB"
    await page.locator('#popup-cashless bouton-basique >> text=CB').click()

    // confirmation (true pour paiement complémentaire)
    await confirmation(page, 'cb', true)

    // VALIDER
    await page.locator('#popup-confirme-valider').click()

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless', {hasText: 'Transaction OK !'}).waitFor({state: 'visible'})

    // fond d'écran =  'rgb(51, 148, 72)'
    backGroundColor = await page.evaluate(async () => {
      return document.querySelector('#popup-cashless').style.backgroundColor
    })
    expect(backGroundColor).toEqual('rgb(51, 148, 72)')

    // résultat du dom(front)
    const totalOnDom = await page.evaluate(async () => {
      return parseFloat(document.querySelector('#popup-cashless > div > div div[class="popup-msg1 test-total-achats"] #test-somme-payee').innerText)
    })
    // totalArticles = 49,09
    const totalArticles = totalListeArticles(listeArticles)
    expect(totalOnDom).toEqual(totalArticles)

    // sortir de "popup-cashless"
    await page.locator('#popup-retour').click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()

    // await page.close()
  })

  // TibilletCashlessDev/DjangoFiles/administration/templates/rapports/ticketZ.html
  test('Vérification ticket Z admin.', async ({browser}) => {

    compListArticles = [
      {
        nom: 'CdBoeuf',
        qtTotale: '1,00',
        tva: '8,50%',
        prix: '25,00€',
        qtVendue: '1,00',
        qtOfferte: '0,00',
        totalVendue: '25,00€'
      },
      {
        nom: 'Gateau',
        qtTotale: '1,00',
        tva: '2,10%',
        prix: '8,00€',
        qtVendue: '1,00',
        qtOfferte: '0,00',
        totalVendue: '8,00€'
      },
      {
        nom: 'Soft G',
        qtTotale: '1,00',
        tva: '10,00%',
        prix: '1,50€',
        qtVendue: '0,00',
        qtOfferte: '1,00',
        totalVendue: '0,00€'
      },
      {
        nom: 'Soft P',
        qtTotale: '1,00',
        tva: '10,00%',
        prix: '1,00€',
        qtVendue: '0,00',
        qtOfferte: '1,00',
        totalVendue: '0,00€'
      },
      {
        nom: 'Chimay Rouge',
        qtTotale: '1,00',
        tva: '20,00%',
        prix: '2,60€',
        qtVendue: '1,00',
        qtOfferte: '0,00',
        totalVendue: '2,60€'
      },
      {
        nom: 'Chimay Bleue',
        qtTotale: '1,00',
        tva: '20,00%',
        prix: '2,80€',
        qtVendue: '1,00',
        qtOfferte: '0,00',
        totalVendue: '2,80€'
      },
      {
        nom: 'Despé',
        qtTotale: '1,00',
        tva: '20,00%',
        prix: '3,20€',
        qtVendue: '1,00',
        qtOfferte: '0,00',
        totalVendue: '3,20€'
      },
      {
        nom: 'Guinness',
        qtTotale: '1,00',
        tva: '20,00%',
        prix: '4,99€',
        qtVendue: '0,50',
        qtOfferte: '0,50',
        totalVendue: '2,49€'
      }
    ]

    const urlAdmin = 'https://' + env.cashlessServer[tenant].subDomain + '.' + env.domain
    const pageAdmin = await browser.newPage()
    await pageAdmin.goto(urlAdmin)

    // connexion admin
    await connectionAdmin(pageAdmin, tenant)

    // Attend la fin de requête suite au clique sur "Tableaux comptable"
    await Promise.all([
      pageAdmin.waitForRequest(urlRoot + '/adminstaff/APIcashless/rapporttableaucomptable/'),
      pageAdmin.locator('.sidebar-dependent .sidebar-section div a span[class="sidebar-link-label"]', {hasText: 'Tableaux comptable'}).click()
    ])

    // Attend la fin de requête suite au clique sur la première ligne du tableau
    await Promise.all([
      pageAdmin.waitForRequest(urlRoot + '/rapport/**'),
      pageAdmin.locator('#result_list tbody tr > th a').click()
    ])

    // nom du tennat
    // TODO: Jonas pense à corriger le nom tenant
    const errorNameTenant = 'Billetistan'
    await expect(pageAdmin.locator('.test-tenant')).toHaveText(errorNameTenant)

    // Quantités vendues et offertes
    for (const article of compListArticles) {
      const ligne = pageAdmin.locator('tr[class="test-item-qty"]', {hasText: article.nom})
      // article présent
      await expect(ligne).toBeVisible()
      // prix  présent
      await expect(ligne.locator('td[class="test-item-value-prix"]')).toContainText(article.prix)
      // tva  présent
      await expect(ligne.locator('td[class="test-item-value-tva"]')).toContainText(article.tva)
      // quantité vendue
      await expect(ligne.locator('td[class="test-item-value-qtyvendu"]')).toContainText(article.qtVendue)
      // quantité offerte
      await expect(ligne.locator('td[class="test-item-value-qtygift"]')).toContainText(article.qtOfferte)
      // quantité totale
      await expect(ligne.locator('td[class="test-item-value-qtytotal"]')).toContainText(article.qtTotale)
      // total vendu
      await expect(ligne.locator('td[class="test-item-value-total_TTC"]')).toContainText(article.totalVendue)
    }
    await expect(pageAdmin.locator('td[class="test-qty-total-ht"]')).toContainText('39,57€')
    await expect(pageAdmin.locator('td[class="test-qty-total-tva"]')).toContainText('4,52€')
    await expect(pageAdmin.locator('td[class="test-qty-total-ttc"]')).toContainText('44,09€')

    // tva collectée par taux
    const listTaux = [
      {type: '8,50%', collecte: '2,13€'},
      {type: '20,00%', collecte: '2,22€'},
      {type: '2,10%', collecte: '0,17€'},
    ]
    for (const tau of listTaux) {
      const ligne = pageAdmin.locator('tr[class="test-item-tau"]', {hasText: tau.type})
      await expect(ligne.locator('td[class="test-item-tau-type"]')).toContainText(tau.type)
      await expect(ligne.locator('td[class="test-item-tau-type-collecte"]')).toContainText(tau.collecte)
    }
    await expect(pageAdmin.locator('td[class="total-taux-collecte"]')).toContainText('4,52€')

    // total des ventes par moyen de paiement
    // TestCoin
    await expect(pageAdmin.locator('tr[class="test-item1-mp"]', {hasText: 'TestCoin'}).locator('td[class="test-item1-mp-nom"]')).toContainText('TestCoin')
    await expect(pageAdmin.locator('tr[class="test-item1-mp"]', {hasText: 'TestCoin'}).locator('td[class="test-item1-mp-total"]')).toContainText('20,00€')
    // CB
    await expect(pageAdmin.locator('tr[class="test-item1-mp"]', {hasText: 'Carte bancaire'}).locator('td[class="test-item1-mp-nom"]')).toContainText('Carte bancaire')
    await expect(pageAdmin.locator('tr[class="test-item1-mp"]', {hasText: 'Carte bancaire'}).locator('td[class="test-item1-mp-total"]')).toContainText('24,09€')
    // total
    await expect(pageAdmin.locator('td[class="test-items1-mp-total"]')).toContainText('44,09€')
    // TestCoin cadeau
    await expect(pageAdmin.locator('tr[class="test-item2-mp"]', {hasText: 'TestCoin Cadeau'}).locator('td[class="test-item2-mp-nom"]')).toContainText('TestCoin Cadeau')
    await expect(pageAdmin.locator('tr[class="test-item2-mp"]', {hasText: 'TestCoin Cadeau'}).locator('td[class="test-item2-mp-total"]')).toContainText('5,00€')
    // total cadeau
    await expect(pageAdmin.locator('td[class="test-items2-mp-total"]')).toContainText('5,00€')

    // Recharge Cashless TestCoin
    // cb
    await expect(pageAdmin.locator('tr[class="test-item-recharge-testcoin"]', {hasText: 'Carte bancaire'}).locator('td[class="test-item-recharge-testcoin-nom"]')).toContainText('Carte bancaire')
    await expect(pageAdmin.locator('tr[class="test-item-recharge-testcoin"]', {hasText: 'Carte bancaire'}).locator('td[class="test-item-recharge-testcoin-total"]')).toContainText('20,00€')
    // espèce
    await expect(pageAdmin.locator('tr[class="test-item-recharge-testcoin"]', {hasText: 'Espece'}).locator('td[class="test-item-recharge-testcoin-nom"]')).toContainText('Espece')
    await expect(pageAdmin.locator('tr[class="test-item-recharge-testcoin"]', {hasText: 'Espece'}).locator('td[class="test-item-recharge-testcoin-total"]')).toContainText('0,00€')
    // total cadeau
    await expect(pageAdmin.locator('td[class="test-item-recharge-testcoin-total-somme"]')).toContainText('20,00€')

    // Monnaie dormante
    // TestCoin
    await expect(pageAdmin.locator('tr[class="test-item-monnaie-dormante"]', {hasText: '20,00€'}).locator('td[class="test-item-monnaie-dormante-valeur"]')).toContainText('20,00€')
    await expect(pageAdmin.locator('tr[class="test-item-monnaie-dormante"]', {hasText: '20,00€'}).locator('td[class="test-item-monnaie-dormante-reste"]')).toContainText('0,00€')
    // TestCoin cadeau 5
    await expect(pageAdmin.locator('tr[class="test-item-monnaie-dormante"]', {hasText: '5,00'}).locator('td[class="test-item-monnaie-dormante-valeur"]')).toContainText('5,00')
    await expect(pageAdmin.locator('tr[class="test-item-monnaie-dormante"]', {hasText: '5,00'}).locator('td[class="test-item-monnaie-dormante-reste"]')).toContainText('0,00')

    // Adhésions
    await expect(pageAdmin.locator('tr[class="test-item-adhesion"]', {hasText: '1'}).locator('td[class="test-item-adhesion-qt"]')).toContainText('1')
    await expect(pageAdmin.locator('tr[class="test-item-adhesion"]', {hasText: '1'}).locator('td[class="test-item-adhesion-tarif"]')).toContainText('15,00€')
    // total
    await expect(pageAdmin.locator('tr[class="test-item-adhesion-total"]', {hasText: '1'}).locator('td[class="test-item-adhesion-total-qt"]')).toContainText('1')
    await expect(pageAdmin.locator('tr[class="test-item-adhesion-total"]', {hasText: '1'}).locator('td[class="test-item-adhesion-total-tarif"]')).toContainText('15,00€')

    await pageAdmin.close()
  })
})
