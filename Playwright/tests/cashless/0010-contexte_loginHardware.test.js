import {test} from '@playwright/test'
import {userAgentString} from '../../mesModules/commun.js'

test.use({userAgent: userAgentString})
test.use({viewport: {width: 1024, height: 800}})

const urlTester = 'http://localhost:8001/wv/login_hardware'
let page

test.describe('Connexion appareils client.', () => {
  test('login_hardware', async ({browser}) => {
    // 1 - connexion appareil client
    page = await browser.newPage()

    // première connexion
    await page.goto(urlTester)

    // permet d'attendre une fin de redirection
    await page.waitForLoadState('networkidle')

    const currentUrl = page.url()

    // autorise l'appareil
    if (currentUrl !== 'http://localhost:8001/wv/') {
      const pageAdmin = await browser.newPage()
      await pageAdmin.goto('http://localhost:8001/')

      // connexion admin
      await pageAdmin.locator('#password').fill(process.env.STAFF_PWD)
      await pageAdmin.locator('#username').fill(process.env.STAFF_LOGIN)
      await pageAdmin.locator('#submit').click()


      // clique menu "Appareils"
      await pageAdmin.locator('.sidebar-dependent .sidebar-section div a span[class="sidebar-link-label"]', {hasText: 'Appareils'}).click()

      // active l'appareil phenix
      await pageAdmin.locator('label').click()

      // Click text=Enregistrer
      await pageAdmin.locator('text=Enregistrer').click()
      await pageAdmin.waitForURL('http://localhost:8001/adminstaff/APIcashless/appareil/')
      await pageAdmin.close()
    }
    await page.close()
  })
})