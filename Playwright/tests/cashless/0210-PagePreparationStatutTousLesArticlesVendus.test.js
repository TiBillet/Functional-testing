import {test, expect} from '@playwright/test'
import {userAgentString, connection, goTableOrder, checkAlreadyPaidBill} from '../../mesModules/commun.js'

test.use({userAgent: userAgentString})
test.use({viewport: {width: 1024, height: 800}})

const urlTester = 'http://localhost:8001/wv/'

let page
// la liste d'articles
const listeArticles = [{nom: "Despé", nb: 2, prix: 3.2}, {nom: "CdBoeuf", nb: 1, prix: 25},
  {nom: "Café", nb: 2, prix: 1}]

test.describe('Préparation(S02 commandée par le test 0120), status : "Non Servie - Payée".', () => {
  test('Context, connexion.', async ({browser}) => {
    page = await browser.newPage()
    await connection(page, urlTester)
  })

  test("Etat page paiement de la table S02", async () => {
    // Aller à la table S02
    await goTableOrder(page, 'S02')

    // attente affichage de la commande
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'article(s) de S02'}).waitFor({state: 'visible'})

    // tous les articles déjà payés
    await checkAlreadyPaidBill(page, listeArticles)

    // total de "reste à payer" ok
    await expect(page.locator('#addition-reste-a-payer')).toHaveText('0')

    // Clique sur "Prépara." et attend le retour des préparations pour la table S02
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
          // nom de l'article
          const nomArticle = articles[j].article.name

          // pour chaque lieu de préparation (cuisine, bar, ...) tester une fois seulement
          if (j === 0) {
            // statut préparation
            await expect(page.locator('.com-conteneur', {hasText: nomArticle}).locator('.com-titre-conteneur .com-titre-partie-droite div:nth-child(1)', {hasText: 'Non Servie - Payée'})).toBeVisible()
            // bt valider
            await expect(page.locator('.com-conteneur', {hasText: nomArticle}).locator('.com-articles-valider-conteneur .com-articles-valider .com-bt-valider-normal i[class="fas fa-check"]')).toBeVisible()
          }
        }
      }
    }
    await page.close()
  })
})