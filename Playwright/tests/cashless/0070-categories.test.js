import {test, expect} from '@playwright/test'
import {getEnv, userAgentString, connection} from '../../mesModules/commun.js'

test.use({userAgent: userAgentString})
test.use({ignoreHTTPSErrors: true})
test.use({viewport: {width: 1024, height: 800}})

const env = getEnv()
const tenant = env.tenantToTest
const urlRoot = 'https://' + env.cashlessServer[tenant].subDomain + '.' + env.domain
const urlTester = urlRoot + '/wv/'
let page
const data = [
  {
    titre: "Test catégorie Consigne",
    bouton: "Consigne",
    visible: ["Retour Consigne"],
    hidden: ["biere1", "biere2", "biere3", "Eau 50cL", "Eau 1L", "Café", "Soft P", "Soft G", "Pression 33", "Pression 50", "Guinness", "Despé", "Chimay Bleue", "Chimay Rouge", "CdBoeuf", "Gateau"]
  },
  {
    titre: "Test catégorie Soft",
    bouton: "Soft",
    visible: ["Eau 50cL", "Eau 1L", "Café", "Soft P", "Soft G"],
    hidden: ["biere1", "biere2", "biere3", "Retour Consigne", "Pression 33", "Pression 50", "Guinness", "Despé", "Chimay Bleue", "Chimay Rouge", "CdBoeuf", "Gateau"]
  },
  {
    titre: "Test catégorie Pression",
    bouton: "Pression",
    visible: ["Pression 33", "Pression 50"],
    hidden: ["Eau 50cL", "Eau 1L", "Café", "Soft P", "Soft G", "biere1", "biere2", "biere3", "Retour Consigne", "Guinness", "Despé", "Chimay Bleue", "Chimay Rouge", "CdBoeuf", "Gateau"]
  },
  {
    titre: 'Test catégorie "Bieres Btl"',
    bouton: "Bieres Btl",
    visible: ["Guinness", "Despé", "Chimay Bleue", "Chimay Rouge"],
    hidden: ["Pression 33", "Pression 50", "Eau 50cL", "Eau 1L", "Café", "Soft P", "Soft G", "biere1", "biere2", "biere3", "Retour Consigne", "CdBoeuf", "Gateau"]
  },
  {
    titre: 'Test catégorie "Menu"',
    bouton: "Menu",
    visible: ["CdBoeuf"],
    hidden: ["Guinness", "Despé", "Chimay Bleue", "Chimay Rouge", "Pression 33", "Pression 50", "Eau 50cL", "Eau 1L", "Café", "Soft P", "Soft G", "biere1", "biere2", "biere3", "Retour Consigne", "Gateau"]
  },
  {
    titre: 'Test catégorie "Dessert"',
    bouton: "Dessert",
    visible: ["Gateau"],
    hidden: ["Guinness", "Despé", "Chimay Bleue", "Chimay Rouge", "Pression 33", "Pression 50", "Eau 50cL", "Eau 1L", "Café", "Soft P", "Soft G", "biere1", "biere2", "biere3", "Retour Consigne", "CdBoeuf"]
  },
  {
    titre: 'Test catégorie "biere des dieux"',
    bouton: "biere des dieux",
    visible: ["biere1", "biere2", "biere3"],
    hidden: ["Retour Consigne", "Eau 50cL", "Eau 1L", "Café", "Soft P", "Soft G", "Pression 33", "Pression 50", "Guinness", "Despé", "Chimay Bleue", "Chimay Rouge", "CdBoeuf", "Gateau"]
  }
]

test.describe('Catégories', () => {
  test.beforeAll(async ({browser}) => {
    // 1 - connexion appareil client
    page = await browser.newPage()
    await connection(page, urlTester)
  })

  test.afterAll(async () => {
    await page.close()
  })

  // boucle de tests pour les catégories
  for (const dataKey in data) {
    const cuurentTest = data[dataKey]
    const titreTest = cuurentTest.titre
    const articlesVisibles = cuurentTest.visible
    const articlesHiddens = cuurentTest.hidden
    const bouton = cuurentTest.bouton

    test(titreTest, async () => {
      // Clique sur le menu burger
      await page.locator('.menu-burger-icon').click()
      // Click text=POINTS DE VENTES
      await page.locator('text=POINTS DE VENTES').click()
      // Click #menu-burger-conteneur >> text=Bar 1
      await page.locator('#menu-burger-conteneur >> text=Bar 1').click()
      // console.log('titreTest =', titreTest)

      // await page.pause()
      await page.locator(`#categories .categories-item div[class="categories-nom"] >> text=${bouton}`).click()

      /*
      // dev, casse le test
      await page.evaluate(async () => {
        document.querySelector('div[data-name-pdv="Bar 1"] bouton-article[nom="Pression 33"]').style.display = "block"
      })
       */

      // test articles visibles
      for (const articlesVisiblesKey in articlesVisibles) {
        const nomArticle = articlesVisibles[articlesVisiblesKey]
        // console.log(`visible -> div[data-name-pdv="Bar 1"] bouton-article[nom="${nomArticle}"]`)
        const locator = page.locator(`div[data-name-pdv="Bar 1"] bouton-article[nom="${nomArticle}"]`)
        await expect(locator).toBeVisible()
      }

      // test articles cachés
      for (const articlesHiddensKey in articlesHiddens) {
        const nomArticle = articlesHiddens[articlesHiddensKey]
        // console.log(`hidden -> div[data-name-pdv="Bar 1"] bouton-article[nom="${nomArticle}"]`)
        const locator = page.locator(`div[data-name-pdv="Bar 1"] bouton-article[nom="${nomArticle}"]`)
        await expect(locator).toBeHidden()
      }
    })
  }

  test('Test catégorie "tous"', async () => {
    // Clique sur le menu burger
    await page.locator('.menu-burger-icon').click()
    // Click text=POINTS DE VENTES
    await page.locator('text=POINTS DE VENTES').click()
    // Click #menu-burger-conteneur >> text=Bar 1
    await page.locator('#menu-burger-conteneur >> text=Bar 1').click()

    // tous les articles visibles
    await page.locator('#categories .categories-item div[class="categories-nom"] >> text=Tous').click()
    const articles = ["biere1", "biere2", "biere3", "Retour Consigne", "Eau 50cL", "Eau 1L", "Café", "Soft P", "Soft G", "Pression 33", "Pression 50", "Guinness", "Despé", "Chimay Bleue", "Chimay Rouge", "CdBoeuf", "Gateau"]
    for (const articlesKey in articles) {
      const nomArticle = articles[articlesKey]
      await expect(page.locator(`div[data-name-pdv="Bar 1"]  bouton-article >> text=${nomArticle}`)).toBeVisible()
    }
  })
})