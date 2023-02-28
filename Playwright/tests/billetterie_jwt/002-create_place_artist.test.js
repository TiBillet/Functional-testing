import {expect, test} from '@playwright/test'
import {getEnv, getTenantUrl, getRootJWT, randomDate, initData, getData, updateData} from '../../mesModules/commun.js'
// commun.js avant dataPeuplementInit.json, pour les variables d'environnement

const env = getEnv()
let tokenBilletterie

test.describe('root - Peuplement initial de la db "billetterie".', () => {
    test('Get root token', async ({request}) => {
        tokenBilletterie = await getRootJWT()
        console.log('tokenBilletterie =', tokenBilletterie)
    })

    test('Create places', async ({request}) => {

        // provenant de dataPeuplementTempo.json
        const dataDb = getData()
        let response
        const places = dataDb.filter(obj => obj.typeData === 'place')

        for (const placeR of places) {
            // ajout, donc modification
            placeR.value['stripe_connect_account'] = env.stripeAccountId
            // url cashless server

            const indexServer = placeR.value.organisation.toLowerCase()
            placeR.value['server_cashless'] = env.ticketing[indexServer].server_cashless
            placeR.value['key_cashless'] = env.ticketing[indexServer].key_cashless

            console.log('Création du lieu ', placeR.value.organisation)
            console.log('    data : ', placeR.value)
            console.log('url meta =', getTenantUrl('meta'))

            response = await request.post(getTenantUrl('meta') + '/api/place/', {
                headers: {
                    "Content-Type": "application/json"
                },
                data: placeR.value
            })

            expect(response.ok()).toBeTruthy()
            const retour = await response.json()

            console.log("-> Create places retour : ",retour)
            placeR.value['uuid'] = retour.uuid

        }
        // maj pour garder le state db dans les prochains tests
        updateData(dataDb)
    })

    test('Create artist', async ({request}) => {
        const dataDb = getData()
        let response
        const artists = dataDb.filter(obj => obj.typeData === 'artist')
        for (const artistR of artists) {

            artistR.value['stripe_connect_account'] = env.stripeAccountId
            console.log('Création artiste', artistR.value.organisation)

            response = await request.post(getTenantUrl('meta') + '/api/artist/', {
                headers: {
                    "Content-Type": "application/json"
                },
                data: artistR.value
            })

            expect(response.ok()).toBeTruthy()
            const retour = await response.json()

            // console.log('retour artist =', retour)
            // mémorise le uuid de l'artiste 'Ziskakan'
            artistR.value['uuid'] = retour.uuid
        }
        updateData(dataDb)
    })


})
