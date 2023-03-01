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

// test.describe.configure({mode: 'serial'})
test.describe('Décimal', () => {
  test("Sélection d'articles, prix non entier.", async ({browser}) => {
    page = await browser.newPage()
    await connection(page, urlTester)

    // Clique sur le menu burger
    await page.locator('.menu-burger-icon').click()

    // Click text=POINTS DE VENTES
    await page.locator('text=POINTS DE VENTES').click()

    // Clique sur point de vente "Bar 1"
    await page.locator('#menu-burger-conteneur >> text=Bar 1').click()

    // Click text=Chimay Bleue 2.8 € 0 >> nth=1
    await page.locator('div[data-name-pdv="Bar 1"] bouton-article >> text=Chimay Bleue').click({clickCount: 3})

    // Click text=Pression 50 2.5 € 0 >> nth=1
    await page.locator('div[data-name-pdv="Bar 1"]  bouton-article >> text=Pression 50').click()
    // Click text=Guinness 4.99 € 0 >> nth=1
    await page.locator('div[data-name-pdv="Bar 1"]  bouton-article >> text=Guinness').click()
    // Click text=Despé 3.2 € 0 >> nth=1
    await page.locator('div[data-name-pdv="Bar 1"]  bouton-article >> text=Despé ').click()

    await expect(page.locator('#bt-valider')).toContainText('TOTAL 19.09 €')

    await page.close()
  })
})