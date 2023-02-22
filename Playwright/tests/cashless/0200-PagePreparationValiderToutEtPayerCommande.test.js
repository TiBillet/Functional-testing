import {test, expect} from '@playwright/test'
import {
  userAgentString,
  connection,
  goTableOrder,
  articlesListIsVisible,
  bigToFloat,
  goPointSale,
  confirmation
} from '../../mesModules/commun.js'

test.use({userAgent: userAgentString})
test.use({viewport: {width: 1024, height: 800}})

const urlTester = 'http://localhost:8001/wv/'

let page
// la liste d'articles
const listeArticles = [{nom: "Pression 33", nb: 2, prix: 2}, {nom: "CdBoeuf", nb: 1, prix: 25}, {
  nom: "Gateau",
  nb: 1,
  prix: 8
}]

test.describe('Préparation de la table S01 commandée par le test 0110, tout servir et payer.', () => {
  test('Context, connexion.', async ({browser}) => {
    page = await browser.newPage()
    await connection(page, urlTester)
  })

  test('Etat commande table S01 (non payée).', async () => {
    // Aller à la table S01
    await goTableOrder(page, 'S01')

    // attente affichage de la commande
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'article(s) de S01'}).waitFor({state: 'visible'})

    //bouton Tout, Valeur et Prépara. présents
    await expect(page.locator('#commandes-table-menu div >> text=Tout')).toBeVisible()
    await expect(page.locator('#commandes-table-menu div >> text=Valeur')).toBeVisible()
    await expect(page.locator('#commandes-table-menu div >> text=Prépara.')).toBeVisible()

    // Liste d'articles complète
    await articlesListIsVisible(page, listeArticles)

    // Déjà payé vide
    await expect(page.locator('#addition-liste-deja-paye')).toBeEmpty()

    // Addition vide
    await expect(page.locator('#addition-liste')).toBeEmpty()

    // total de "reste à payer" = 37
    const resteApayer = 37
    await expect(page.locator('#addition-reste-a-payer')).toHaveText(bigToFloat(resteApayer).toString())
  })

  test('Etat page préparation = "Non servie - Non payée" pour la table S01.', async () => {
    // Clique sur "Prépara." et attend le retour des préparations pour la table S01
    const [response] = await Promise.all([
      page.waitForResponse('http://localhost:8001/wv/preparation/1'),
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
            await expect(page.locator('.com-conteneur', {hasText: nomArticle}).locator('.com-titre-conteneur .com-titre-partie-centre div:nth-child(2)', {hasText: infoTicket})).toBeVisible()

            // nom de table
            await expect(page.locator('.com-conteneur', {hasText: nomArticle}).locator('.com-titre-conteneur .com-titre-partie-centre div:nth-child(4)', {hasText: tableName})).toBeVisible()

            // statut préparation
            await expect(page.locator('.com-conteneur', {hasText: nomArticle}).locator('.com-titre-conteneur .com-titre-partie-droite div:nth-child(1)', {hasText: 'Non servie - Non payée'})).toBeVisible()

            // bt valider
            await expect(page.locator('.com-conteneur', {hasText: nomArticle}).locator('.com-articles-valider-conteneur .com-articles-valider .com-bt-valider-normal i[class="fas fa-check"]')).toBeVisible()
          }

          // présence du nombre d'article à servir
          await expect(page.locator('.com-article-infos', {hasText: nomArticle}).locator('.test-reste-servir', {hasText: nombreArticles})).toBeVisible()

          // présence du nom de l'article
          await expect(page.locator('.com-article-infos', {hasText: nomArticle}).locator('.test-nom', {hasText: nomArticle})).toBeVisible()
        }
      }
    }
  })

  test('Préparation table S01, valider "CdBoeuf et Gateau".', async () => {
    // Valiadtion du premier lieu de préparation (CdBoeuf et Gateau) et attente du retour des préparations pour la table S01
    await Promise.all([
      page.waitForResponse('http://localhost:8001/wv/preparation'),
      // clique sur valider
      await page.locator('.com-conteneur', {hasText: 'CdBoeuf'}).locator('.com-bt-valider-normal i[class="fas fa-check"]').click()
    ])

    // TODO: vérifier  le ticket et le statut de la commande
    // Attention le ticket ne correspond pas au lieu de préparation
    // Attention, même commande, 2 lieux de prépa différents, une seule validation de prépa d'un lieu entraine
    // un statut erroné = "Non servie - Nonpayée"

    // dev pour casser le test
    // await page.evaluate( () => {
    //   document.querySelectorAll('.com-conteneur')[1].style.opacity = 0.2
    // })
    // opacitée de la commande = 0.5
    await expect(page.locator('.com-conteneur', {hasText: 'CdBoeuf'})).toHaveCSS('opacity', '0.5')

    // Valiadtion du 2émé lieu de préparation (Pression 33) et attente du retour pour la table S01
    await Promise.all([
      page.waitForResponse('http://localhost:8001/wv/preparation'),
      // clique sur valider
      await page.locator('.com-conteneur', {hasText: 'Pression 33'}).locator('.com-bt-valider-normal i[class="fas fa-check"]').click()
    ])

    // opacitée de la commande = 0.5
    await expect(page.locator('.com-conteneur', {hasText: 'Pression 33'})).toHaveCSS('opacity', '0.5')

    // statut des commandes une fois servies
    await expect(page.locator('.com-conteneur', {hasText: 'CdBoeuf'}).locator('.com-titre-partie-droite')).toHaveText('Servie - Non payée')
    await expect(page.locator('.com-conteneur', {hasText: 'Pression 33'}).locator('.com-titre-partie-droite')).toHaveText('Servie - Non payée')
  })


  test('Etat de la commande de la table S01(articles servis) et payer le reste.', async () => {
    // Aller à la table S01 pour le paiement de la commande
    await goTableOrder(page, 'S01')

    // attente affichage de la commande
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'article(s) de S01'}).waitFor({state: 'visible'})

    // Les articles sont servis (nombre + icon)
    const liste = page.locator('#commandes-table-articles bouton-commande-article')
    const count = await liste.count()
    for (let i = 0; i < count; ++i) {
      await expect(liste.nth(i).locator('.ele-conteneur div').nth(1).locator('i')).toHaveClass('article-statut-icon fas fa-concierge-bell')
      await expect(liste.nth(i).locator('.ele-conteneur div').nth(2)).toHaveText('0')
    }

    // Tout payer, cliquer bouton "Tout"
    await page.locator('#commandes-table-menu div >> text=Tout').click()

    // valier
    await page.locator('#bt-valider-total-restau').click()

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

    // bouton "RETOUR" présent
    await expect(page.locator('#popup-cashless #popup-retour')).toBeVisible()

    // sortir de "popup-cashless"
    await page.locator('#popup-retour').click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()
  })

  test('Préparations, état, table S01 servie et payée.', async () => {
    await goTableOrder(page, 'S01')

    // attente affichage de la commande
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'article(s) de S01'}).waitFor({state: 'visible'})

    // Clique sur "Prépara." et attend le retour des préparations pour la table S01
    await Promise.all([
      page.waitForResponse('http://localhost:8001/wv/preparation/1'),
      page.locator('#commandes-table-menu div >> text=Prépara.').click()
    ])

    // commandes grisées
    await expect(page.locator('.com-conteneur', {hasText: 'CdBoeuf'})).toHaveCSS('opacity', '0.5')
    await expect(page.locator('.com-conteneur', {hasText: 'Pression 33'})).toHaveCSS('opacity', '0.5')

    // statut des commandes
    await expect(page.locator('.com-conteneur', {hasText: 'CdBoeuf'}).locator('.com-titre-partie-droite')).toHaveText('Servie et Payée')
    await expect(page.locator('.com-conteneur', {hasText: 'Pression 33'}).locator('.com-titre-partie-droite')).toHaveText('Servie et Payée')

    // aller au point de vente 'RESTO'
    await goPointSale(page, 'RESTO')

    // attente affichage de la commande
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'Sélectionner une table : Resto'}).waitFor({state: 'visible'})

    // la table "S01" est libre, couleur de fond = 'rgb(57, 232, 10)'
    await expect(page.locator('#tables-liste .table-bouton', {hasText: 'S01'}).locator('.table-etat')).toHaveCSS('background-color', 'rgb(57, 232, 10)')

    await page.close()
  })

  // TODO: point de vente / resto / la table S01 est libre
})
