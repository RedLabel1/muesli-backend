import * as functions from 'firebase-functions';
import * as annaRecetasFaciles from "./api/usecase/annaRecetasFaciles"
import { FetchError } from 'node-fetch';

const cors = require('cors')({ origin: true });

export const search = functions.https.onRequest((request, response) => {
    cors( request, response, async ()=> {
        if (request.method === 'POST') {
            const queryParam: { 'query': string } = JSON.parse(request.body)
            annaRecetasFaciles.getItems(queryParam.query)
            .then(result => response.send(JSON.stringify(annaRecetasFaciles.parseHtml(result))))
            .catch(error => response.send(JSON.stringify(new FetchError("Error scraping annarecetasfaciles recipes", "531"))))
        }
    })
});
