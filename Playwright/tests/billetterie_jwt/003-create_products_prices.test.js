import {expect, test} from '@playwright/test'
import {getEnv, getTenantUrl, getRootJWT, randomDate, initData, getData, updateData} from '../../mesModules/commun.js'
// commun.js avant dataPeuplementInit.json, pour les variables d'environnement

const env = getEnv()
let tokenBilletterie

test.use({ignoreHTTPSErrors: true})

test.describe('Create products".', () => {
  test('Get root token', async ({request}) => {
    tokenBilletterie = await getRootJWT()
    console.log('tokenBilletterie =', tokenBilletterie)
  })

  test('Create product', async ({request}) => {
    const dataDb = getData()
    let response
    const products = dataDb.filter(obj => obj.typeData === 'product')

    for (const productR of products) {
        console.log('Création produit', productR.value.name, productR.place)
        const url = `https://${productR.place}.${env.domain}/api/products/`
        response = await request.post(url, {
            headers: {
                "Content-Type": "application/json",
                Authorization: 'Bearer ' + tokenBilletterie
            },
            data: productR.value
        })
        expect(response.ok()).toBeTruthy()
        const retour = await response.json()
        // mémorise le uuid du produit
        productR.value['uuid'] = retour.uuid
    }
    updateData(dataDb)
  })

  test('Create price', async ({request}) => {
    const dataDb = getData()
    let response
    const products = dataDb.filter(obj => obj.typeData === 'product')
    const prices = dataDb.filter(obj => obj.typeData === 'price')
    for (const priceR of prices) {
      console.log('Création du prix', priceR.value.name)
      const url = `https://${priceR.place}.${env.domain}/api/prices/`
      const uuidProduct = products.find(obj => obj.value.name === priceR.productName).value.uuid
      priceR.value['product'] = uuidProduct
      // console.log('url =', url)
      // console.log('priceR =', priceR)
      response = await request.post(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: 'Bearer ' + tokenBilletterie
        },
        data: priceR.value
      })
      expect(response.ok()).toBeTruthy()
    }
    updateData(dataDb)
    // TODO: + adhesion_obligatoire
  })

})
