import {test, expect, request} from '@playwright/test'
import moment from 'moment'
import Big from '../mesModules/big.js'
import * as fs from 'node:fs'

/**
 * Chargement de env.json
 */
export function getEnv() {
  const dataRaw = fs.readFileSync('./env.json', 'utf8')
  return JSON.parse(dataRaw)
}

const env = getEnv()

// certificat https
test.use({ignoreHTTPSErrors: true})

export const userAgentString = `{"hostname": "${env.device.hostname}", "token": "${env.device.tokenSocket}", "password": "${env.device.password}", "modeNfc": "NFCSI", "front": "${env.device.front}", "ip": "192.168.1.4"}`

// ---- billetterie ----
export function getTenantUrl(subDomain) {
  return 'https://' + env.ticketing[subDomain].subDomain + '.' + env.domain
}

/**
 * Retourne la date d'aujourd'hui + un nombre aléatoire(1 à 365) de jours
 * @returns {moment.Moment}
 */
export function randomDate() {
  const dateR = moment()
  const randomNbDays = (Math.random() * 365) + 1
  dateR.add(randomNbDays, 'days')
  dateR.format("YYYY-MM-DD")
  return dateR
}

/**
 * Obtenir le root token
 * @returns {string}
 */
export const getRootJWT = async function () {
  return await test.step('GeT Root JWT Token', async () => {
    const context = await request.newContext({
      baseURL: getTenantUrl('root'),
      ignoreHTTPSErrors: true
    })

    const options = {
      headers: {
        "Content-Type": "application/json"
      },
      data: {
        username: env.ticketing.root.rootUser,
        password: env.ticketing.root.rootPassword
      }
    }
    // console.log('options =', options)

    const response = await context.post('/api/user/token/', options)
    // console.log('response =', response)
    const retour = await response.json()
    expect(response.ok()).toBeTruthy()
    return retour.access
  })
}

/**
 * Reset dataPeuplementTempo.json avec les données de dataPeuplementInit.json
 * @returns {Promise<*[]>}
 */
export async function initData() {
  try {
    const data = fs.readFileSync('./mesModules/dataPeuplementInit.json', 'utf8')
    fs.writeFileSync('./mesModules/dataPeuplementTempo.json', data, 'utf8')
    console.log('Init dataPeuplement.')
  } catch (err) {
    console.log(`Error init dataPeuplement: ${err}`)
    return []
  }

}

/**
 * Données pour le peuplement des billetteriue et la synchronisation des tests
 * @returns {*[]|any}
 */
export function getData() {
  try {
    const data = fs.readFileSync('./mesModules/dataPeuplementTempo.json', 'utf8')
    return JSON.parse(data)
  } catch (err) {
    console.log(`Error reading file from disk: ${err}`)
    return []
  }
}

/**
 * Maj des données de peuplement lors des tests
 * @param dataR
 */
export function updateData(dataR) {
  try {
    const data = JSON.stringify(dataR, null, 4)
    fs.writeFileSync('./mesModules/dataPeuplementTempo.json', data, 'utf8')
  } catch (err) {
    console.log(`Error writing file: ${err}`)
  }
}

// ---- cashless ----
export function tagId(tenant) {
  return {
    carteTest: env.ticketing[tenant].cashless_cards.cards[1][2],
    carteRobocop: env.ticketing[tenant].cashless_cards.cards[2][2],
    carteMaitresse: env.ticketing[tenant].cashless_cards.cards[0][2],
    carteInconnue: 'CARTINC0'
  }
}

// nfc
export async function updateNfc(page) {
  // ajout de la fonction émuler lecteur carte nfc
  await page.evaluate(async () => {
    // stop socket.io
    if (SOCKET !== null) {
      SOCKET.close()
    }

    // Etendre la class rfid afin d'émuler la lecture d'une carte
    class emuleNfc extends Nfc {
      constructor(length) {
        super(length, length)
        this.name = 'simuNfc'
      }

      emulerLecture(valeur) {
        // annule la lecture du côté serveur nfc
        this.annuleLireTagId()
        // emule la lecture d'un tagId
        this.verificationTagId(valeur, this.etatLecteurNfc.uuidConnexion)
      }
    }

    // mémorise ancien état du lecteur nfc
    const ancienEtatLecteurNfc = rfid.etatLecteurNfc
    // remplace l'ancienne class par la class étendue simulant la lecture d'une carte
    window.rfid = new emuleNfc()
    // remet l'ancien état de la class rfid
    window.rfid.etatLecteurNfc = ancienEtatLecteurNfc
  })
}

