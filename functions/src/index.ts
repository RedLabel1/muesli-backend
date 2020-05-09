import * as functions from 'firebase-functions'
import * as annaRecetasFaciles from './api/usecase/annaRecetasFaciles'
import * as recetasDeRechupete from './api/usecase/recetasDeRechupete'
import { Item } from './api/model/item';
 // tslint:disable-next-line:no-import-side-effect
import './util/extensions'

const cors = require('cors')({ origin: true })

export let queryParam: { 'query': string }

export const search = functions.https.onRequest((request, response) => {
    cors( request, response, async ()=> {
        if (request.method === 'POST') {
            queryParam = JSON.parse(request.body)
            queryParam.query = queryParam.query.removeDiacritics()
            getAllRecipes()
            .then(result => response.send(JSON.stringify(mergeRecipes(result))))
            .catch(() => response.send(JSON.stringify({
                code: 531,
                message: 'Error scraping the web for recipes'
            })))
        }
    })
});

const getAllRecipes = (): Promise<Array<Item[]>> => {
    return Promise.all([
        annaRecetasFaciles.getItems('1?s=' + queryParam.query, new Array<Item>()),
        recetasDeRechupete.getItems('1?s=' + queryParam.query, new Array<Item>())
    ])
}

const mergeRecipes = (items: Array<Array<Item>>): Array<Item> => {
    return ([] as Array<Item>).concat(...items)
}
