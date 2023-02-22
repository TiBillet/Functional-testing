import {test} from '@playwright/test'
import {userAgentString} from '../../mesModules/commun.js'

test.use({userAgent: userAgentString})
test.use({viewport: {width: 1024, height: 800}})

const urlTester = 'https://demo.tibillet.localhost/'
let page

test.describe('ensemble de tets TibilletDev.', () => {
  test('test1', async ({browser}) => {
    // 1 - connexion appareil client
    page = await browser.newPage()

    console.log('-> TibilletDev tests !!!!')
    // première connexion
    await page.goto(urlTester)

    await page.pause()

    await page.close()
  })
})