export async function emulateTagIdNfc(page, tagId) {
  await page.evaluate(async ([tagId]) => {
    window.rfid.emulerLecture(tagId)
  }, [tagId])
}

/**
 * Connexion de l'appareil avec la carte maîtresse
 * @param {object} page page html en cours
 * @param {string} tenant
 * @returns {Promise<void>}
 */
export const connectionAdmin = async function (pageAdmin, tenant) {
  await test.step('Connexion admin', async () => {
    await pageAdmin.locator('#password').fill(env.cashlessServer[tenant].adminPassword)
    await pageAdmin.locator('#username').fill(env.cashlessServer[tenant].adminUser)
    await pageAdmin.locator('#submit').click()
  })
}

/**
 * Connexion de l'appareil avec la carte maîtresse
 * @param {object} page page html en cours
 * @param {string} urlTester lien de la page html en cours
 * @returns {Promise<void>}
 */
export const connection = async function (page, urlTester) {
  await test.step('Connexion', async () => {
    await page.goto(urlTester)

    // lecture carte (client)
    await expect(page.locator('text=attente', {ignoreCase: true})).toBeVisible()
    await expect(page.locator('text=lecture carte', {ignoreCase: true})).toBeVisible()
    await expect(page.locator('text=carte maîtresse', {ignoreCase: true})).toBeVisible()

    await updateNfc(page)

    await emulateTagIdNfc(page, tagId('demo').carteMaitresse)
  })
}

/**
 * Aller au point de ventes
 * @param {object} page page html en cours
 * @param {string} menu Sélectionne le menu
 * @returns {Promise<void>}
 */
export const goPointSale = async function (page, menu) {
  await test.step('Aller au menu ' + menu, async () => {
    // attente affichage menu burger
    await page.locator('.navbar-menu i[class~="menu-burger-icon"]').waitFor({state: 'visible'})
    // Clique sur le menu burger
    await page.locator('.menu-burger-icon').click()
    // Click text=POINTS DE VENTES
    await page.locator('text=POINTS DE VENTES').click()
    // Click #menu-burger-conteneur >> text=Bar 1
    await page.locator('#menu-burger-conteneur >> text=' + menu.toUpperCase()).click()
  })
}

/**
 * Activation/Désactivation mode gérant
 * @param {object} page page html en cours
 * @param {string} status on/off
 * @returns {Promise<void>}
 */
export const managerMode = async function (page, status) {
  await test.step('Activation/Désactivation mode gérant.', async () => {
    // attente affichage menu burger
    await page.locator('.navbar-menu i[class~="menu-burger-icon"]').waitFor({state: 'visible'})
    // Clique sur le menu burger
    await page.locator('.menu-burger-icon').click()

    const managerModeON = await page.evaluate(async () => {
      if (document.querySelector('#conteneur-menu-mode-gerant i[class="fas fa-lock"]') !== null) {
        return false
      } else {
        return true
      }
    })

    if ((status === 'on' && managerModeON === false) || (status === 'off' && managerModeON === true)) {
      // Click #menu-burger-conteneur >> text=Bar 1
      await page.locator('#conteneur-menu-mode-gerant').click()
    } else {
      // clique sur le titre de la navbarre pour sortir du menu
      await page.locator('.navbar-horizontal .titre-vue').click()
    }
  })
}


/**
 * Vider la carte nfc
 * @param {object} page page html en cours
 * @param {string} tagId
 * @returns {Promise<void>}
 */
export const resetCardCashless = async function (page, tagId) {
  await test.step('vider la carte cashless.', async () => {
    // attente affichage menu burger
    await page.locator('.navbar-menu i[class~="menu-burger-icon"]').waitFor({state: 'visible'})

    // Clique sur le menu burger
    await page.locator('.menu-burger-icon').click()
    // Click text=POINTS DE VENTES
    await page.locator('text=POINTS DE VENTES').click()
    // Click #menu-burger-conteneur >> text=Bar 1
    await page.locator('#menu-burger-conteneur >> text=CASHLESS').click()

    // attente affichage menu burger
    await page.locator('.navbar-menu i[class~="menu-burger-icon"]').waitFor({state: 'visible'})

    await page.locator('#products div[data-name-pdv="Cashless"] bouton-article[nom="VIDER CARTE"]').click()

    // cliquer sur bouton "VALIDER"
    await page.locator('#bt-valider').click()

    // attente affichage "Attente lecture carte"
    await page.locator('#popup-cashless', {hasText: 'Attente lecture carte'}).waitFor({state: 'visible'})

    // carte nfc de robocop
    await emulateTagIdNfc(page, tagId)

    // Vidage carte OK !
    await expect(page.locator('#popup-cashless div[class="popup-titre1"] >> text=Vidage carte OK !')).toBeVisible()

    // sortir de "popup-cashless"
    await page.locator('#popup-retour').click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()
  })
}

