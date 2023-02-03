import {test} from '@playwright/test'

test.use({viewport: {width: 1024, height: 800}})

// ne peut être lancé deux fois de suite (le champ input pour la cotisation n'est plus affiché une fois la cotisation effectuée).
test.describe.only('Contexte admin, utilisateur "test".', () => {
  test('Cotisation de 15 pour utilisateur "test".', async ({browser}) => {
    const pageAdmin = await browser.newPage()
    await pageAdmin.goto('http://localhost:8001/')

    // connexion admin
    await pageAdmin.locator('#password').fill(process.env.STAFF_PWD)
    await pageAdmin.locator('#username').fill(process.env.STAFF_LOGIN)
    await pageAdmin.locator('#submit').click()

    // Attent la fin de requête suite à clique menu "Membres"
    await Promise.all([
      pageAdmin.waitForRequest('http://localhost:8001/adminstaff/APIcashless/membre/'),
      pageAdmin.locator('.sidebar-dependent .sidebar-section div a span[class="sidebar-link-label"]', {hasText: 'Membres'}).click()
    ])

    // Attent la fin de requête suite à clique sur membre "TEST"
    await Promise.all([
      pageAdmin.waitForRequest('http://localhost:8001/adminstaff/APIcashless/membre/**/change/'),
      pageAdmin.getByRole('link', {name: 'TEST'}).click()
    ])

    // cotisation de 15
    await pageAdmin.locator('#membre_form div fieldset div[class~="field-cotisation"] input[name="cotisation"]').fill('15')

    // mode de paiement "Espace"
    await pageAdmin.locator('#membre_form div fieldset div[class~="field-paiment_adhesion"] label >> text=Espece').click()

    // Attent la fin de requête suite à l'enregistrement
    await Promise.all([
      pageAdmin.waitForRequest('http://localhost:8001/adminstaff/APIcashless/membre/'),
      await pageAdmin.getByRole('button', {name: 'Enregistrer'}).click()
    ])
    await pageAdmin.close()
  })

})