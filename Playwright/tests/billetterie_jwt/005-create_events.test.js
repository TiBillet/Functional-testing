import {expect, test} from '@playwright/test'
import {getEnv, getTenantUrl, getRootJWT, randomDate, initData, getData, updateData} from '../../mesModules/commun.js'
// commun.js avant dataPeuplementInit.json, pour les variables d'environnement

const env = getEnv()
const email = process.env.TEST_MAIL
let tokenBilletterie

test.describe.skip('On créé des évents', () => {

    test('Get root token', async ({request}) => {
        tokenBilletterie = await getRootJWT()
        console.log('tokenBilletterie =', tokenBilletterie)

    })

    test('Events Create with OPT ART - Ziskakan', async ({request}) => {
        const dataDb = getData()
        let response
        const artists = dataDb.filter(obj => obj.typeData === 'artist')
        const products = dataDb.filter(obj => obj.typeData === 'product')
        const options = dataDb.filter(obj => obj.typeData === 'option')
        const events = dataDb.filter(obj => obj.typeData === 'event')
        for (const eventR of events) {
            console.log("Création d'un évènement.")
            const url = `https://${eventR.place}.${env.domain}/api/events/`
            console.log('url =', url)
            // init
            let dataEvent = {
                datetime: randomDate(),
                short_description: eventR.short_description,
                long_description: eventR.long_description,
            }

            if (eventR.name !== undefined) {
                dataEvent['name'] = eventR.name
            }

            if (eventR.img_url !== undefined) {
                dataEvent['img_url'] = eventR.img_url
            }

            // les artistes
            if (eventR.artists !== undefined) {
            dataEvent['artists'] = []
                for (const artist of eventR.artists) {
                    // console.log('artist =', artist)
                    const uuidArtist = artists.find(obj => obj.value.organisation === artist).value.uuid
                    const datetime = randomDate()
                    dataEvent.artists.push({
                        uuid: uuidArtist,
                        datetime
                    })
                }
            }

            // les produits
            if (eventR.products !== undefined) {
            dataEvent['products'] = []
                for (const product of eventR.products) {
                    // console.log('product =', product)
                    const uuidProduct = products.find(obj => obj.value.name === product).value.uuid
                    dataEvent.products.push(uuidProduct)
                }
            }

            // les options options_checkbox
            // if (eventR.options_checkbox !== undefined) {
            // dataEvent['options_checkbox'] = []
            //     for (const options_checkbox of eventR.options_checkbox) {
            //         // console.log('options_checkbox =', options_checkbox)
            //         const uuidOption = options.find(obj => obj.value.name === options_checkbox).value.uuid
            //         dataEvent.options_checkbox.push(uuidOption)
            //     }
            //
            // }

            // les options options_radio
            // dataEvent['options_radio'] = []
            // if (eventR.options_radio !== undefined) {
            //     for (const options_radio of eventR.options_radio) {
            //         // console.log('options_radio =', options_radio)
            //         const uuidOption = options.find(obj => obj.value.name === options_radio).value.uuid
            //         dataEvent.options_radio.push(uuidOption)
            //     }
            // }


            dataEvent['stripe_connect_account'] = env.stripeAccountId

            console.log('dataEvent =', dataEvent)

            response = await request.post(url, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: 'Bearer ' + tokenBilletterie
                },
                data: dataEvent
            })
            console.log("response response.ok() : ", response.ok())
            expect(response.ok()).toBeTruthy()
        }
    })

})
