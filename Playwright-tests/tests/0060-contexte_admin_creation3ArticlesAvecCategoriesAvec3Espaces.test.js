import {test} from '@playwright/test'
import {userAgentString} from '../mesModules/commun.js'

test.use({userAgent: userAgentString})
test.use({viewport: {width: 1024, height: 800}})

let pageAdmin

// test.describe.configure({mode: 'serial'})
test.describe("Contexte, catégories :", () => {
  test("Connexion staff.", async ({browser}) => {
    pageAdmin = await browser.newPage()
    await pageAdmin.goto('http://localhost:8001/')

    // connexion admin
    await pageAdmin.locator('#password').fill(process.env.STAFF_PWD)
    await pageAdmin.locator('#username').fill(process.env.STAFF_LOGIN)
    await pageAdmin.locator('#submit').click()
  })

  test("Création d'une catégories avec trois espaces.", async () => {
    // Clique sur "Articles et tarifs"
    await pageAdmin.locator('text=Catégorie d\'articles').click()
    await pageAdmin.waitForURL('http://localhost:8001/adminstaff/APIcashless/categorie/')

    // Clique sur "Ajouter article"
    await pageAdmin.locator('text=Ajouter Catégorie d\'articles').click()
    await pageAdmin.waitForURL('http://localhost:8001/adminstaff/APIcashless/categorie/add/')

    // Création de la catégories avec 3 espaces
    await pageAdmin.locator('input[name="name"]').fill('biere des dieux')

    // Sélection text couleur noir
    await pageAdmin.locator('text=Couleur texte : --------- Aqua Noir Bleu Fuchsia Gris Vert Citron Marron Marine  >> b[role="presentation"]').click()
    await pageAdmin.locator('li[role="treeitem"]:has-text("Noir")').click();

    // Sélection fond couleur vert
    await pageAdmin.locator('text=Couleur backgr : --------- Aqua Noir Bleu Fuchsia Gris Vert Citron Marron Marine >> b[role="presentation"]').click()
    await pageAdmin.locator('li[role="treeitem"]:has-text("Vert")').click();

    // icon 'beer'
    await pageAdmin.locator('text=Icon : --------- ad address-book address-card adjust air-freshener align-center  >> b[role="presentation"]').click()
    await pageAdmin.locator('input[role="textbox"]').fill('beer')

    // enregistrer
    await pageAdmin.locator('input[name="_save"]').click()
  })

  test("Création de 3 artiles comprenant la catégorie avec 3 espaces.", async () => {
    // Articles et tarifs
    await pageAdmin.locator('text=Articles et tarifs').click();
    await pageAdmin.waitForURL('http://localhost:8001/adminstaff/APIcashless/articles/')
    // Ajouter article
    await pageAdmin.locator('text=Ajouter article').click();
    await pageAdmin.waitForURL('http://localhost:8001/adminstaff/APIcashless/articles/add/')

    // Création premier articles avec catégories 3 espaces
    await pageAdmin.locator('input[name="name"]').fill('biere1')
    await pageAdmin.locator('input[name="prix"]').fill('1.5')
    await pageAdmin.locator('input[name="prix_achat"]').fill('1.5')
    await pageAdmin.locator('text=--------- Consigne Soft Pression Bieres Btl Menu Dessert biere des dieux ------- >> b[role="presentation"]').click()
    await pageAdmin.locator('li[role="treeitem"]:has-text("biere des dieux")').click()
    await pageAdmin.locator('text=Couleur texte : --------- Aqua Noir Bleu Fuchsia Gris Vert Citron Marron Marine  >> b[role="presentation"]').click()
    await pageAdmin.locator('li[role="treeitem"]:has-text("Noir")').click()
    await pageAdmin.locator('input[name="_save"]').click()
    await pageAdmin.waitForURL('http://localhost:8001/adminstaff/APIcashless/articles/')

    // Création deuxième article avec catégories 3 espaces
    // Ajouter article
    await pageAdmin.locator('text=Ajouter article').click()
    await pageAdmin.waitForURL('http://localhost:8001/adminstaff/APIcashless/articles/add/')
    // article
    await pageAdmin.locator('input[name="name"]').fill('biere2')
    await pageAdmin.locator('input[name="prix"]').fill('2.5')
    await pageAdmin.locator('input[name="prix_achat"]').fill('2.5')
    await pageAdmin.locator('text=--------- Consigne Soft Pression Bieres Btl Menu Dessert biere des dieux ------- >> b[role="presentation"]').click()
    await pageAdmin.locator('li[role="treeitem"]:has-text("biere des dieux")').click()
    await pageAdmin.locator('text=Couleur texte : --------- Aqua Noir Bleu Fuchsia Gris Vert Citron Marron Marine  >> b[role="presentation"]').click()
    await pageAdmin.locator('li[role="treeitem"]:has-text("Noir")').click()
    await pageAdmin.locator('input[name="_save"]').click()
    await pageAdmin.waitForURL('http://localhost:8001/adminstaff/APIcashless/articles/')

    // Création troisième article avec catégories 3 espaces
    // Ajouter article
    await pageAdmin.locator('text=Ajouter article').click()
    await pageAdmin.waitForURL('http://localhost:8001/adminstaff/APIcashless/articles/add/')
    // article
    await pageAdmin.locator('input[name="name"]').fill('biere3')
    await pageAdmin.locator('input[name="prix"]').fill('3.6')
    await pageAdmin.locator('input[name="prix_achat"]').fill('3.6')
    await pageAdmin.locator('text=--------- Consigne Soft Pression Bieres Btl Menu Dessert biere des dieux ------- >> b[role="presentation"]').click()
    await pageAdmin.locator('li[role="treeitem"]:has-text("biere des dieux")').click()
    await pageAdmin.locator('text=Couleur texte : --------- Aqua Noir Bleu Fuchsia Gris Vert Citron Marron Marine  >> b[role="presentation"]').click()
    await pageAdmin.locator('li[role="treeitem"]:has-text("Noir")').click()
    await pageAdmin.locator('input[name="_save"]').click()
    await pageAdmin.waitForURL('http://localhost:8001/adminstaff/APIcashless/articles/')
  })

  test('Ajout des 3 articles au point de vente "Bar 1".', async () => {
    // Click span:has-text("Points de vente")
    await pageAdmin.locator('span:has-text("Points de vente")').click()

    // attendre l'affichage de la page points de vente
    await pageAdmin.locator('.breadcrumbs ',{hasText:'Accueil Apicashless Points de vente'}).waitFor({state: 'visible'})

    // Click a:has-text("Bar 1")
    await pageAdmin.locator('a:has-text("Bar 1")').click()

    // biere1
    await pageAdmin.locator('ul[class="select2-selection__rendered"]').click()
    await pageAdmin.locator('li[role="treeitem"]:has-text("biere1")').click()

    // biere2
    await pageAdmin.locator('ul[class="select2-selection__rendered"]').click()
    await pageAdmin.locator('li[role="treeitem"]:has-text("biere2")').click()

    // biere3
    await pageAdmin.locator('ul[class="select2-selection__rendered"]').click()
    await pageAdmin.locator('li[role="treeitem"]:has-text("biere3")').click()

    // Click input[name="_save"]
    await pageAdmin.locator('input[name="_save"]').click();
    await pageAdmin.waitForURL('http://localhost:8001/adminstaff/APIcashless/pointdevente/')
    await pageAdmin.close()
  })

})