/**
 * Créditer une carte de crédits et crédits cadeau
 * @param {object} page page html en cours
 * @param {string} tagId
 * @param {number} nbXCredit10 fois 10 credit
 * @param {number} nbXCreditCadeau5 fois 5 credit cadeau
 * @returns {Promise<void>}
 */
export const creditCardCashless = async function (page, tagId, nbXCredit10, nbXCreditCadeau5) {
  await test.step('Crediter la carte cashless.', async () => {
    // attente affichage menu burger
    await page.locator('.navbar-menu i[class~="menu-burger-icon"]').waitFor({state: 'visible'})

    // créditer credit, nbXCredit10 x 10 crédits
    if (nbXCredit10 >= 1) {
      // Clique sur le menu burger
      await page.locator('.menu-burger-icon').click()
      // Click text=POINTS DE VENTES
      await page.locator('text=POINTS DE VENTES').click()
      // Click #menu-burger-conteneur >> text=Bar 1
      await page.locator('#menu-burger-conteneur >> text=CASHLESS').click()

      // attente affichage menu burger
      await page.locator('.navbar-menu i[class~="menu-burger-icon"]').waitFor({state: 'visible'})

      // 10 crédits
      await page.locator('#products div[data-name-pdv="Cashless"] bouton-article[nom="TestCoin +10"]').click({clickCount: nbXCredit10})

      // cliquer sur bouton "VALIDER"
      await page.locator('#bt-valider').click()

      // attente affichage "Type(s) de paiement"
      await page.locator('#popup-cashless', {hasText: 'Type(s) de paiement'}).waitFor({state: 'visible'})

      // payer en espèces
      await page.locator('#popup-cashless bouton-basique >> text=ESPECE').click()

      // confirmation RETOUR | VALIDER
      await confirmation(page, 'espece')

      // VALIDER
      await page.locator('#popup-confirme-valider').click()

      // attente affichage "Attente lecture carte"
      await page.locator('#popup-cashless', {hasText: 'Attente lecture carte'}).waitFor({state: 'visible'})

      // carte nfc de robocop
      await emulateTagIdNfc(page, tagId)

      // Transaction OK !
      await expect(page.locator('#popup-cashless div[class="popup-titre1"] >> text=Transaction OK !')).toBeVisible()

      // sortir de "popup-cashless"
      await page.locator('#popup-retour').click()

      // #popup-cashless éffacé
      await expect(page.locator('#popup-cashless')).toBeHidden()
    }

    // créditer credit cadeau, nbXCreditCadeau5 x 5 crédits cadeau
    if (nbXCreditCadeau5 >= 1) {
      // Clique sur le menu burger
      await page.locator('.menu-burger-icon').click()
      // Click text=POINTS DE VENTES
      await page.locator('text=POINTS DE VENTES').click()
      // Click #menu-burger-conteneur >> text=Bar 1
      await page.locator('#menu-burger-conteneur >> text=CASHLESS').click()

      // attente affichage menu burger
      await page.locator('.navbar-menu i[class~="menu-burger-icon"]').waitFor({state: 'visible'})

      // 5 crédits
      await page.locator('#products div[data-name-pdv="Cashless"] bouton-article[nom="TestCoin Cadeau +5"]').click({clickCount: nbXCreditCadeau5})

      // cliquer sur bouton "VALIDER"
      await page.locator('#bt-valider').click()

      // attente affichage "Attente lecture carte"
      await page.locator('#popup-cashless', {hasText: 'Attente lecture carte'}).waitFor({state: 'visible'})

      // carte nfc de robocop
      await emulateTagIdNfc(page, tagId)

      // Transaction OK !
      await expect(page.locator('#popup-cashless div[class="popup-titre1"] >> text=Transaction OK !')).toBeVisible()

      // sortir de "popup-cashless"
      await page.locator('#popup-retour').click()

      // #popup-cashless éffacé
      await expect(page.locator('#popup-cashless')).toBeHidden()
    }
  })
}

