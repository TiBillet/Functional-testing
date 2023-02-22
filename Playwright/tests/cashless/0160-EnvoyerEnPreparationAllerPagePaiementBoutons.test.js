import {test, expect} from '@playwright/test'
import {
  userAgentString,
  connection,
  goPointSale,
  selectArticles,
  checkBill,
  articlesListIsVisible,
  articlesListNoVisible,
  articleIsVisible,
  articleNoVisible
} from '../../mesModules/commun.js'

test.use({userAgent: userAgentString})
test.use({viewport: {width: 1024, height: 800}})

const urlTester = 'http://localhost:8001/wv/'

let page

test.describe('Envoyer en préparation et aller à la page de paiement, tests boutons.', () => {
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
    await page.locator('#tables-liste div[class~="table-bouton"] >> text=Ex01').click()

    // pv resto affiché
    await expect(page.locator('.titre-vue >> text=Nouvelle commande sur table Ex01, PV Resto')).toBeVisible()

    // sélection des articles
    const listeArticles = [{nom: "Eau 1L", nb: 1, prix: 1.5}, {nom: "CdBoeuf", nb: 2, prix: 25},
      {nom: "Chimay Rouge", nb: 2, prix: 2.6}, {nom: "Soft G", nb: 1, prix: 1.5}]
    await selectArticles(page, listeArticles, "Resto")

    // valider commande
    await page.locator('#bt-valider').click()

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless').waitFor({state: 'visible'})

    // clique sur "ENVOYER EN PREPARATION ET ALLER A LA PAGE DE PAIEMENT"
    await page.locator('#popup-cashless #test-prepa3').click()
  })
  /*

  // tempo test pour éviter de refaire la même commande
  test('tempo dev allaer tables Ex01', async ({browser}) => {
    page = await browser.newPage()
    await connection(page, urlTester)

    // attente affichage menu burger
    await page.locator('.navbar-menu i[class~="menu-burger-icon"]').waitFor({state: 'visible'})
    // Clique sur le menu burger
    await page.locator('.menu-burger-icon').click()
    // Click text=POINTS DE VENTES
    await page.locator('text=TABLES').click()

    await page.locator('.navbar-horizontal .titre-vue', {hasText: "Afficher les commandes d'une table"}).waitFor({state: 'visible'})

    // sélectionne la table
    await page.locator('#tables-liste div[class~="table-bouton"] >> text=Ex01').click()
  })
*/
  test("Liste d'article et total sur la page de paiement", async () => {
    // attendre page de paiement
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'article(s) de Ex01'}).waitFor({state: 'visible'})

    const listeArticles = [{nom: "Eau 1L", nb: 1, prix: 1.5}, {nom: "CdBoeuf", nb: 2, prix: 25},
      {nom: "Chimay Rouge", nb: 2, prix: 2.6}, {nom: "Soft G", nb: 1, prix: 1.5}]

    // liste articles
    const articles = page.locator('#commandes-table-articles bouton-commande-article .ele-conteneur')
    const count = await articles.count()
    let listeArticlesDifferente
    for (let i = 0; i < count; ++i) {
      listeArticlesDifferente = true
      const articleNom = (await articles.nth(i).locator('.ele-nom').textContent()).toString().trim()
      const articlePrix = (await articles.nth(i).locator('.ele-prix').textContent()).toString().trim()
      const articleNbRaw = await articles.nth(i).locator('.ele-nombre > span').textContent()
      const articleNb = parseInt(articleNbRaw.trim())
      const compListe = listeArticles.find(ele => ele.nom === articleNom)
      if (compListe.nom === articleNom && compListe.nb === articleNb && (compListe.prix.toString() + ' €') === articlePrix) {
        listeArticlesDifferente = false
      }
    }
    await expect(listeArticlesDifferente).toEqual(false)

    // total de "reste à payer" et "commandes" ok
    let total = 0
    for (let i = 0; i < listeArticles.length; ++i) {
      total = total + (listeArticles[i].nb * listeArticles[i].prix)
    }
    await expect(page.locator('#addition-reste-a-payer')).toHaveText(total.toString())
    await expect(page.locator('#addition-total-commandes')).toHaveText(total.toString())

    // déjà payé vide
    await expect(page.locator('#addition-liste-deja-paye')).toBeEmpty()

    // addition vide
    await expect(page.locator('#addition-liste')).toBeEmpty()
  })

  test('Boutons "Tout", "Reset"', async () => {
    // liste d'articles
    const listeArticles = [{nom: "Eau 1L", nb: 1, prix: 1.5}, {nom: "CdBoeuf", nb: 2, prix: 25},
      {nom: "Chimay Rouge", nb: 2, prix: 2.6}, {nom: "Soft G", nb: 1, prix: 1.5}]

    // clique bouton "Tout"
    await page.locator('#commandes-table-menu div[onclick="restau.ajouterTousArticlesAddition()"]').click()

    // liste articles cachée
    const listeNonVisible = await articlesListNoVisible(page)
    expect(listeNonVisible).toEqual(true)

    // vérififier addition
    await checkBill(page, listeArticles)

    // clique bouton "RESET"
    await page.locator('#table-footer-contenu .fond-retour').click()

    // addition vide
    await expect(page.locator('#addition-liste')).toBeEmpty()

    // tous les articles sont affichés
    const listVisible = await articlesListIsVisible(page)
    expect(listVisible).toEqual(true)
  })

  test("Suppression d'article dans l'addition", async () => {
    // séléction des 2 "CdBoeuf"
    await page.locator(`#commandes-table-articles bouton-commande-article[data-nom="CdBoeuf"]`).click({clickCount: 2})

    // article "CdBoeuf" plus visible dans la liste d'articles
    const articleNonVisible = await articleNoVisible(page, 'CdBoeuf')
    expect(articleNonVisible).toEqual(true)

    // 2 "CdBoeuf" attendue dans l'addition
    await expect(page.locator('#addition-liste .test-addition-article-ligne .addition-col-qte')).toHaveText('2')

    // clique sur le bouton "moins" dans l'addition (sup un coeur de boeuf)
    await page.locator('#addition-liste .test-addition-article-ligne .addition-col-bt i').click()

    // article "CdBoeuf" visible dans la liste d'articles
    const articleVisible = await articleIsVisible(page, 'CdBoeuf')
    expect(articleVisible).toEqual(true)

    // nb article pas encore payer = 1
    await expect(page.locator('#commandes-table-articles bouton-commande-article', {hasText: "CdBoeuf"}).locator('.ele-conteneur .ele-nombre')).toHaveText('1')

    // 1 "CdBoeuf" attendue dans l'addition
    await expect(page.locator('#addition-liste .test-addition-article-ligne .addition-col-qte')).toHaveText('1')

    // clique sur le bouton "moins" dans l'addition (sup un coeur de boeuf)
    await page.locator('#addition-liste .test-addition-article-ligne .addition-col-bt i').click()

    // addition vide
    await expect(page.locator('#addition-liste')).toBeEmpty()

    // nb article pas encore payer = 2
    await expect(page.locator('#commandes-table-articles bouton-commande-article', {hasText: "CdBoeuf"}).locator('.ele-conteneur .ele-nombre')).toHaveText('2')
  })

  test('Bouton "RETOUR".', async () => {
    // clique bouton "RETOUR"
    await page.locator('#table-footer-contenu .BF-ligne div div', {hasText: "RETOUR"}).click()

    // page attendue "Sélectionner une table : Resto"
    await expect(page.locator('.navbar-horizontal .titre-vue')).toHaveText('Sélectionner une table : Resto')
    await page.close()
  })
})