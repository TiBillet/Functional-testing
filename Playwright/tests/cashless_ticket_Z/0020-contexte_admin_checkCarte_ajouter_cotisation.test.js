import {test} from '@playwright/test'
import { connectionAdmin, getEnv } from '../../mesModules/commun.js'

test.use({ignoreHTTPSErrors: true})
test.use({viewport: {width: 1024, height: 800}})

const env = getEnv()
const tenant = env.tenantToTest
const urlRoot = 'https://' + env.cashlessServer[tenant].subDomain + '.' + env.domain

// ne peut être lancé deux fois de suite (le champ input pour la cotisation n'est plus affiché une fois la cotisation effectuée).
test.describe('Contexte admin, utilisateur "test".', () => {
  test('Cotisation de 15 pour utilisateur "test".', async ({browser}) => {
    const pageAdmin = await browser.newPage()
    await pageAdmin.goto(urlRoot)

    // connexion admin
    await connectionAdmin(pageAdmin, tenant)

    // Attent la fin de requête suite à clique menu "Membres"
    await Promise.all([
      pageAdmin.waitForRequest(urlRoot + '/adminstaff/APIcashless/membre/'),
      pageAdmin.locator('.sidebar-dependent .sidebar-section div a span[class="sidebar-link-label"]', {hasText: 'Membres'}).click()
    ])

    // Attent la fin de requête suite à clique sur membre "TEST"
    await Promise.all([
      pageAdmin.waitForRequest(urlRoot + '/adminstaff/APIcashless/membre/**/change/'),
      pageAdmin.getByRole('link', {name: 'TEST'}).click()
    ])

    // cotisation de 15
    await pageAdmin.locator('#membre_form div fieldset div[class~="field-cotisation"] input[name="cotisation"]').fill('15')

    // mode de paiement "Espece"
    await pageAdmin.locator('#membre_form div fieldset div[class~="field-paiment_adhesion"] label >> text=Espece').click()

    // Attent la fin de requête suite à l'enregistrement
    await Promise.all([
      pageAdmin.waitForRequest(urlRoot + '/adminstaff/APIcashless/membre/'),
      await pageAdmin.locator('#membre_form input[value="Enregistrer"]').click()
    ])

    await pageAdmin.close()
  })

})