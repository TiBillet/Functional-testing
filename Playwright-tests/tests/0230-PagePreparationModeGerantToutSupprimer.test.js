import {test, expect} from '@playwright/test'
import {userAgentString, connection, managerMode, goTableOrder, bigToFloat} from '../mesModules/commun.js'

test.use({userAgent: userAgentString})
test.use({viewport: {width: 1024, height: 800}})

const urlTester = 'http://localhost:8001/wv/'

let page
// la liste d'articles
const listeArticles = [{nom: "Pression 50", nb: 2, prix: 2.5}, {nom: "CdBoeuf", nb: 1, prix: 25},
  {nom: "Gateau", nb: 1, prix: 8}]

test.describe('Préparation(S03 commande du test 0130, status: "Non Servie - Payée") mode gérant.', () => {
  test('Context, connexion.', async ({browser}) => {
    page = await browser.newPage()
    await connection(page, urlTester)
  })

  /*  // dev
  test("Préparations(table S03), état mode gérant.", async () => {
    // Passage en mode gérant
    await managerMode(page, 'on')

    // Aller à la table S03
    await goTableOrder(page, 'S03')

    await Promise.all([
      page.waitForResponse('http://localhost:8001/wv/preparation/3'),
      page.locator('#commandes-table-menu div >> text=Prépara.').click()
    ])
  })
  */

  test("Préparations(table S03), état mode gérant.", async () => {
    // Passage en mode gérant
    await managerMode(page, 'on')

    // Aller à la table S02
    await goTableOrder(page, 'S03')

    // attente affichage de la commande
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'article(s) de S03'}).waitFor({state: 'visible'})

    // Cliquer sur "Prépara." et attendre le retour des préparations pour la table S03
    const [response] = await Promise.all([
      page.waitForResponse('http://localhost:8001/wv/preparation/3'),
      page.locator('#commandes-table-menu div >> text=Prépara.').click()
    ])

    // statut serveur
    const status = response.status()
    expect(status).toEqual(200)

    // données de la commande pour les lieux de préparation
    const retour = await response.json()

    // titre = "Préparations"
    await expect(page.locator('.navbar-horizontal .titre-vue')).toHaveText('Préparations')

    // tous les articles sont présents
    for (let i = 0; i < retour.length; i++) {
      const commandes = retour[i].commandes

      for (const commandesKey in commandes) {
        const articles = commandes[commandesKey].articles
        for (let j = 0; j < articles.length; j++) {
          const article = articles[j]
          // nom de l'article
          const nomArticle = article.article.name
          // nombre d'articles
          const nombreArticles = bigToFloat(article.qty).toString()

          // pour chaque lieu de préparation (cuisine, bar, ...) tester une fois seulement
          if (j === 0) {
            // statut préparation
            await expect(page.locator('.com-conteneur', {hasText: nomArticle}).locator('.com-titre-conteneur .com-titre-partie-droite div:nth-child(1)', {hasText: 'Non Servie - Payée'})).toBeVisible()

            // icon impression visible
            await expect(page.locator('.com-conteneur', {hasText: nomArticle}).locator('.com-titre-conteneur .com-titre-partie-droite .com-bt-imprimer i')).toBeVisible()
            // bouton "Grille" (sélection de tous les articles) visible
            if (articles.length > 1 || nombreArticles > 1) {
              await expect(page.locator('.com-conteneur', {hasText: nomArticle}).locator('.com-article-ligne').last().locator('.com-ident1 i')).toBeVisible()
            }
            // Bouton "RESET" visible
            await expect(page.locator('.com-conteneur', {hasText: nomArticle}).locator('.com-article-ligne').last().locator('.com-ident3', {hasText: 'RESET'})).toBeVisible()

            // Bouton "SUPPRIMER ARTICLE(S)" visible
            await expect(page.locator('.com-conteneur', {hasText: nomArticle}).locator('.com-article-footer .com-ident-supp')).toBeVisible()

            // Bouton "VALIDER PREPARATION" visible
            await expect(page.locator('.com-conteneur', {hasText: nomArticle}).locator('.com-article-footer .com-ident-val')).toBeVisible()
          }

          // icon "plus" visible
          await expect(page.locator('.com-article-ligne', {hasText: nomArticle}).locator('.com-article-actions .com-ident1 i[class="fas fa-plus"]')).toBeVisible()
          // sélection = 0, maxi = nombreArticles et non de l'articles sont affichés
          await expect(page.locator('.com-article-ligne', {hasText: nomArticle}).locator('.com-article-infos', {hasText: `0 sur ${nombreArticles} ${nomArticle}`})).toBeVisible()
        }
      }
    }
  })

  test("Préparations(table S03), supprimer le 1er lieu de préparation.", async () => {
    const article = listeArticles.find(art => art.nom === 'Pression 50')

    // Cliquer sur bouton "grille"
    await page.locator('.com-conteneur', {hasText: article.nom}).locator('.com-article-ligne').last().locator('.com-ident1 i').click()

    // Cliquer sur le bouton "SUPPRIMER ARTICLE(S)" et attendre le retour des préparations pour la table S02
    await Promise.all([
      page.waitForResponse('http://localhost:8001/wv/preparation'),
      await page.locator('.com-conteneur', {hasText: article.nom}).locator('.com-article-footer .com-ident-supp').click()
    ])

    // titre = "Préparations"
    await expect(page.locator('.navbar-horizontal .titre-vue')).toHaveText('Préparations')

    // le lieu de préparation contenant l'article "Pression 50" n'est plus visible
    await expect(page.locator('#service-commandes')).not.toContainText('Pression 50')
  })

  test("Préparations(table S03), supprimer le dernier lieu de préparation.", async () => {
    const article = listeArticles.find(art => art.nom === 'CdBoeuf')

    // Cliquer sur bouton "grille"
    await page.locator('.com-conteneur', {hasText: article.nom}).locator('.com-article-ligne').last().locator('.com-ident1 i').click()

    // Cliquer sur le bouton "SUPPRIMER ARTICLE(S)" et attendre le retour des préparations pour la table S02
    await Promise.all([
      page.waitForResponse('http://localhost:8001/wv/preparation'),
      await page.locator('.com-conteneur', {hasText: article.nom}).locator('.com-article-footer .com-ident-supp').click()
    ])

    // titre = "Préparations"
    await expect(page.locator('.navbar-horizontal .titre-vue')).toHaveText('Préparations')

    // 1er lieu de prépa grisé  'opacity = 0.5 = .com-contenur-inactif'
    const opacity0 = await page.evaluate(async () => {
      return document.querySelectorAll('.com-contenur-inactif')[0].classList.contains('com-contenur-inactif')
    })
    expect(opacity0).toEqual(true)

    // 2ème lieu de prépa grisé  'opacity = 0.5 = .com-contenur-inactif'
    const opacity1 = await page.evaluate(async () => {
      return document.querySelectorAll('.com-contenur-inactif')[1].classList.contains('com-contenur-inactif')
    })
    expect(opacity1).toEqual(true)

    // repère les lieux par rapport à l'un de leurs articles (tous les articles supprimées, nb = 0)
    const conteneurPrepa = [[{nom: "CdBoeuf", nb: 0}, {nom: "Gateau", nb: 0}], [{nom: "Pression 50", nb: 0}]]
    for (const conteneurPrepaKey in conteneurPrepa) {
      const articles = conteneurPrepa[conteneurPrepaKey]
      for (let i = 0; i < articles.length; i++) {
        const article = articles[i]

        // pour chaque lieu de préparation (cuisine, bar, ...) tester une fois seulement
        if (i === 0) {
          // statut préparation
          await expect(page.locator('.com-conteneur', {hasText: article.nom}).locator('.com-titre-conteneur .com-titre-partie-droite div:nth-child(1)', {hasText: 'Servie et Payée'})).toBeVisible()

          // bouton "Grille" (sélection de tous les articles) visible
          if (articles.length > 1 || article.nb > 1) {
            await expect(page.locator('.com-conteneur', {hasText: article.nom}).locator('.com-article-ligne').last().locator('.com-ident1 i')).toBeVisible()
          }
          // Bouton "RESET" visible
          await expect(page.locator('.com-conteneur', {hasText: article.nom}).locator('.com-article-ligne').last().locator('.com-ident3', {hasText: 'RESET'})).toBeVisible()
          // Bouton "SUPPRIMER ARTICLE(S)" visible
          await expect(page.locator('.com-conteneur', {hasText: article.nom}).locator('.com-article-footer .com-ident-supp')).toBeVisible()

          // Bouton "VALIDER PREPARATION" n'est pas visible
          await expect(page.locator('.com-conteneur', {hasText: article.nom}).locator('.com-article-footer .com-ident-val')).not.toBeVisible()
        }

        // icon "plus" visible
        await expect(page.locator('.com-article-ligne', {hasText: article.nom}).locator('.com-article-actions .com-ident1 i[class="fas fa-plus"]')).toBeVisible()
        // sélection = 0, maxi = nombreArticles et non de l'articles sont affichés
        await expect(page.locator('.com-article-ligne', {hasText: article.nom}).locator('.com-article-infos', {hasText: `0 sur ${article.nb} ${article.nom}`})).toBeVisible()
      }
    }


    // TODO: si "0 sur 0" pour tous les articles d'un lieu de prépa, enlever le bt supprimer / grille / reset / plus
    // TODO: et affiché le nombre d'article servi
    await page.close()
  })
})
