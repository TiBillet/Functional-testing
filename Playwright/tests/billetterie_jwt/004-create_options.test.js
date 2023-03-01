import {expect, test} from '@playwright/test'
import {getEnv, getTenantUrl, getRootJWT, randomDate, initData, getData, updateData} from '../../mesModules/commun.js'
// commun.js avant dataPeuplementInit.json, pour les variables d'environnement

const env = getEnv()
let tokenBilletterie

test.use({ignoreHTTPSErrors: true})

test.describe('On ajoute les options aux tenants', () => {

    test('Get root token', async ({request}) => {
        tokenBilletterie = await getRootJWT()
        console.log('tokenBilletterie =', tokenBilletterie)
    })

    test('Create options', async ({request}) => {
        const dataDb = getData()
        let response
        const options = dataDb.filter(obj => obj.typeData === 'option')
        for (const option of options) {
            console.log("Création de l'option", option.value.name)
            const url = `https://${option.place}.${env.domain}/api/optionticket/`
            // console.log('url =', url)
            // console.log('option =', option)
            response = await request.post(url, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: 'Bearer ' + tokenBilletterie
                },
                data: option.value
            })
            expect(response.ok()).toBeTruthy()
            const retour = await response.json()
            // mémorise le uuid
            option.value['uuid'] = retour.uuid
        }
        updateData(dataDb)
        // TODO: + adhesion_obligatoire
    })


})