/**
 * Sélectionne des articles
 * @param {object} page
 * @param {array} list liste d'articles avec {nom,nb,prix}
 * @param {string} pv point de ventes
 * @returns {Promise<void>}
 */
export const selectArticles = async function (page, list, pv) {
  await test.step('Sélectionner les articles.', async () => {
    for (const listKey in list) {
      const article = list[listKey]
      await page.locator(`#products div[data-name-pdv="${pv}"] bouton-article[nom="${article.nom}"]`).click({clickCount: article.nb})
    }
  })
}

/**
 * Vérifier addition (check bill)
 * @param {object} page
 * @param {array} list
 * @returns {Promise<void>}
 */
export const checkBill = async function (page, list) {
  await test.step('Sélectionner les articles.', async () => {
    // nombre de ligne de l'addition
    await expect(page.locator('#addition-liste .test-addition-article-ligne')).toHaveCount(list.length)

    // articles de l'addition identique à liste articles
    for (const listKey in list) {
      const article = list[listKey]
      // await page.locator('#addition-liste .test-addition-article-ligne', {hasText: article.nom}).locator('.addition-col-prix div').click()
      await expect(page.locator('#addition-liste .test-addition-article-ligne', {hasText: article.nom}).locator('.addition-col-qte')).toHaveText(article.nb.toString())
      await expect(page.locator('#addition-liste .test-addition-article-ligne', {hasText: article.nom}).locator('.addition-col-produit div')).toHaveText(article.nom)
      await expect(page.locator('#addition-liste .test-addition-article-ligne', {hasText: article.nom}).locator('.addition-col-prix div')).toHaveText(article.prix.toString() + '€')
    }
  })
}

/**
 * Vérifier articles déjà payés dans l'addition
 * @param {object} page
 * @param {array} list
 * @returns {Promise<void>}
 */
export const checkAlreadyPaidBill = async function (page, list) {
  await test.step('Sélectionner les articles.', async () => {
    // nombre de ligne de l'addition
    await expect(page.locator('#addition-liste-deja-paye .BF-ligne-deb')).toHaveCount(list.length)
    // articles de l'addition identique à liste articles
    for (const listKey in list) {
      const article = list[listKey]
      await expect(page.locator('#addition-liste-deja-paye .BF-ligne-deb', {hasText: article.nom}).locator('.addition-col-qte')).toHaveText(article.nb.toString())
      await expect(page.locator('#addition-liste-deja-paye .BF-ligne-deb', {hasText: article.nom}).locator('.addition-col-produit div')).toHaveText(article.nom)
      await expect(page.locator('#addition-liste-deja-paye .BF-ligne-deb', {hasText: article.nom}).locator('.addition-col-prix div')).toHaveText(article.prix.toString() + '€')
    }
  })
}


/**
 * Tous les articles de la liste ne sont pas visibles
 * @param page
 * @returns {Promise<void>}
 */
export const articlesListNoVisible = async function (page) {
  return await page.evaluate(async () => {
    let retour = true
    const liste = document.querySelectorAll('#commandes-table-articles bouton-commande-article')
    for (let i = 0; i < liste.length; i++) {
      if (liste[i].style.display !== 'none') {
        retour = false
        break
      }
    }
    return retour
  })
}

/**
 * Tous les articles de la liste sont visibles
 * @param page
 * @returns {Promise<*>}
 */
export const articlesListIsVisible = async function (page) {
  return await page.evaluate(async () => {
    let retour = true
    // dev, casse le test
    //document.querySelectorAll('#commandes-table-articles bouton-commande-article')[0].style.display = 'none'
    const liste = document.querySelectorAll('#commandes-table-articles bouton-commande-article')
    for (let i = 0; i < liste.length; i++) {
      if (liste[i].style.display !== 'block') {
        retour = false
        break
      }
    }
    return retour
  })
}

/**
 * Article pas visible
 * @param page
 * @param {string} articleName nom de l'article
 * @returns {Promise<void>}
 */
export const articleNoVisible = async function (page, articleName) {
  return await page.evaluate(async ([articleName]) => {
    let retour = true
    const article = document.querySelector(`#commandes-table-articles bouton-commande-article[data-nom="${articleName}"]`)
    if (article.style.display !== 'none') {
      retour = false
    }
    return retour
  }, [articleName])
}

/**
 * Article est visible
 * @param page
 * @param {string} articleName nom de l'article
 * @returns {Promise<void>}
 */
