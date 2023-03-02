import {test, expect} from '@playwright/test'
import Big from '../../mesModules/big.js'
import {
  getEnv,
  userAgentString,
  connection,
  bigToFloat,
  goPointSale,
  selectArticles,
  articlesListNoVisible,
  checkAlreadyPaidBill,
  confirmation
} from '../../mesModules/commun.js'

test.use({userAgent: userAgentString})
test.use({ignoreHTTPSErrors: true})
test.use({viewport: {width: 1024, height: 800}})

const env = getEnv()
const tenant = env.tenantToTest
const urlRoot = 'https://' + env.cashlessServer[tenant].subDomain + '.' + env.domain
const urlTester = urlRoot + '/wv/'
let page, resteApayer = new Big(0)

test.describe('Envoyer en préparation et aller à la page de paiement, une "Valeur" partielle  plus 2 articles plus "Tout".', () => {
  /*
   // dev uniquement
   test('aller table Ex03', async ({browser}) => {
     page = await browser.newPage()
     await connection(page, urlTester)
     // attente affichage menu burger
     await page.locator('.navbar-menu i[class~="menu-burger-icon"]').waitFor({state: 'visible'})
     // Clique sur le menu burger
     await page.locator('.menu-burger-icon').click()
     // Click text=TABLES
     await page.locator('text=TABLES').click()
     await page.locator('.navbar-horizontal .titre-vue', {hasText: 'Sélectionner une table : Resto'}).waitFor({state: 'visible'})
     // sélectionne la table
     await page.locator('#tables-liste div[class~="table-bouton"] >> text=Ex04').click()

     // sélection des articles
     const listeArticles = [{nom: "CdBoeuf", nb: 1, prix: 25}, {nom: "Pression 50", nb: 1, prix: 2.5},
       {nom: "Guinness", nb: 2, prix: 4.99}, {nom: "Café", nb: 3, prix: 1}, {
         nom: "Eau 1L",
         nb: 1,
         prix: 1.5
       }, {nom: "Gateau", nb: 1, prix: 8}]
     // reste à payer
     for (let i = 0; i < listeArticles.length; ++i) {
       resteApayer = resteApayer.plus(listeArticles[i].nb * listeArticles[i].prix)
     }
     // "Valeur" partielle
     resteApayer = resteApayer.minus(3)
     // "Gateau" + "Eau 1l"
     resteApayer = resteApayer.minus(9.50)
   })
   */

//prise de commande
  test('Envoyer en préparation.', async ({browser}) => {
    page = await browser.newPage()
    await connection(page, urlTester)

    // attente affichage menu burger
    await page.locator('.navbar-menu i[class~="menu-burger-icon"]').waitFor({state: 'visible'})

    // aller au point de vente "RESTO"
    await goPointSale(page, 'RESTO')
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'Sélectionner une table : Resto'}).waitFor({state: 'visible'})

    // sélectionne la table
    await page.locator('#tables-liste div[class~="table-bouton"] >> text=Ex04').click()

    // pv resto affiché
    await expect(page.locator('.titre-vue >> text=Nouvelle commande sur table Ex04, PV Resto')).toBeVisible()

    // sélection des articles
    const listeArticles = [{nom: "CdBoeuf", nb: 1, prix: 25}, {nom: "Pression 50", nb: 1, prix: 2.5},
      {nom: "Guinness", nb: 2, prix: 4.99}, {nom: "Café", nb: 3, prix: 1},
      {nom: "Eau 1L", nb: 1, prix: 1.5}, {nom: "Gateau", nb: 1, prix: 8}]
    await selectArticles(page, listeArticles, "Resto")

    // reste à payer
    for (let i = 0; i < listeArticles.length; ++i) {
      resteApayer = resteApayer.plus(listeArticles[i].nb * listeArticles[i].prix)
    }

    // valider commande
    await page.locator('#bt-valider').click()

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless').waitFor({state: 'visible'})

    // clique sur "ENVOYER EN PREPARATION ET ALLER A LA PAGE DE PAIEMENT"
    await page.locator('#popup-cashless #test-prepa3').click()
  })


  test('Payer "Valeur" partielle en espèces.', async () => {
    // attendre page de paiement
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'article(s) de Ex04'}).waitFor({state: 'visible'})

    // clique bouton "Valeur"
    await page.locator('#commandes-table-menu .categories-table-item i[class~="fa-keyboard"]').click()

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless').waitFor({state: 'visible'})

    // entrer la valeur 3
    await page.locator('#addition-fractionnee').fill('3')

    // cliquer bouton "VALIDER"
    await page.locator('#popup-cashless bouton-basique', {hasText: "VALIDER"}).click()

    // titre popup-cashless "Type(s) de paiement" présent
    await expect(page.locator('#popup-cashless', {hasText: 'Type(s) de paiement'})).toBeVisible()

    // cliquer bouton "ESPECE"
    await page.locator('#popup-cashless bouton-basique >> text=ESPECE').click()

    // confirmation espèce
    await confirmation(page, 'espece')

    // VALIDER
    await page.locator('#popup-confirme-valider').click()

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless').waitFor({state: 'visible'})

    // fond d'écran =  'rgb(51, 148, 72)'
    const backGroundColor = await page.evaluate(async () => {
      return document.querySelector('#popup-cashless').style.backgroundColor
    })
    expect(backGroundColor).toEqual('rgb(51, 148, 72)')

    // Transaction OK
    await expect(page.locator('#popup-cashless .popup-titre1 >> text=Transaction OK')).toBeVisible()

    // total commande
    await expect(page.locator('#popup-cashless .popup-msg1', {hasText: 'Total'})).toHaveText('Total (espèce) : 3.00')

    // sortir de "popup-cashless"
    await page.locator('#popup-retour').click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()

    // attendre page de paiement
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'article(s) de Ex04'}).waitFor({state: 'visible'})

    // une ligne seulement -- addition-liste-deja-paye .BF-ligne-deb
    await expect(page.locator('#addition-liste-deja-paye .BF-ligne-deb')).toHaveCount(1)

    // vérification de la "valeur partielle" déjà payée de 3€
    await expect(page.locator('#addition-liste-deja-paye .BF-ligne-deb', {hasText: 'Paiement Fractionné'}).locator('.addition-col-qte')).toHaveText('1')
    await expect(page.locator('#addition-liste-deja-paye .BF-ligne-deb', {hasText: 'Paiement Fractionné'}).locator('.addition-col-produit div')).toHaveText('Paiement Fractionné')
    await expect(page.locator('#addition-liste-deja-paye .BF-ligne-deb', {hasText: 'Paiement Fractionné'}).locator('.addition-col-prix div')).toHaveText('3€')

    // total de "reste à payer" ok
    resteApayer = resteApayer.minus(3)
    await expect(page.locator('#addition-reste-a-payer')).toHaveText(bigToFloat(resteApayer).toString())
  })

  test('Payer 2 articles.', async () => {
    // attendre page de paiement
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'article(s) de Ex04'}).waitFor({state: 'visible'})

    // Sélection article "Gateau" et "Eau 1L"
    await page.locator(`#commandes-table-articles bouton-commande-article[data-nom="Gateau"]`).click()
    await page.locator(`#commandes-table-articles bouton-commande-article[data-nom="Eau 1L"]`).click()

    // VALIDER
    await page.locator('#bt-valider-total-restau').click()

    // titre popup-cashless "Type(s) de paiement" présent
    await expect(page.locator('#popup-cashless', {hasText: 'Type(s) de paiement'})).toBeVisible()

    // Total pour moyen de paiement "CB" 5 €
    await expect(page.locator('#popup-cashless bouton-basique', {hasText: 'CB'}).locator('.sous-element-texte >> text=TOTAL')).toHaveText('TOTAL 9.5 €')

    // cliquer bouton "CB"
    await page.locator('#popup-cashless bouton-basique >> text=CB').click()

    // confirmation cb
    await confirmation(page, 'cb')

    // VALIDER
    await page.locator('#popup-confirme-valider').click()

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless').waitFor({state: 'visible'})

    // fond d'écran =  'rgb(51, 148, 72)'
    const backGroundColor = await page.evaluate(async () => {
      return document.querySelector('#popup-cashless').style.backgroundColor
    })
    expect(backGroundColor).toEqual('rgb(51, 148, 72)')

    // Transaction OK
    await expect(page.locator('#popup-cashless .popup-titre1 >> text=Transaction OK')).toBeVisible()

    // total commande
    await expect(page.locator('#popup-cashless .popup-msg1', {hasText: 'Total'})).toHaveText('Total (carte bancaire) : 9.50')

    // sortir de "popup-cashless"
    await page.locator('#popup-retour').click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()

    // maj resteApayer
    resteApayer = resteApayer.minus(9.50)
  })

  test('Retour du paiement des 2 articles.', async () => {
    // attendre page de paiement
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'article(s) de Ex04'}).waitFor({state: 'visible'})

    // une ligne seulement -- addition-liste-deja-paye .BF-ligne-deb
    await expect(page.locator('#addition-liste-deja-paye .BF-ligne-deb')).toHaveCount(3)

    // vérification de l'addition déjà payée: Paiement Fractionné, Gateau et de l'Eau 1L
    const listeAdditionDejaPayee = [{nom: "Paiement Fractionné", nb: 1, prix: 3},
      {nom: "Eau 1L", nb: 1, prix: 1.5}, {nom: "Gateau", nb: 1, prix: 8}]
    await checkAlreadyPaidBill(page, listeAdditionDejaPayee)

    // Reste à payer
    await expect(page.locator('#addition-reste-a-payer')).toHaveText(bigToFloat(resteApayer).toString())
  })

  test('"Tout" payer.', async () => {
    // attendre page de paiement
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'article(s) de Ex04'}).waitFor({state: 'visible'})

    // clique bouton "Tout"
    await page.locator('#commandes-table-menu div >> text=Tout').click()

    // titre popup-cashless "Type(s) de paiement" présent
    await expect(page.locator('#popup-cashless', {hasText: 'Type(s) de paiement'})).toBeVisible()

    // vérification de la valeur du reste "37.48 €" sur le bouton "ESPECE
    await expect(page.locator('#popup-cashless bouton-basique', {hasText: 'ESPECE'}).locator('.sous-element-texte >> text=TOTAL')).toHaveText('TOTAL 37.48 €')

    // cliquer bouton "ESPECE"
    await page.locator('#popup-cashless bouton-basique >> text=ESPECE').click()

    // confirmation espèce
    await confirmation(page, 'espece')

    // VALIDER
    await page.locator('#popup-confirme-valider').click()

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless').waitFor({state: 'visible'})

    // fond d'écran =  'rgb(51, 148, 72)'
    const backGroundColor = await page.evaluate(async () => {
      return document.querySelector('#popup-cashless').style.backgroundColor
    })
    expect(backGroundColor).toEqual('rgb(51, 148, 72)')

    // Transaction OK
    await expect(page.locator('#popup-cashless .popup-titre1 >> text=Transaction OK')).toBeVisible()

    // total commande
    await expect(page.locator('#popup-cashless .popup-msg1', {hasText: 'Total'})).toHaveText('Total (espèce) : 37.48')

    // bouton "RETOUR" présent
    await expect(page.locator('#popup-cashless #popup-retour')).toBeVisible()

    // sortir de "popup-cashless"
    await page.locator('#popup-retour').click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()
  })

  test('Retour après paiement du reste.', async () => {
    // attendre page de paiement
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'article(s) de Ex04'}).waitFor({state: 'visible'})

    // plus d'articles à payer
    await articlesListNoVisible(page)

    // la commande initiale
    const listeArticles = [{nom: "CdBoeuf", nb: 1, prix: 25}, {nom: "Pression 50", nb: 1, prix: 2.5},
      {nom: "Guinness", nb: 2, prix: 4.99}, {nom: "Café", nb: 3, prix: 1},
      {nom: "Eau 1L", nb: 1, prix: 1.5}, {nom: "Gateau", nb: 1, prix: 8}]

    // addition, articles déjà payés
    await checkAlreadyPaidBill(page, listeArticles)

    // total de "reste à payer" ok
    await expect(page.locator('#addition-reste-a-payer')).toHaveText('0')

    // Valider Total = 0
    await expect(page.locator('#bt-valider-total-restau')).toHaveText('TOTAL 0 €')

    // bouton "Tout" non visible
    await expect(page.locator('#commandes-table-menu div >> text=Tout')).toBeHidden()

    // bouton "Valeur" non visible
    await expect(page.locator('#commandes-table-menu div >> text=Valeur')).toBeHidden()

    // bouton "Prépara." est visible
    await expect(page.locator('#commandes-table-menu div >> text=Prépara.')).toBeVisible()

    // fin
    await page.close()
  })

})