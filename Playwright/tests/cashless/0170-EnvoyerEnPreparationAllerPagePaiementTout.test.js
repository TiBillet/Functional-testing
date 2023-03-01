import {test, expect} from '@playwright/test'
import {
  userAgentString,
  connection,
  goPointSale,
  selectArticles,
  articlesListNoVisible,
  checkBill,
  checkAlreadyPaidBill,
  confirmation
} from '../../mesModules/commun.js'

test.use({userAgent: userAgentString})
test.use({viewport: {width: 1024, height: 800}})

const urlTester = 'http://localhost:8001/wv/'

let page
const listeArticles = [{nom: "Eau 1L", nb: 1, prix: 1.5}, {nom: "CdBoeuf", nb: 1, prix: 25},
  {nom: "Soft G", nb: 2, prix: 1.5}, {nom: "Despé", nb: 1, prix: 3.2}, {nom: "Café", nb: 3, prix: 1}]

test.describe.skip('Envoyer en préparation et aller à la page de paiement, sélectionner "Tout".', () => {
  /*
    // dev uniquement
    test('aller table Ex02', async ({browser}) => {
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
      await page.locator('#tables-liste div[class~="table-bouton"] >> text=Ex02').click()
    })
  */

  //prise de commande
  test('Envoyer en préparation et payer en une fois 3 tarticles.', async ({browser}) => {
    page = await browser.newPage()
    await connection(page, urlTester)

    // attente affichage menu burger
    await page.locator('.navbar-menu i[class~="menu-burger-icon"]').waitFor({state: 'visible'})

    // aller au point de vente "RESTO"
    await goPointSale(page, 'RESTO')
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'Sélectionner une table : Resto'}).waitFor({state: 'visible'})

    // sélectionne la table
    await page.locator('#tables-liste div[class~="table-bouton"] >> text=Ex02').click()

    // pv resto affiché
    await expect(page.locator('.titre-vue >> text=Nouvelle commande sur table Ex02, PV Resto')).toBeVisible()

    // sélection des articles
    await selectArticles(page, listeArticles, "Resto")

    // valider commande
    await page.locator('#bt-valider').click()

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless').waitFor({state: 'visible'})

    // clique sur "ENVOYER EN PREPARATION ET ALLER A LA PAGE DE PAIEMENT"
    await page.locator('#popup-cashless #test-prepa3').click()
  })

  test('Tout', async () => {
    // attendre page de paiement
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'article(s) de Ex02'}).waitFor({state: 'visible'})

    // clique bouton "Tout"
    await page.locator('#commandes-table-menu div[onclick="restau.ajouterTousArticlesAddition()"]').click()

    // liste articles cachée
    const listeNonVisible = await articlesListNoVisible(page)
    expect(listeNonVisible).toEqual(true)

    // vérififier addition
    await checkBill(page, listeArticles)

    // VALIDER
    await page.locator('#table-footer-contenu .BF-ligne', {hasText: "VALIDER"}).click()

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless', {hasText: 'Type(s) de paiement'}).waitFor({state: 'visible'})

    // moyen de paiement "CASHLESS" présent
    await expect(page.locator('#popup-cashless bouton-basique >> text=CASHLESS')).toBeVisible()
    // Total pour moyen de paiement "CASHLESS" 35.7 €
    await expect(page.locator('#popup-cashless bouton-basique', {hasText: 'CASHLESS'}).locator('.sous-element-texte >> text=TOTAL')).toHaveText('TOTAL 35.7 €')

    // moyen de paiement "ESPECE" présent
    await expect(page.locator('#popup-cashless bouton-basique >> text=ESPECE')).toBeVisible()
    // Total pour moyen de paiement "ESPECE" 35.7 €
    await expect(page.locator('#popup-cashless bouton-basique', {hasText: 'ESPECE'}).locator('.sous-element-texte >> text=TOTAL')).toHaveText('TOTAL 35.7 €')

    // moyen de paiement "CB" présent
    await expect(page.locator('#popup-cashless bouton-basique >> text=CB')).toBeVisible()
    // Total pour moyen de paiement "CB" 35.7 €
    await expect(page.locator('#popup-cashless bouton-basique', {hasText: 'CB'}).locator('.sous-element-texte >> text=TOTAL')).toHaveText('TOTAL 35.7 €')

    // bouton RETOUR présent
    await expect(page.locator('#popup-cashless bouton-basique >> text=RETOUR')).toBeVisible()

    // clique sur "ESPECE"
    await page.locator('#popup-cashless bouton-basique >> text=ESPECE').click()

    // confirmation espèce
    await confirmation(page, 'espece')

    // VALIDER
    await page.locator('#popup-confirme-valider').click()
  })

  test("Retour pour le paiement en espèces.", async () => {
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
    await expect(page.locator('#popup-cashless .popup-msg1', {hasText: 'Total'})).toHaveText('Total (espèce) : 35.70')

    // bouton "RETOUR" présent
    await expect(page.locator('#popup-cashless #popup-retour')).toBeVisible()

    // sortir de "popup-cashless"
    await page.locator('#popup-retour').click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()
  })

  test("Retour table après le paiement de tous les articles.", async () => {
    // attendre page de paiement
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'article(s) de Ex02'}).waitFor({state: 'visible'})

    // dev, affiche le bouton "Addition" pour casser le test
    // await page.evaluate(async () => {
    //   document.querySelectorAll('#commandes-table-menu .categories-table-item')[0].style.display = 'block'
    // })

    // le bouton "Addition" est caché visu/mode bureau
    await expect(page.locator('#commandes-table-menu-commute-addition')).toHaveCSS('display', 'none')

    // dev, supprime le bouton "Prépara." pour casser le test
    // await page.evaluate(async () => {
    //   document.querySelectorAll('#commandes-table-menu .categories-table-item')[1].remove()
    // })

    // le bouton Prépa est présent
    await expect(page.locator('#commandes-table-menu .categories-table-item .categories-table-nom', {hasText: 'Prépara.'})).toBeVisible()

    // la liste d'articles à payer cachée  --  commandes-table-articles
    const listeNonVisible = await articlesListNoVisible(page)
    expect(listeNonVisible).toEqual(true)

    // la liste d'article déjà payé contient toute la liste  -- addition-liste-deja-paye
    await checkAlreadyPaidBill(page, listeArticles)

    // addition vide
    await expect(page.locator('#addition-liste')).toBeEmpty()

    // total de "reste à payer" et "commandes" ok
    let total = 0, resteApayer = 0
    for (let i = 0; i < listeArticles.length; ++i) {
      total = total + (listeArticles[i].nb * listeArticles[i].prix)
    }
    await expect(page.locator('#addition-reste-a-payer')).toHaveText(resteApayer.toString())
    await expect(page.locator('#addition-total-commandes')).toHaveText(total.toString())

    // VALIDER, total = 0
    await expect(page.locator('#bt-valider-total-restau')).toHaveText('TOTAL 0 €')
  })

  test('Bouton "VALIDER", total = 0.', async () => {
    // clique sur bouton "VALIDER"
    await page.locator('#table-footer-contenu .fond-ok', {hasText: 'VALIDER'}).click()

    // Aucun article n'a été selectioné !
    await expect(page.locator(`#popup-cashless >> text=Aucun article n'a été selectioné !`)).toBeVisible()

    // bouton "RETOUR" présent
    await expect(page.locator('#popup-cashless #popup-retour')).toBeVisible()

    // sortir de "popup-cashless"
    await page.locator('#popup-retour').click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()
  })

  // idem que le test "Retour table après le paiement de tous les articles."
  test('Bouton "RESET".', async () => {
    // clique sur bouton "RESET"
    await page.locator('#table-footer-contenu .fond-retour', {hasText: 'RESET'}).click()

    // attendre page de paiement
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'article(s) de Ex02'}).waitFor({state: 'visible'})

    // le bouton "Addition" est caché visu/mode bureau
    await expect(page.locator('#commandes-table-menu-commute-addition')).toHaveCSS('display', 'none')

    // le bouton Prépa est présent
    await expect(page.locator('#commandes-table-menu .categories-table-item .categories-table-nom', {hasText: 'Prépara.'})).toBeVisible()

    // la liste d'articles à payer cachée  --  commandes-table-articles
    const listeNonVisible = await articlesListNoVisible(page)
    expect(listeNonVisible).toEqual(true)

    // la liste d'article déjà payé contient toute la liste  -- addition-liste-deja-paye
    await checkAlreadyPaidBill(page, listeArticles)

    // addition vide
    await expect(page.locator('#addition-liste')).toBeEmpty()

    // total de "reste à payer" et "commandes" ok
    let total = 0, resteApayer = 0
    for (let i = 0; i < listeArticles.length; ++i) {
      total = total + (listeArticles[i].nb * listeArticles[i].prix)
    }
    await expect(page.locator('#addition-reste-a-payer')).toHaveText(resteApayer.toString())
    await expect(page.locator('#addition-total-commandes')).toHaveText(total.toString())

    // VALIDER, total = 0
    await expect(page.locator('#bt-valider-total-restau')).toHaveText('TOTAL 0 €')
  })

  test('Bouton "RETOUR".', async () => {
    // clique sur bouton "RETOUR"
    await page.locator('#table-footer-contenu .fond-normal', {hasText: 'RETOUR'}).click()

    // retour pour une nouvelle commande, "Sélectionner une table : Resto"
    await expect(page.locator('.navbar-horizontal .titre-vue', {hasText: 'Sélectionner une table : Resto'})).toBeVisible()
    await page.close()
  })
})