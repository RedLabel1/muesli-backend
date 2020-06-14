import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as annaRecetasFaciles from './api/usecase/annaRecetasFaciles'
import * as recetasDeRechupete from './api/usecase/recetasDeRechupete'
import { Item } from './api/model/item'
 // tslint:disable-next-line:no-import-side-effect
import './util/extensions'

const cors = require('cors')({ origin: true })

admin.initializeApp()

export let queryParam: { 'query': string }

export const search = functions.https.onRequest((request, response) => {
    cors( request, response, async ()=> {
        if (request.method === 'POST') {
            queryParam = JSON.parse(request.body)
            queryParam.query = queryParam.query.removeDiacritics()
            
            getCachedRecipes(queryParam.query)
            .then(querySnapshot => response.send(
                JSON.stringify(parseCachedRecipes(querySnapshot)))
            )
            .catch(() =>
                getAllRecipes()
                .then(result => {
                    const recipes = mergeRecipes(result)
                    saveResult(queryParam.query, recipes)
                    .then(() => response.send(JSON.stringify(recipes)))
                    .catch(() => response.send(JSON.stringify({
                        code: 530,
                        message: `Error saving the recipes for query string: ${queryParam.query}`
                    })))
                })
                .catch(() => response.send(JSON.stringify({
                    code: 531,
                    message: 'Error scraping the web for recipes'
                })))
            )
        }
    })
})

const getCachedRecipes = async (searchString: string) => {
    return await admin.firestore().collection('searches').where('query', '==', searchString).get()
}

const parseCachedRecipes = (querySnapshot: FirebaseFirestore.QuerySnapshot) => {
    return querySnapshot.docs[0].data() as { query: string, items: Array<Item> }
}

const getAllRecipes = () => {
    return Promise.all([
        annaRecetasFaciles.getItems('1?s=' + queryParam.query, new Array<Item>()),
        recetasDeRechupete.getItems('1?s=' + queryParam.query, new Array<Item>())
    ])
}

const mergeRecipes = (items: Array<Array<Item>>) => {
    return ([] as Array<Item>).concat(...items)
}

const saveResult = async (searchString: string, searchResult: Array<Item>) => {
    return await admin.firestore().collection('searches').add({
        query: searchString,
        items: searchResult.map((item) => Object.assign({}, item)),
        timestamp: new Date()
    })
}
