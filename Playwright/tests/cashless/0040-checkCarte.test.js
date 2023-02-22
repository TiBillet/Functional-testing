import {test, expect} from '@playwright/test'
import {userAgentString, connection, goPointSale, tagId, emulateTagIdNfc} from '../../mesModules/commun.js'

test.use({userAgent: userAgentString})
test.use({viewport: {width: 1024, height: 800}})

const urlTester = 'http://localhost:8001/wv/'

let page

test.describe('Check carte.', () => {
  test('"Attente lecture carte" et bouton "RETOUR".', async ({browser}) => {
    page = await browser.newPage()
    await connection(page, urlTester)

    // attente affichage menu burger
    await page.locator('.navbar-menu i[class~="menu-burger-icon"]').waitFor({state: 'visible'})

    // aller au point de vente "BAR 1"
    await goPointSale(page, 'BAR 1')

    // bien sur Bar 1
    await expect(page.locator('text=Service Direct - Bar 1')).toBeVisible()

    // Clique sur le bouton "CHECK CARTE")
    await page.locator('#page-commandes-footer div:has-text("CHECK CARTE")').first().click()

    // text=Attente lecture carte visible
    await expect(page.locator('text=Attente lecture carte')).toBeVisible()

    // #popup-retour visible
    await expect(page.locator('#popup-retour')).toBeVisible()

    // Click #popup-retour div:has-text("RETOUR") >> nth=0
    await page.locator('#popup-retour div:has-text("RETOUR")').first().click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()

  })

  test('Carte inconnue', async () => {
    // attente affichage menu burger
    await page.locator('.navbar-menu i[class~="menu-burger-icon"]').waitFor({state: 'visible'})

    emulateTagIdNfc(page, tagId.carteInconnue)

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless').waitFor({state: 'visible'})

    // Le text "carte inconnue" est affciché.
    await expect(page.locator('text=carte inconnue')).toBeVisible()

    // fond d'écran =  'rgb(184, 85, 33)'
    const backGroundColor = await page.evaluate(async () => {
      return document.querySelector('#popup-cashless').style.backgroundColor
    })
    expect(backGroundColor).toEqual('rgb(184, 85, 33)')

    // Click #popup-retour div:has-text("RETOUR") >> nth=0
    await page.locator('#popup-retour div:has-text("RETOUR")').first().click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()
  })

  test('Cotisation ok.', async () => {
    // attente affichage menu burger
    await page.locator('.navbar-menu i[class~="menu-burger-icon"]').waitFor({state: 'visible'})

    // Clique sur le bouton "CHECK CARTE")
    await page.locator('#page-commandes-footer div[class~="test-check-carte"]').click()

    // Emulation de la carte nfc
    emulateTagIdNfc(page, tagId.carteTest)

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless').waitFor({state: 'visible'})

    // fond d'écran =  'rgb(51, 148, 72)'
    const backGroundColor = await page.evaluate(async () => {
      return document.querySelector('#popup-cashless').style.backgroundColor
    })
    expect(backGroundColor).toEqual('rgb(51, 148, 72)')

    // sortir de "popup-cashless"
    await page.locator('#popup-retour').click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()
  })

  test('Pas de cotisation.', async () => {
    // attente affichage menu burger
    await page.locator('.navbar-menu i[class~="menu-burger-icon"]').waitFor({state: 'visible'})

    // Clique sur le bouton "CHECK CARTE")
    await page.locator('#page-commandes-footer div[class~="test-check-carte"]').click()

    // Emulation de la carte nfc
    emulateTagIdNfc(page, tagId.carteRobocop)

    // attente affichage "popup-cashless"
    await page.locator('#popup-cashless').waitFor({state: 'visible'})

    // affichage text "Aucune cotisation"
    await expect(page.getByText('Aucune cotisation')).toBeVisible()

    // fond d'écran =  'rgb(184, 85, 33)'
    const backGroundColor = await page.evaluate(async () => {
      return document.querySelector('#popup-cashless').style.backgroundColor
    })
    expect(backGroundColor).toEqual('rgb(184, 85, 33)')

    // sortir de "popup-cashless"
    await page.locator('#popup-retour').click()

    // #popup-cashless éffacé
    await expect(page.locator('#popup-cashless')).toBeHidden()

    await page.close()
  })

})