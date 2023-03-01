import {expect, test} from '@playwright/test'
import {getEnv, getTenantUrl, getRootJWT, randomDate, initData, getData, updateData} from '../../mesModules/commun.js'
// commun.js avant dataPeuplementInit.json, pour les variables d'environnement

const env = getEnv()
let tokenBilletterie

test.use({ignoreHTTPSErrors: true})

test.describe.skip('on envoie les cartes cashless !', () => {
    console.log('cartes cashless')
})
