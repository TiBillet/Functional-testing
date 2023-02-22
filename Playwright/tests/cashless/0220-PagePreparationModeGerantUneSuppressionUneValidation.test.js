import {test, expect} from '@playwright/test'
import {userAgentString, connection, managerMode, goTableOrder, bigToFloat} from '../../mesModules/commun.js'

test.use({userAgent: userAgentString})
test.use({viewport: {width: 1024, height: 800}})

const urlTester = 'http://localhost:8001/wv/'

let page
// la liste d'articles
const listeArticles = [{nom: "Despé", nb: 2, prix: 3.2}, {nom: "CdBoeuf", nb: 1, prix: 25},
  {nom: "Café", nb: 2, prix: 1}]

test.describe('Préparation(S02 commande du test 0120, status: "Non Servie - Payée") mode gérant.', () => {
  test('Context, connexion.', async ({browser}) => {
    page = await browser.newPage()
    await connection(page, urlTester)
  })

  /* // dev
  test("Préparations(table S02), état mode gérant.", async () => {
    // Passage en mode gérant
    await managerMode(page, 'on')

    // Aller à la table S02
    await goTableOrder(page, 'S02')

    await Promise.all([
      page.waitForResponse('http://localhost:8001/wv/preparation/2'),
      page.locator('#commandes-table-menu div >> text=Prépara.').click()
    ])
  })
  */

  test("Préparations(table S02), état mode gérant.", async () => {
    // Passage en mode gérant
    await managerMode(page, 'on')

    // Aller à la table S02
    await goTableOrder(page, 'S02')

    // attente affichage de la commande
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'article(s) de S02'}).waitFor({state: 'visible'})

    // Cliquer sur "Prépara." et attendre le retour des préparations pour la table S02
    const [response] = await Promise.all([
      page.waitForResponse('http://localhost:8001/wv/preparation/2'),
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
            if (articles.length > 1) {
              await expect(page.locator('.com-conteneur', {hasText: nomArticle}).locator('.com-article-ligne').last().locator('.com-ident1 i')).toBeVisible()
            } else {
              // un seul bouton "RESET" donc bouton "grille" absent
              await expect(page.locator('.com-conteneur', {hasText: nomArticle}).locator('.com-article-ligne').last()).toHaveCount(1)
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

  test('Préparations(table S02), bouton "grille"(tout sélectioner) et "RESET".', async () => {
    // titre = "Préparations"
    await expect(page.locator('.navbar-horizontal .titre-vue')).toHaveText('Préparations')

    // Cliquer sur bouton "grille"
    await page.locator('.com-conteneur', {hasText: 'Café'}).locator('.com-article-ligne').last().locator('.com-ident1 i').click()

    // liste partielle d'articles  = Café et despé
    const listePartielle = [{nom: "Despé", nb: 2, prix: 3.2}, {nom: "Café", nb: 2, prix: 1}]

    // tous les articles d'une commande sont sélectionnés
    for (let i = 0; i < listePartielle.length; ++i) {
      const article = listePartielle[i]
      await expect(page.locator('.com-conteneur', {hasText: article.nom}).locator('.com-article-ligne', {hasText: article.nom}).locator('.com-article-infos', {hasText: `${article.nb} sur ${article.nb} ${article.nom}`})).toBeVisible()
    }

    // Cliquer sur bouton "RESET"
    await page.locator('.com-conteneur', {hasText: 'Despé'}).locator('.com-article-ligne').last().locator('.com-ident3', {hasText: 'RESET'}).click()

    // La sélection des articles est remise à l'état initial
    for (let i = 0; i < listePartielle.length; ++i) {
      const article = listePartielle[i]
      await expect(page.locator('.com-conteneur', {hasText: article.nom}).locator('.com-article-ligne', {hasText: article.nom}).locator('.com-article-infos', {hasText: `0 sur ${article.nb} ${article.nom}`})).toBeVisible()
    }
  })

  test("Préparations(table S02), suppression d'un article mais aucun article sélectionné.", async () => {
    // Cliquer le bouton "SUPPRIMER ARTICLE(S)" du lieu de préparation de l'article "Café"
    await page.locator('.com-conteneur', {hasText: 'Café'}).locator('.com-article-footer .com-ident-supp').click()

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless').waitFor({state: 'visible'})

    // Méssage "Aucun article n'a été selectioné !" est visible
    await expect(page.locator('#popup-cashless', {hasText: "Aucun article n'a été selectioné !"})).toBeVisible()

    // Bouton "RETOUR" présent/visible
    await expect(page.locator('#popup-cashless #popup-retour')).toBeVisible()

    // sortir de "popup-cashless"
    await page.locator('#popup-retour').click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()
  })

  test("Préparations(table S02), un article sélectionné et supprimé.", async () => {
    // attente affichage page "Préparations"
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'Préparations'}).waitFor({state: 'visible'})

    // sélectionne un "Café"
    const article = listeArticles.find(art => art.nom === 'Café')
    await page.locator('.com-article-ligne', {hasText: article.nom}).locator('.com-article-actions .com-ident1 i[class="fas fa-plus"]').click()

    // sélection = 1, maxi = 2 et non de l'article = Café sont affichés
    await expect(page.locator('.com-article-ligne', {hasText: article.nom}).locator('.com-article-infos', {hasText: `1 sur ${article.nb} ${article.nom}`})).toBeVisible()

    // Cliquer sur le bouton "SUPPRIMER ARTICLE(S)" et attendre le retour des préparations pour la table S02
    // TODO: ajouter une étape de confirmation
    await Promise.all([
      page.waitForResponse('http://localhost:8001/wv/preparation'),
      await page.locator('.com-conteneur', {hasText: article.nom}).locator('.com-article-footer .com-ident-supp').click()
    ])

    // titre = "Préparations"
    await expect(page.locator('.navbar-horizontal .titre-vue')).toHaveText('Préparations')

    // sélection = 0, maxi = 1 et non de l'article = Café sont affichés
    await expect(page.locator('.com-article-ligne', {hasText: 'Café'}).locator('.com-article-infos', {hasText: `0 sur 1 ${article.nom}`})).toBeVisible()
  })

  test("Préparations(table S02), un article sélectionné et validé, lieu toujours visible.", async () => {
    // titre = "Préparations"
    await expect(page.locator('.navbar-horizontal .titre-vue')).toHaveText('Préparations')

    // sélectionne un "Despé"
    const article = listeArticles.find(art => art.nom === 'Despé')
    await page.locator('.com-article-ligne', {hasText: article.nom}).locator('.com-article-actions .com-ident1 i[class="fas fa-plus"]').click()

    // sélection = 1, maxi = 2 et non de l'article = Despé sont affichés
    await expect(page.locator('.com-article-ligne', {hasText: article.nom}).locator('.com-article-infos', {hasText: `1 sur ${article.nb} ${article.nom}`})).toBeVisible()

    // Cliquer sur le bouton "VALIDER PREPARATION" et attendre le retour des préparations pour la table S02
    // TODO: ajouter une étape de confirmation
    await Promise.all([
      page.waitForResponse('http://localhost:8001/wv/preparation'),
      await page.locator('.com-conteneur', {hasText: article.nom}).locator('.com-article-footer .com-ident-val').click()
    ])

    // titre = "Préparations"
    await expect(page.locator('.navbar-horizontal .titre-vue')).toHaveText('Préparations')

    // sélection = 0, maxi = 1 et non de l'article = Despé sont affichés
    await expect(page.locator('.com-article-ligne', {hasText: article.nom}).locator('.com-article-infos', {hasText: `0 sur 1 ${article.nom}`})).toBeVisible()

    // le lieu de préparation contenant l'article "despé" est visible
    await expect(page.locator('#service-commandes')).toContainText('Despé')
  })

  test("Préparations(table S02), Toutes les prépartions du lieu sont validées, il n'est plus visible.", async () => {
    // titre = "Préparations"
    await expect(page.locator('.navbar-horizontal .titre-vue')).toHaveText('Préparations')

    // Cliquer sur bouton "grille"
    await page.locator('.com-conteneur', {hasText: 'Café'}).locator('.com-article-ligne').last().locator('.com-ident1 i').click()

    // Cliquer sur le bouton "VALIDER PREPARATION" et attendre le retour des préparations pour la table S02
    await Promise.all([
      page.waitForResponse('http://localhost:8001/wv/preparation'),
      await page.locator('.com-conteneur', {hasText: 'Café'}).locator('.com-article-footer .com-ident-val').click()
    ])

    // titre = "Préparations"
    await expect(page.locator('.navbar-horizontal .titre-vue')).toHaveText('Préparations')

    // le lieu de préparation contenant l'article "Café" et Despé n'est plus visible
    await expect(page.locator('#service-commandes')).not.toContainText('Café')
    await expect(page.locator('#service-commandes')).not.toContainText('Despé')

    // le deuxième lieu contenant l'article "CdBoeuf" est visible
    // le lieu de préparation contenant l'article "despé" est visible
    await expect(page.locator('#service-commandes')).toContainText('CdBoeuf')
  })

  test("Préparations(table S02), toutes les préparations  validés, lieux grisés.", async () => {
    // sélectionne un "CdBoeuf"
    const article = listeArticles.find(art => art.nom === 'CdBoeuf')
    await page.locator('.com-article-ligne', {hasText: article.nom}).locator('.com-article-actions .com-ident1 i[class="fas fa-plus"]').click()

    // Cliquer sur le bouton "VALIDER PREPARATION" et attendre le retour des préparations pour la table S02
    await Promise.all([
      page.waitForResponse('http://localhost:8001/wv/preparation'),
      await page.locator('.com-conteneur', {hasText: article.nom}).locator('.com-article-footer .com-ident-val').click()
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

    // repère les lieux par rapport à l'un de leurs articles (attention: un Café déja supprimé, donc nb Café = 1)
    const conteneurPrepa = [[{nom: "CdBoeuf", nb: 1}], [{nom: "Café", nb: 1}, {nom: "Despé", nb: 2}]]
    for (const conteneurPrepaKey in conteneurPrepa) {
      const articles = conteneurPrepa[conteneurPrepaKey]
      for (let i = 0; i < articles.length; i++) {
        const article = articles[i]

        // pour chaque lieu de préparation (cuisine, bar, ...) tester une fois seulement
        if (i === 0) {
          // statut préparation
          await expect(page.locator('.com-conteneur', {hasText: article.nom}).locator('.com-titre-conteneur .com-titre-partie-droite div:nth-child(1)', {hasText: 'Servie et Payée'})).toBeVisible()

          // bouton "Grille" (sélection de tous les articles) visible
          if (articles.length > 1) {
            await expect(page.locator('.com-conteneur', {hasText: article.nom}).locator('.com-article-ligne').last().locator('.com-ident1 i')).toBeVisible()
          } else {
            // un seul bouton "RESET" donc bouton "grille" absent
            await expect(page.locator('.com-conteneur', {hasText: article.nom}).locator('.com-article-ligne').last()).toHaveCount(1)
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
    await page.close()
  })
})
