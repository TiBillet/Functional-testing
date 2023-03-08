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
  connectionAdmin,
  getPropsArticles
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

test.describe.only('Check Ticket Z.', () => {
  test('Context, connexion.', async ({browser}) => {
    page = await browser.newPage()
    await connection(page, urlTester)
  })

  test.skip('Crédits: 5 cadeau + 20, le tout en paiement CB.', async () => {
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

  test.skip('Articles: 1 SoftP + 1 SoftG + 1 Guinness + 1 Despe + 1 CHimay Bleue + 1 Chimay rouge + 2 CdBoeuf + 1 Gateau', async () => {
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

  test('Récup prix articles du PV Bar 1.', async () => {
    const listeArticlesNue = [{nom: "Soft P", nb: 1}, {nom: "Soft G", nb: 1},
      {nom: "Guinness", nb: 1}, {nom: "Despé", nb: 1}, {nom: "Chimay Bleue", nb: 1},
      {nom: "Chimay Rouge", nb: 1}, {nom: "CdBoeuf", nb: 1}, {nom: "Gateau", nb: 1}
    ]

    // le prix des articles est récupéré dans le scope de l'aplication d'où goPointSale et attente pv "Bar 1"
    await goPointSale(page, 'BAR 1')
    // attente pv "Bar 1"
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'Service Direct - Bar 1'}).waitFor({state: 'visible'})
    // récup données
    const compListArticles = await getPropsArticles(page, listeArticlesNue, 'Bar 1')

    // en attente de codage (utilisation de .skip et .only)
    await page.pause()
    await page.close()
  })

  test.skip('Vérification ticket Z admin.', async ({browser}) => {

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

    await pageAdmin.pause()

    // Attend la fin de requête suite au clique sur la première ligne du tableau
    // TODO: Corriger le nom du tenant, il ne correspond pas !!
    // TibilletCashlessDev/DjangoFiles/administration/templates/rapports/ticketZ.html
    // TODO: @jonas, suivant les données à extraite, il faut données une "class css" aux titres de chaque tableau
    // pour avoir un repère (les données sont dynamique, mais la class reste).
    // exemple, ticketZ.html, ligne 149: <h2 class="test-recharge-cashless-titre">Recharge Cashless <span class="test-recharge-cashless-monnaie">{{ nom_monnaie }}</span></h2>
    await Promise.all([
      pageAdmin.waitForRequest(urlRoot + '/rapport/**'),
      pageAdmin.locator('#result_list tbody tr > th a').click()
    ])

    await pageAdmin.close()
  })
})
