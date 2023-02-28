import {test} from '@playwright/test'
import {getEnv, getTenantUrl, getRootJWT, randomDate, initData, getData, updateData} from '../../mesModules/commun.js'
// commun.js avant dataPeuplementInit.json, pour les variables d'environnement

let tokenBilletterie

test.describe('Création du fichier de variables', () => {
    test('Get root token', async ({request}) => {
        tokenBilletterie = await getRootJWT()
        console.log('tokenBilletterie =', tokenBilletterie)
    })

    test('initData', async ({request}) => {
        // ne faire qu'une fois si l'on veut garder en état le cheminement des tests
        await initData()
    })
})