export const articleIsVisible = async function (page, articleName) {
  return await page.evaluate(async ([articleName]) => {
    let retour = true
    const article = document.querySelector(`#commandes-table-articles bouton-commande-article[data-nom="${articleName}"]`)
    if (article.style.display !== 'block') {
      retour = false
    }
    return retour
  }, [articleName])
}

/**
 * Affiche la valeur d'un décimal
 * @param value un décimal Big https://github.com/MikeMcl/big.js
 * @returns {number}
 */
export function bigToFloat(value) {
  try {
    return parseFloat(new Big(value).valueOf())
  } catch (error) {
    console.log('-> bigToFloat de sys, ', error)
  }
}

/**
 * Aller à la commande de la table
 * @param {object} page page html en cours
 * @param {string} table Sélectionne la table par son nom
 * @returns {Promise<void>}
 */
export const goTableOrder = async function (page, table) {
  await test.step('Aller à la table ' + table, async () => {
    // attente affichage menu burger
    await page.locator('.navbar-menu i[class~="menu-burger-icon"]').waitFor({state: 'visible'})
    // Clique sur le menu burger
    await page.locator('.menu-burger-icon').click()
    // Clique sur le menu TABLES
    await page.locator('text=TABLES').click()

    // attente affichage des tables
    await page.locator('.navbar-horizontal .titre-vue', {hasText: "Afficher les commandes d'une table"}).waitFor({state: 'visible'})

    // sélectionne la table
    await page.locator('#tables-liste div[class~="table-bouton"] >> text=' + table).click()
  })
}

/**
 * Test le popup de confirmation de type de paiement
 * @param {object} page page html en cours
 * @param {string} typePaiement le type de paiement choisi
 * @param {boolean} complementaire paiement complémentaire ou non
 * @returns {Promise<void>}
 */
export const confirmation = async function (page, typePaiement, complementaire) {
  await test.step('confirm paiement' + typePaiement, async () => {
    // popup de confirmation présent
    await expect(page.locator('#popup-cashless-confirm')).toBeVisible()

    // text "Confirmer le paiement" visible
    await expect(page.locator('#popup-cashless-confirm > h1 > div', {hasText: 'Confirmer le paiement'})).toBeVisible()

    if (typePaiement === 'espece') {
      // text "par ESPECE" visible
      await expect(page.locator(`#popup-cashless-confirm > h1 > div:nth-child(2)`, {hasText: 'par ESPECE'})).toBeVisible()
      // vérifier la présence de la fonction "vue_pv.obtenirIdentiteClientSiBesoin('espece')"
      const fonc = await evaluateOnclickFunctionString(page, `#popup-cashless-confirm bouton-basique:nth-child(2)`)
      let foncAttendue = "vue_pv.obtenirIdentiteClientSiBesoin('espece')"
      if (complementaire === true) {
        foncAttendue = "vue_pv.validerEtapeMoyenComplementaire('espece')"
      }
      await expect(fonc).toMatch(foncAttendue)
    }

    if (typePaiement === 'cb') {
      // text "par ESPECE" visible
      await expect(page.locator(`#popup-cashless-confirm > h1 > div:nth-child(2)`, {hasText: 'par CB'})).toBeVisible()
      // vérifier la présence de la fonction "vue_pv.obtenirIdentiteClientSiBesoin('espece')"
      const fonc = await evaluateOnclickFunctionString(page, `#popup-cashless-confirm bouton-basique:nth-child(2)`)
      let foncAttendue = "vue_pv.obtenirIdentiteClientSiBesoin('carte_bancaire')"
      if (complementaire === true) {
        foncAttendue = "vue_pv.validerEtapeMoyenComplementaire('carte_bancaire')"
      }
      await expect(fonc).toMatch(foncAttendue)
    }

    // vérifier la présence du bouton valider
    await expect(page.locator('#popup-confirme-valider')).toBeVisible()

    // vérifier la présence du bouton retour
    await expect(page.locator('#popup-confirme-retour')).toBeVisible()
  })
}

/**
 * Retourne le contenu de la fonction onclick de l'élément sous forme de string
 * à partir de sélecteurs css
 * @param {object} page page html en cours
 * @param {string} sélecteurs css
 * @returns {Promise<void>}
 */
export async function evaluateOnclickFunctionString(page, selecteurs) {
  // ajout de la fonction émuler lecteur carte nfc
  return await page.evaluate(async ([selecteurs]) => {
    return document.querySelector(selecteurs).onclick.valueOf().toString()
  }, [selecteurs])
}
