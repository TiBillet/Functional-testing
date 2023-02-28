import {expect, test} from '@playwright/test'
import {getEnv, getTenantUrl, getRootJWT, randomDate, initData, getData, updateData} from '../../mesModules/commun.js'
// commun.js avant dataPeuplementInit.json, pour les variables d'environnement

const env = getEnv()
const email = process.env.TEST_MAIL
let tokenBilletterie

test.describe('on envoie les cartes cashless !', () => {
    console.log('cartes cashless')
})
