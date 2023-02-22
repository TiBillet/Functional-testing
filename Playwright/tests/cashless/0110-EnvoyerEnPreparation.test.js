import {test, expect} from '@playwright/test'
import {userAgentString, connection, goPointSale, selectArticles} from '../../mesModules/commun.js'

test.use({userAgent: userAgentString})
test.use({viewport: {width: 1024, height: 800}})

const urlTester = 'http://localhost:8001/wv/'

let page

test.describe('Commandes', () => {
  test('11 tables minimum dont la table éphémère.', async ({browser}) => {
    page = await browser.newPage()
    await connection(page, urlTester)

    // attente affichage menu burger
    await page.locator('.navbar-menu i[class~="menu-burger-icon"]').waitFor({state: 'visible'})

    // aller au point de vente "RESTO"
    await goPointSale(page, 'RESTO')
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'Sélectionner une table : Resto'}).waitFor({state: 'visible'})

    // au moins, 11 tables présentes
    const nbTables = await page.evaluate(async () => {
      // dev enlève la première table
      // document.querySelector('#tables-liste div[class~="table-bouton"]').remove()
      const liste = document.querySelectorAll('#tables-liste div[class~="table-bouton"]').length
      return liste >= 11 ? true : false
    })
    await expect(nbTables).toEqual(true)

    // table éphémère visible
    await expect(page.locator('#tables-liste div[class~="test-table-ephemere"]')).toBeVisible()

  })

  test('PV resto ok, addition vide.', async () => {
    // sélectionne la première table
    await page.locator('#tables-liste div[class~="table-bouton"] >> text=S01').click()

    // pv resto affiché
    await expect(page.locator('.titre-vue >> text=Nouvelle commande sur table S01, PV Resto')).toBeVisible()

    // addition vide
    // dev, pour casser le test
    //await page.locator('#products div[data-name-pdv="Resto"] bouton-article[nom="Pression 33"]').click()
    await expect(page.locator('#achats-liste')).toBeEmpty()

    // total addition = 0
    await expect(page.locator('#bt-valider-total')).toHaveText('TOTAL 0 €')
  })

  test('Liste addition conforme.', async () => {
    // sélection des articles
    const listeArticles = [{nom: "Pression 33", nb: 2, prix: 2}, {nom: "CdBoeuf", nb: 1, prix: 25}, {
      nom: "Gateau",
      nb: 1,
      prix: 8
    }]
    await selectArticles(page, listeArticles, "Resto")

    // conformité articles sélectionnés avec l'addition
    const liste = ["2 Pression 33 2€", "1 CdBoeuf 25€", "1 Gateau 8€"]
    const lignesAddition = 3
    for (let i = 0; i < lignesAddition; i++) {
      const nbArticle = await page.locator('#achats-liste .achats-ligne').nth(i).locator('.achats-col-qte').innerText()
      const nomArticle = await page.locator('#achats-liste .achats-ligne').nth(i).locator('.achats-ligne-produit-contenu').innerText()
      const prixArticle = await page.locator('#achats-liste .achats-ligne').nth(i).locator('.achats-col-prix-contenu').innerText()
      const ligneTest = nbArticle + ' ' + nomArticle + ' ' + prixArticle
      await expect(liste[i]).toEqual(ligneTest)
    }

    // valider commande
    await page.locator('#bt-valider').click()
  })

  test('Bouton "RETOUR"', async () => {
    // BOUTON RETOUR
    await expect(page.locator('#popup-cashless #popup-retour')).toBeVisible()

    // Clique
    await page.locator('#popup-cashless #popup-retour').click()

    // await page.locator('.navbar-horizontal .titre-vue', {hasText: 'Nouvelle commande sur table S01, PV Resto'}).waitFor({state: 'visible'})
    await expect(page.locator('.navbar-horizontal .titre-vue', {hasText: 'Nouvelle commande sur table S01, PV Resto'})).toBeVisible()

    // valider commande
    await page.locator('#bt-valider').click()
  })

  test("Les types d'envois en préparation.", async () => {
    // ENVOYER EN PREPARATION
    await expect(page.locator('#popup-cashless #test-prepa1')).toBeVisible()

    // ENVOYER EN PREPARATION ET PAYER EN UNE SEULE FOIS
    await expect(page.locator('#popup-cashless #test-prepa2')).toBeVisible()

    // ENVOYER EN PREPARATION ET ALLER A LA PAGE PAIEMENT
    await expect(page.locator('#popup-cashless #test-prepa3')).toBeVisible()

    // clique sur "ENVOYER EN PREPARATION"
    await page.locator('#popup-cashless #test-prepa1').click()
  })

  test("Retour de l'envoi en préparation.", async () => {
    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless').waitFor({state: 'visible'})

    // fond d'écran =  'rgb(51, 148, 72)'
    const backGroundColor = await page.evaluate(async () => {
      return document.querySelector('#popup-cashless').style.backgroundColor
    })
    expect(backGroundColor).toEqual('rgb(51, 148, 72)')

    // Transaction OK !
    await expect(page.locator('#popup-cashless .popup-titre1 >> text=Transaction OK !')).toBeVisible()

    // Envoyée en préparation.
    await expect(page.locator('#popup-cashless .test-msg-prepa >> text=Envoyée en préparation.')).toBeVisible()

    // sortir de "popup-cashless"
    await page.locator('#popup-retour').click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()

    await page.close()
  })
})
