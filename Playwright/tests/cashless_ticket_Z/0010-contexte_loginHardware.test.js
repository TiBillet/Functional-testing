import {test} from '@playwright/test'
import {connectionAdmin, getEnv, userAgentString} from '../../mesModules/commun.js'

test.use({userAgent: userAgentString})
test.use({ignoreHTTPSErrors: true})
test.use({viewport: {width: 1024, height: 800}})

const env = getEnv()
const tenant = env.tenantToTest
const urlRoot = 'https://' + env.cashlessServer[tenant].subDomain + '.' + env.domain
const urlTester = urlRoot + '/wv/login_hardware'
let page

test.describe('Appairage, connexion appareils client.', () => {
  test('login_hardware', async ({browser}) => {
    // 1 - connexion appareil client
    page = await browser.newPage()

    // première connexion
    await page.goto(urlTester)

    // permet d'attendre une fin de redirection
    await page.waitForLoadState('networkidle')

    const currentUrl = page.url()

    // autorise l'appareil
    if (currentUrl !== urlRoot + '/wv/') {
      const pageAdmin = await browser.newPage()
      await pageAdmin.goto(urlRoot)

      // connexion admin
      connectionAdmin(pageAdmin, tenant)

      // clique menu "Appareils"
      await pageAdmin.locator('.sidebar-dependent .sidebar-section div a span[class="sidebar-link-label"]', {hasText: 'Appareils'}).click()

      // active l'appareil phenix
      await pageAdmin.locator('label').click()

      // Click text=Enregistrer
      await pageAdmin.locator('text=Enregistrer').click()
      await pageAdmin.waitForURL(urlRoot + '/adminstaff/APIcashless/appareil/')
      await pageAdmin.close()
    }
    await page.close()
  })
})