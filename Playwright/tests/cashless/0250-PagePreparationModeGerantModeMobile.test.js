import {test, expect} from '@playwright/test'
import {
  userAgentString,
  connection,
  managerMode,
  goTableOrder,
  articlesListNoVisible,
  checkAlreadyPaidBill,
  bigToFloat
} from '../../mesModules/commun.js'

test.use({userAgent: userAgentString})
test.use({viewport: {width: 600, height: 800}})

const urlTester = 'http://localhost:8001/wv/'

let page
// la liste d'articles
const listeArticles = [{nom: "Eau 1L", nb: 1, prix: 1.5}, {nom: "CdBoeuf", nb: 1, prix: 25},
  {nom: "Soft G", nb: 2, prix: 1.5}, {nom: "Despé", nb: 1, prix: 3.2}, {nom: "Café", nb: 3, prix: 1}]
let retour

test.describe.skip('Préparation(EX02 commande du test 0170, status: "Non Servie - Payée") mode gérant, mobile 600x800.', () => {
  test('Context, connexion.', async ({browser}) => {
    page = await browser.newPage()
    await connection(page, urlTester)
  })

  // test bascule bouton "Addition" et la liste
  test('Préparations(table EX02), état page paiement.', async () => {
    // Aller à la table EX01
    await goTableOrder(page, 'EX02')

    // attente affichage de la commande
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'article(s) de EX02'}).waitFor({state: 'visible'})

    // le bouton Prépa est présent
    await expect(page.locator('#commandes-table-menu .categories-table-item .categories-table-nom', {hasText: 'Prépara.'})).toBeVisible()

    // bouton de bascule pour voir l'addition est présent
    await expect(page.locator('#commandes-table-menu .categories-table-item .categories-table-nom', {hasText: 'Addition'})).toBeVisible()

    // la page d'addition n'est pas affichée
    await expect(page.locator('#commandes-table-addition')).toHaveCSS('display', 'none')

    // articles non visibles puisque payés
    const listeNonVisible = await articlesListNoVisible(page)
    expect(listeNonVisible).toEqual(true)

    // cliquer sur le bt "Addition"
    page.locator('#commandes-table-menu .categories-table-item .categories-table-nom', {hasText: 'Addition'}).click()

    // la page article n'est pas affichées
    await expect(page.locator('#commandes-table-articles')).toHaveCSS('display', 'none')

    // la page d'addition est affichée
    await expect(page.locator('#commandes-table-addition')).toHaveCSS('display', 'flex')

    // liste addition déjà payée
    await checkAlreadyPaidBill(page, listeArticles)
  })

  test('Préparations(table EX02), mobile, mode non gérant.', async () => {
    // Cliquer sur "Prépara." et attendre le retour des préparations pour la table EX02
    const [response] = await Promise.all([
      page.waitForResponse('http://localhost:8001/wv/preparation/7'),
      page.locator('#commandes-table-menu div >> text=Prépara.').click()
    ])

    // statut serveur
    const status = response.status()
    expect(status).toEqual(200)

    // données de la commande pour les lieux de préparation
    retour = await response.json()

    // titre = "Préparations"
    await expect(page.locator('.navbar-horizontal .titre-vue')).toHaveText('Préparations')

    // tous les articles sont présents
    for (let i = 0; i < retour.length; i++) {
      const lieuPrepa = retour[i]
      const commandes = lieuPrepa.commandes

      for (const commandesKey in commandes) {
        const commande = commandes[commandesKey]
        const isoTime = new Date(commande.datetime)

        // heure
        const heure = (new Date(commande.datetime)).toLocaleTimeString('fr-FR').substring(0, 5)

        // numero_du_ticket_imprime
        let infoTicket = ''
        for (const [pos, nombre] of Object.entries(commande.numero_du_ticket_imprime)) {
          infoTicket = pos + ' ' + nombre
        }

        // nom de la table
        const tableName = commande.table_name

        // articles [ {.article.name, .qty, .reste_a_payer, .reste_a_servir } ...]
        const articles = commande.articles
        // une partie de l'uuid commandes
        const uudiPart = commande.uuid.substring(0, 3)

        for (let j = 0; j < articles.length; j++) {
          const article = articles[j]
          // nom de l'article
          const nomArticle = article.article.name

          // nombre d'articles
          const nombreArticles = bigToFloat(article.qty).toString()

          // pour chaque lieu de préparation (cuisine, bar, ...) tester une fois seulement la présence(visibilitée) de éléments si-dessous dans le bloque
          if (j === 0) {
            // vérifeir l'affichage de l'heure
            await expect(page.locator('.com-conteneur', {hasText: nomArticle}).locator('.com-titre-conteneur .com-titre-heure div', {hasText: heure})).toBeVisible()

            // lieu de préparation
            await expect(page.locator('.com-conteneur', {hasText: nomArticle}).locator('.com-titre-conteneur .com-titre-partie-droite div', {hasText: infoTicket})).toBeVisible()

            // nom de table
            await expect(page.locator('.com-conteneur', {hasText: nomArticle}).locator('.com-titre-conteneur-plus div:nth-child(2)', {hasText: tableName})).toBeVisible()

            // statut préparation
            await expect(page.locator('.com-conteneur', {hasText: nomArticle}).locator('.com-titre-conteneur-plus div:nth-child(3)', {hasText: 'Non Servie - Payée'})).toBeVisible()
          }
        }
      }
    }
  })

  test('Préparations(table EX02), mobile, mode gérant.', async () => {
    // Passage en mode gérant
    await managerMode(page, 'on')

    // titre = "Préparations"
    await expect(page.locator('.navbar-horizontal .titre-vue')).toHaveText('Préparations')

    // tous les articles sont présents
    for (let i = 0; i < retour.length; i++) {
      const lieuPrepa = retour[i]
      const commandes = lieuPrepa.commandes

      for (const commandesKey in commandes) {
        const commande = commandes[commandesKey]
        const isoTime = new Date(commande.datetime)

        // heure
        const heure = (new Date(commande.datetime)).toLocaleTimeString('fr-FR').substring(0, 5)

        // numero_du_ticket_imprime
        let infoTicket = ''
        for (const [pos, nombre] of Object.entries(commande.numero_du_ticket_imprime)) {
          infoTicket = pos + ' ' + nombre
        }

        // nom de la table
        const tableName = commande.table_name

        // articles [ {.article.name, .qty, .reste_a_payer, .reste_a_servir } ...]
        const articles = commande.articles
        // une partie de l'uuid commandes
        const uudiPart = commande.uuid.substring(0, 3)

        for (let j = 0; j < articles.length; j++) {
          const article = articles[j]
          // nom de l'article
          const nomArticle = article.article.name

          // nombre d'articles
          const nombreArticles = bigToFloat(article.qty).toString()

          // pour chaque lieu de préparation (cuisine, bar, ...) tester une fois seulement la présence(visibilitée) de éléments si-dessous dans le bloque
          if (j === 0) {
            // vérifeir l'affichage de l'heure
            await expect(page.locator('.com-conteneur', {hasText: nomArticle}).locator('.com-titre-conteneur .com-titre-heure div', {hasText: heure})).toBeVisible()

            // lieu de préparation
            await expect(page.locator('.com-conteneur', {hasText: nomArticle}).locator('.com-titre-conteneur .com-titre-partie-droite div', {hasText: infoTicket})).toBeVisible()

            // impression
            await expect(page.locator('.com-conteneur', {hasText: nomArticle}).locator('.com-titre-conteneur .com-titre-partie-droite i[class="fas fa-print"]')).toBeVisible()

            // nom de table
            await expect(page.locator('.com-conteneur', {hasText: nomArticle}).locator('.com-titre-conteneur-plus div:nth-child(2)', {hasText: tableName})).toBeVisible()

            // statut préparation
            await expect(page.locator('.com-conteneur', {hasText: nomArticle}).locator('.com-titre-conteneur-plus div:nth-child(3)', {hasText: 'Non Servie - Payée'})).toBeVisible()

            // partie de l'uuid commandes
            await expect(page.locator('.com-conteneur', {hasText: nomArticle}).locator('.com-titre-conteneur-plus div:nth-child(4)', {hasText: 'id:' + uudiPart})).toBeVisible()

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

            // Bouton "VALIDER PREPARATION" n'est pas visible
            await expect(page.locator('.com-conteneur', {hasText: nomArticle}).locator('.com-article-footer .com-ident-val')).toBeVisible()
          }
        }
      }
    }
    await page.close()
  })
})
