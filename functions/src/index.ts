import * as functions from 'firebase-functions'
import * as annaRecetasFaciles from "./api/usecase/annaRecetasFaciles"
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
            annaRecetasFaciles.getItems('1?s=' + queryParam.query, new Array<Item>())
            .then(result => response.send(JSON.stringify(result)))
            .catch(() => response.send(JSON.stringify({
                code: 531,
                message: "Error scraping annarecetasfaciles recipes"
            })))
        }
    })
});

// const call = (): Promise<Array<Item[]>> => {
//     return Promise.all(
//         [annaRecetasFaciles.getItems('1?s=' + queryParam.query, new Array<Item>())]
//     )
// }
