import {test, expect} from '@playwright/test'
import {
  userAgentString,
  connection,
  goPointSale,
  selectArticles,
  articlesListNoVisible,
  checkAlreadyPaidBill,
  confirmation
} from '../../mesModules/commun.js'

test.use({userAgent: userAgentString})
test.use({viewport: {width: 1024, height: 800}})

const urlTester = 'http://localhost:8001/wv/'

let page

test.describe('Envoyer en préparation et aller à la page de paiement, une "Valeur" partielle et sélectionner "Tout".', () => {
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
    await page.locator('#tables-liste div[class~="table-bouton"] >> text=Ex03').click()
  })
  */

  //prise de commande
  test('Envoyer en préparation et payer une partie et le reste .', async ({browser}) => {
    page = await browser.newPage()
    await connection(page, urlTester)

    // attente affichage menu burger
    await page.locator('.navbar-menu i[class~="menu-burger-icon"]').waitFor({state: 'visible'})

    // aller au point de vente "RESTO"
    await goPointSale(page, 'RESTO')
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'Sélectionner une table : Resto'}).waitFor({state: 'visible'})

    // sélectionne la table
    await page.locator('#tables-liste div[class~="table-bouton"] >> text=Ex03').click()

    // pv resto affiché
    await expect(page.locator('.titre-vue >> text=Nouvelle commande sur table Ex03, PV Resto')).toBeVisible()

    // sélection des articles = 34.4€
    const listeArticles = [{nom: "Pression 33", nb: 1, prix: 2}, {nom: "CdBoeuf", nb: 1, prix: 25},
      {nom: "Despé", nb: 2, prix: 3.2}, {nom: "Café", nb: 1, prix: 1}]
    await selectArticles(page, listeArticles, "Resto")

    // valider commande
    await page.locator('#bt-valider').click()

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless').waitFor({state: 'visible'})

    // clique sur "ENVOYER EN PREPARATION ET ALLER A LA PAGE DE PAIEMENT"
    await page.locator('#popup-cashless #test-prepa3').click()
  })

  test('Valeur partielle, titre et bouton "RETOUR".', async () => {
    // attendre page de paiement
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'article(s) de Ex03'}).waitFor({state: 'visible'})

    // clique bouton "Valeur"
    await page.locator('#commandes-table-menu .categories-table-item i[class~="fa-keyboard"]').click()

    // popup avec le titre "Somme"
    await expect(page.locator('#popup-cashless h1')).toHaveText('Somme')

    // boouton "RETOUR" présent
    await expect(page.locator('#popup-cashless #popup-retour')).toBeVisible()

    // cliquer bouton "RETOUR"
    await page.locator('#popup-cashless #popup-retour').click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()

    // on revient sur la table
    await expect(page.locator('.navbar-horizontal .titre-vue', {hasText: 'article(s) de Ex03'})).toBeVisible()
  })

  test("Valeur partielle plus grande que l'addition.", async () => {
    // attendre page de paiement
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'article(s) de Ex03'}).waitFor({state: 'visible'})

    // clique bouton "Valeur"
    await page.locator('#commandes-table-menu .categories-table-item i[class~="fa-keyboard"]').click()

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless').waitFor({state: 'visible'})

    // champ input présent
    await expect(page.locator('#addition-fractionnee')).toBeVisible()

    // bouton "VALIDER" présent
    await expect(page.locator('#popup-cashless bouton-basique', {hasText: "VALIDER"})).toBeVisible()

    // entrer la valeur 100000
    await page.locator('#addition-fractionnee').fill('100000')

    // cliquer bouton "VALIDER"
    await page.locator('#popup-cashless bouton-basique', {hasText: "VALIDER"}).click()

    // message "Valeur supérieure à l'addition !" visible
    await expect(page.locator('#addition-fractionnee-msg-erreur', {hasText: "Valeur supérieure à l'addition !"})).toBeVisible()

    // cliquer bouton "RETOUR"
    await page.locator('#popup-cashless #popup-retour').click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()
  })

  test("Valeur partielle = -0.1 .", async () => {
    // attendre page de paiement
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'article(s) de Ex03'}).waitFor({state: 'visible'})

    // clique bouton "Valeur"
    await page.locator('#commandes-table-menu .categories-table-item i[class~="fa-keyboard"]').click()

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless').waitFor({state: 'visible'})

    // entrer la valeur -0.1
    await page.locator('#addition-fractionnee').fill('-0.1')

    // cliquer bouton "VALIDER"
    await page.locator('#popup-cashless bouton-basique', {hasText: "VALIDER"}).click()

    // message "Valeur plus petite ou égale à 0 !" visible
    await expect(page.locator('#addition-fractionnee-msg-erreur', {hasText: "Valeur plus petite ou égale à 0 !"})).toBeVisible()

    // cliquer bouton "RETOUR"
    await page.locator('#popup-cashless #popup-retour').click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()
  })

  test("Valeur partielle = 0.", async () => {
    // attendre page de paiement
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'article(s) de Ex03'}).waitFor({state: 'visible'})

    // clique bouton "Valeur"
    await page.locator('#commandes-table-menu .categories-table-item i[class~="fa-keyboard"]').click()

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless').waitFor({state: 'visible'})

    // entrer la valeur 0
    await page.locator('#addition-fractionnee').fill('0')

    // cliquer bouton "VALIDER"
    await page.locator('#popup-cashless bouton-basique', {hasText: "VALIDER"}).click()

    // message "Valeur plus petite ou égale à 0 !" visible
    await expect(page.locator('#addition-fractionnee-msg-erreur', {hasText: "Valeur plus petite ou égale à 0 !"})).toBeVisible()

    // cliquer bouton "RETOUR"
    await page.locator('#popup-cashless #popup-retour').click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()
  })

  test("Valeur partielle, du texte est entré à la place d'un nombre.", async () => {
    // attendre page de paiement
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'article(s) de Ex03'}).waitFor({state: 'visible'})

    // clique bouton "Valeur"
    await page.locator('#commandes-table-menu .categories-table-item i[class~="fa-keyboard"]').click()

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless').waitFor({state: 'visible'})

    // entrer la valeur 'hahahaha'
    await page.locator('#addition-fractionnee').fill('hahahaha')

    // cliquer bouton "VALIDER"
    await page.locator('#popup-cashless bouton-basique', {hasText: "VALIDER"}).click()

    // message "Vous devez entrer un nombre !" visible
    await expect(page.locator('#addition-fractionnee-msg-erreur', {hasText: "Vous devez entrer un nombre !"})).toBeVisible()

    // cliquer bouton "RETOUR"
    await page.locator('#popup-cashless #popup-retour').click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()
  })

  test("Valeur partielle = 5, moyens de paiement et bouton retour.", async () => {
    // attendre page de paiement
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'article(s) de Ex03'}).waitFor({state: 'visible'})

    // clique bouton "Valeur"
    await page.locator('#commandes-table-menu .categories-table-item i[class~="fa-keyboard"]').click()

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless').waitFor({state: 'visible'})

    // entrer la valeur '5'
    await page.locator('#addition-fractionnee').fill('5')

    // cliquer bouton "VALIDER"
    await page.locator('#popup-cashless bouton-basique', {hasText: "VALIDER"}).click()

    // titre popup-cashless "Type(s) de paiement" présent
    await expect(page.locator('#popup-cashless', {hasText: 'Type(s) de paiement'})).toBeVisible()

    // moyen de paiement "CASHLESS" présent
    await expect(page.locator('#popup-cashless bouton-basique >> text=CASHLESS')).toBeVisible()
    // Total pour moyen de paiement "CASHLESS" 5 €
    await expect(page.locator('#popup-cashless bouton-basique', {hasText: 'CASHLESS'}).locator('.sous-element-texte >> text=TOTAL')).toHaveText('TOTAL 5 €')

    // moyen de paiement "ESPECE" présent
    await expect(page.locator('#popup-cashless bouton-basique >> text=ESPECE')).toBeVisible()
    // Total pour moyen de paiement "ESPECE" 5 €
    await expect(page.locator('#popup-cashless bouton-basique', {hasText: 'ESPECE'}).locator('.sous-element-texte >> text=TOTAL')).toHaveText('TOTAL 5 €')

    // moyen de paiement "CB" présent
    await expect(page.locator('#popup-cashless bouton-basique >> text=CB')).toBeVisible()
    // Total pour moyen de paiement "CB" 5 €
    await expect(page.locator('#popup-cashless bouton-basique', {hasText: 'CB'}).locator('.sous-element-texte >> text=TOTAL')).toHaveText('TOTAL 5 €')

    // bouton RETOUR présent
    await expect(page.locator('#popup-cashless bouton-basique >> text=RETOUR')).toBeVisible()

    // cliquer bouton "RETOUR"
    await page.locator('#popup-cashless #popup-retour').click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()

    // on revient sur la table
    await expect(page.locator('.navbar-horizontal .titre-vue', {hasText: 'article(s) de Ex03'})).toBeVisible()
  })

  test("Valeur partielle = 5, payer par espèce.", async () => {
    // attendre page de paiement
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'article(s) de Ex03'}).waitFor({state: 'visible'})

    // clique bouton "Valeur"
    await page.locator('#commandes-table-menu .categories-table-item i[class~="fa-keyboard"]').click()

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless').waitFor({state: 'visible'})

    // entrer la valeur '5'
    await page.locator('#addition-fractionnee').fill('5')

    // cliquer bouton "VALIDER"
    await page.locator('#popup-cashless bouton-basique', {hasText: "VALIDER"}).click()

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless').waitFor({state: 'visible'})

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
    await expect(page.locator('#popup-cashless .popup-msg1', {hasText: 'Total'})).toHaveText('Total (espèce) : 5.00')

    // bouton "RETOUR" présent
    await expect(page.locator('#popup-cashless #popup-retour')).toBeVisible()

    // sortir de "popup-cashless"
    await page.locator('#popup-retour').click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()
  })

  test("Valeur partielle, retour après paiement en espèce d'une valeur partielle = 5.", async () => {
    // attendre page de paiement
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'article(s) de Ex03'}).waitFor({state: 'visible'})

    // une ligne seulement -- addition-liste-deja-paye .BF-ligne-deb
    await expect(page.locator('#addition-liste-deja-paye .BF-ligne-deb')).toHaveCount(1)

    // vérification de la "valeur partielle" déjà payée
    await expect(page.locator('#addition-liste-deja-paye .BF-ligne-deb', {hasText: 'Paiement Fractionné'}).locator('.addition-col-qte')).toHaveText('1')
    await expect(page.locator('#addition-liste-deja-paye .BF-ligne-deb', {hasText: 'Paiement Fractionné'}).locator('.addition-col-produit div')).toHaveText('Paiement Fractionné')
    await expect(page.locator('#addition-liste-deja-paye .BF-ligne-deb', {hasText: 'Paiement Fractionné'}).locator('.addition-col-prix div')).toHaveText('5€')

    // total de "reste à payer" et "commandes" ok
    await expect(page.locator('#addition-reste-a-payer')).toHaveText('29.4')
    await expect(page.locator('#addition-total-commandes')).toHaveText('34.4')

    // VALIDER, total = 0
    await expect(page.locator('#bt-valider-total-restau')).toHaveText('TOTAL 0 €')
  })

  test(`Valeur partielle, payer le reste de l'addition, bouton "Tout".`, async () => {
    // attendre page de paiement
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'article(s) de Ex03'}).waitFor({state: 'visible'})
    // clique bouton "Tout"
    await page.locator('#commandes-table-menu div >> text=Tout').click()

    // titre popup-cashless "Type(s) de paiement" présent
    await expect(page.locator('#popup-cashless', {hasText: 'Type(s) de paiement'})).toBeVisible()

    // vérification de la valeur du reste "29.4 €" sur les boutons de paiement
    await expect(page.locator('#popup-cashless bouton-basique', {hasText: 'CASHLESS'}).locator('.sous-element-texte >> text=TOTAL')).toHaveText('TOTAL 29.4 €')
    await expect(page.locator('#popup-cashless bouton-basique', {hasText: 'ESPECE'}).locator('.sous-element-texte >> text=TOTAL')).toHaveText('TOTAL 29.4 €')
    await expect(page.locator('#popup-cashless bouton-basique', {hasText: 'CB'}).locator('.sous-element-texte >> text=TOTAL')).toHaveText('TOTAL 29.4 €')

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
    await expect(page.locator('#popup-cashless .popup-msg1', {hasText: 'Total'})).toHaveText('Total (carte bancaire) : 29.40')

    // bouton "RETOUR" présent
    await expect(page.locator('#popup-cashless #popup-retour')).toBeVisible()

    // sortir de "popup-cashless"
    await page.locator('#popup-retour').click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()
  })

  test("Valeur partielle, retour après paiement du reste de l'addition.", async () => {
    // attendre page de paiement
    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'article(s) de Ex03'}).waitFor({state: 'visible'})


    // dev ajout bouton 'Tout' pour casser le test
    // await page.evaluate(async () => {
    //   document.querySelector('#commandes-table-menu').insertAdjacentHTML('afterbegin','<div><div class="categories-table-nom">Tout</div></div>')
    // })

    // bouton "Tout" non visible
    await expect(page.locator('#commandes-table-menu div >> text=Tout')).toBeHidden()

    // bouton "Valeur" non visible
    await expect(page.locator('#commandes-table-menu div >> text=Valeur')).toBeHidden()

    // bouton "Prépara." est visible
    await expect(page.locator('#commandes-table-menu div >> text=Prépara.')).toBeVisible()

    // liste articles cachée
    const listeNonVisible = await articlesListNoVisible(page)
    expect(listeNonVisible).toEqual(true)

    // vérififier addition
    const listeArticles = [{nom: "Pression 33", nb: 1, prix: 2}, {nom: "CdBoeuf", nb: 1, prix: 25},
      {nom: "Despé", nb: 2, prix: 3.2}, {nom: "Café", nb: 1, prix: 1}]
    await checkAlreadyPaidBill(page, listeArticles)

    // total de "reste à payer" ok
    await expect(page.locator('#addition-reste-a-payer')).toHaveText('0')

    await page.close()
  })

})