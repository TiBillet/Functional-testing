import {test, expect} from '@playwright/test'
import {userAgentString, connection, goPointSale} from '../../mesModules/commun.js'

test.use({userAgent: userAgentString})
test.use({viewport: {width: 1024, height: 800}})

const urlTester = 'http://localhost:8001/wv/'

let page

test.describe('Point de vente, service direct et commandes', () => {
  test("Service direct", async ({browser}) => {
    page = await browser.newPage()

    // await page.pause()
    await connection(page, urlTester)

    // attente affichage menu burger
    await page.locator('.navbar-menu i[class~="menu-burger-icon"]').waitFor({state: 'visible'})

    // aller au point de vente "BAR 1"
    await goPointSale(page, 'BAR 1')

    // titre = "Service Direct - Bar 1"
    await expect(page.locator('.navbar-horizontal .titre-vue >> text=Service Direct - Bar 1')).toBeVisible()

    // bouton "RESET"
    await expect(page.locator('#page-commandes-footer .test-reset .footer-bt-text div >> text=RESET')).toBeVisible()

    // bouton "CHECK CARTE"
    await expect(page.locator('#page-commandes-footer div[class~="test-check-carte"] >> text=CHECK CARTE')).toBeVisible()

    // bouton "VALIDER"
    await expect(page.locator('#bt-valider >> text=VALIDER')).toBeVisible()
  })

  test("Commandes", async () => {
    // aller au point de vente "RESTO"
    await goPointSale(page, 'RESTO')

    await page.locator('.navbar-horizontal .titre-vue', {hasText: 'Sélectionner une table : Resto'}).waitFor({state: 'visible'})

    // bouton "+", table éphémère (liste de tables présente)
    await expect(page.locator('#tables-liste div[class~="test-table-ephemere"]')).toBeVisible()

    // bouton "SERVICE DIRECT"
    await expect(page.locator('#table-footer-contenu div[class~="test-service-direct"]')).toBeVisible()

    // bouton "CHECK CARTE"
    await expect(page.locator('#table-footer-contenu div[class~="test-check-carte"] >> text=CHECK CARTE')).toBeVisible()

    await page.close()
  })
})