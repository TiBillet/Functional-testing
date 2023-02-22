import {test, expect} from '@playwright/test'
import {userAgentString, connection, managerMode, goTableOrder, bigToFloat} from '../../mesModules/commun.js'

test.use({userAgent: userAgentString})
test.use({viewport: {width: 1024, height: 800}})

const urlTester = 'http://localhost:8001/wv/'

let page
// la liste d'articles
const listeArticles = [{nom: "Eau 1L", nb: 1, prix: 1.5}, {nom: "CdBoeuf", nb: 2, prix: 25},
  {nom: "Chimay Rouge", nb: 2, prix: 2.6}, {nom: "Soft G", nb: 1, prix: 1.5}]

test.describe('Préparation(EX01 commande du test 0160, status: "Non Servie - Payée") mode gérant.', () => {
  test('Context, connexion.', async ({browser}) => {
    page = await browser.newPage()
    await connection(page, urlTester)
  })

  /*  // dev (bypass)
  test("Préparations(table EX01), état mode gérant.", async () => {
    // Passage en mode gérant
    await managerMode(page, 'on')

    // Aller à la table EX01
    await goTableOrder(page, 'EX01')

    await Promise.all([
      page.waitForResponse('http://localhost:8001/wv/preparation/6'),
      page.locator('#commandes-table-menu div >> text=Prépara.').click()
    ])
  })
  */

  test("Préparations(table EX01), état mode gérant, Non servie - Non payée., suppression 1er lieu", async () => {
    // Passage en mode gérant
    await managerMode(page, 'on')

    // Aller à la table EX01
    await goTableOrder(page, 'EX01')

    // attente affichage de la commande
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'article(s) de EX01'}).waitFor({state: 'visible'})

    // Cliquer sur "Prépara." et attendre le retour des préparations pour la table EX01
    await Promise.all([
      page.waitForResponse('http://localhost:8001/wv/preparation/6'),
      page.locator('#commandes-table-menu div >> text=Prépara.').click()
    ])

     // titre = "Préparations"
    await expect(page.locator('.navbar-horizontal .titre-vue')).toHaveText('Préparations')

    const article = listeArticles.find(art => art.nom === 'Eau 1L')
    // Cliquer sur bouton "grille"
    await page.locator('.com-conteneur', {hasText: article.nom}).locator('.com-article-ligne').last().locator('.com-ident1 i').click()

    // Cliquer sur le bouton "SUPPRIMER ARTICLE(S)" et attendre le retour des préparations pour la table S02
    await Promise.all([
      page.waitForResponse('http://localhost:8001/wv/preparation'),
      await page.locator('.com-conteneur', {hasText: article.nom}).locator('.com-article-footer .com-ident-supp').click()
    ])

    // le lieu de prépa supprimé est grisé (com-contenur-inactif)
    const opacity0 = await page.evaluate(async () => {
      return document.querySelectorAll('.com-contenur-inactif')[0].classList.contains('com-contenur-inactif')
    })
    expect(opacity0).toEqual(true)

    // repère les lieux par rapport à l'un de leurs articles (tous les articles supprimées, nb = 0)
    const articles = ['Eau 1L', 'Soft G', 'Chimay Rouge']
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i]
      // pour chaque lieu de préparation (cuisine, bar, ...) tester une fois seulement
      if (i === 0) {
        // statut préparation
        await expect(page.locator('.com-conteneur', {hasText: article}).locator('.com-titre-conteneur .com-titre-partie-droite div:nth-child(1)', {hasText: 'Non servie - Non payée'})).toBeVisible()

        // bouton "Grille" (sélection de tous les articles) visible
        if (articles.length > 1 || article.nb > 1) {
          await expect(page.locator('.com-conteneur', {hasText: article}).locator('.com-article-ligne').last().locator('.com-ident1 i')).toBeVisible()
        }
        // Bouton "RESET" visible
        await expect(page.locator('.com-conteneur', {hasText: article}).locator('.com-article-ligne').last().locator('.com-ident3', {hasText: 'RESET'})).toBeVisible()
        // Bouton "SUPPRIMER ARTICLE(S)" visible
        await expect(page.locator('.com-conteneur', {hasText: article}).locator('.com-article-footer .com-ident-supp')).toBeVisible()

        // Bouton "VALIDER PREPARATION" n'est pas visible
        await expect(page.locator('.com-conteneur', {hasText: article}).locator('.com-article-footer .com-ident-val')).not.toBeVisible()
      }

      // icon "plus" visible
      await expect(page.locator('.com-article-ligne', {hasText: article}).locator('.com-article-actions .com-ident1 i[class="fas fa-plus"]')).toBeVisible()
      // sélection = 0, maxi = nombreArticles et non de l'articles sont affichés
      await expect(page.locator('.com-article-ligne', {hasText: article}).locator('.com-article-infos', {hasText: `0 sur 0 ${article}`})).toBeVisible()
    }
  })

  test("Préparations(table EX01), état mode gérant, Non servie - Non payée., suppression 2ème lieu", async () => {
    let article = listeArticles.find(art => art.nom === 'CdBoeuf')

    // Cliquer sur bouton "grille"
    await page.locator('.com-conteneur', {hasText: article.nom}).locator('.com-article-ligne').last().locator('.com-ident1 i').click()

    // Cliquer sur le bouton "SUPPRIMER ARTICLE(S)" et attendre le retour des préparations pour la table S02
    await Promise.all([
      page.waitForResponse('http://localhost:8001/wv/preparation'),
      await page.locator('.com-conteneur', {hasText: article.nom}).locator('.com-article-footer .com-ident-supp').click()
    ])

    // titre = "Préparations"
    await expect(page.locator('.navbar-horizontal .titre-vue')).toHaveText('Préparations')

    // les 2 lieux de prépa supprimés sont grisés (com-contenur-inactif)
    const opacity0 = await page.evaluate(async () => {
      return document.querySelectorAll('.com-contenur-inactif')[0].classList.contains('com-contenur-inactif')
    })
    expect(opacity0).toEqual(true)
    const opacity1 = await page.evaluate(async () => {
      return document.querySelectorAll('.com-contenur-inactif')[1].classList.contains('com-contenur-inactif')
    })
    expect(opacity1).toEqual(true)

    // titre = "Préparations"
    await expect(page.locator('.navbar-horizontal .titre-vue')).toHaveText('Préparations')

    // statut des 2 lieux de préparation
    // TODO: faire un état des lieu pour tous les status
    article = "CdBoeuf"
    await expect(page.locator('.com-conteneur', {hasText: article}).locator('.com-titre-conteneur .com-titre-partie-droite div:nth-child(1)', {hasText: 'Servie et Payée'})).toBeVisible()
    await expect(page.locator('.com-conteneur', {hasText: 'Eau 1L'}).locator('.com-titre-conteneur .com-titre-partie-droite div:nth-child(1)', {hasText: 'Servie et Payée'})).toBeVisible()

    // Bouton "RESET" visible
    await expect(page.locator('.com-conteneur', {hasText: article}).locator('.com-article-ligne').last().locator('.com-ident3', {hasText: 'RESET'})).toBeVisible()

    // Bouton "SUPPRIMER ARTICLE(S)" visible
    await expect(page.locator('.com-conteneur', {hasText: article}).locator('.com-article-footer .com-ident-supp')).toBeVisible()

    // Bouton "VALIDER PREPARATION" n'est pas visible
    await expect(page.locator('.com-conteneur', {hasText: article}).locator('.com-article-footer .com-ident-val')).not.toBeVisible()
    await page.close()
  })
})
