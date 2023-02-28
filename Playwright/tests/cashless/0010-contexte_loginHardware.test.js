import {test} from '@playwright/test'
import {getEnv, userAgentString} from '../../mesModules/commun.js'

test.use({userAgent: userAgentString})
test.use({viewport: {width: 1024, height: 800}})

const env = getEnv()

// https://demo.cashless.tibillet.localhost
const urlRoot = 'https://' + env.cashlessServer.demo.subDomain + '.' + env.domain
const urlTester = urlRoot + '/wv/login_hardware'
console.log('urlTester =', urlTester)

let page

test.describe.only('Connexion appareils client.', () => {
  test('login_hardware', async ({browser}) => {
    // 1 - connexion appareil client
    page = await browser.newPage()

    // première connexion
    await page.goto(urlTester)

    // permet d'attendre une fin de redirection
    await page.waitForLoadState('networkidle')

    const currentUrl = page.url()

    console.log('currentUrl =', currentUrl)
    await page.pause()
    // autorise l'appareil
    if (currentUrl !== urlRoot + '/wv/') {
      const pageAdmin = await browser.newPage()
      await pageAdmin.goto(urlRoot)
await page.pause()
      // connexion admin
      await pageAdmin.locator('#password').fill(env.cashlessServer.demo.staffPassword)
      await pageAdmin.locator('#username').fill(env.cashlessServer.demo.staffUser)
      await pageAdmin.locator('#submit').click()


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