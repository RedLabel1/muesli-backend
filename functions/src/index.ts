import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as annaRecetasFaciles from './api/usecase/annaRecetasFaciles'
import * as recetasDeRechupete from './api/usecase/recetasDeRechupete'
import { Item } from './api/model/item'
 // tslint:disable-next-line:no-import-side-effect
import './util/extensions'

const cors = require('cors')({ origin: true })

admin.initializeApp()

export let queryParam: string

export const recipes = functions.https.onRequest((request, response) => {
    cors( request, response, async ()=> {
        if (request.method === 'POST') {
            let body: { query : string } = request.body
            queryParam = body.query.removeDiacritics()
            
            getCachedRecipes(queryParam)
            .then(querySnapshot => response.send(
                JSON.stringify(parseCachedRecipes(querySnapshot)))
            )
            .catch(() =>
                getAllRecipes()
                .then(result => {
                    const resultRecipes = mergeRecipes(result)
                    saveResult(queryParam, resultRecipes)
                    .then(() => response.send(JSON.stringify(resultRecipes)))
                    .catch(() => {
                        response.statusMessage = `Error saving the recipes for query string: ${queryParam}`
                        response.status(430).end()
                    })
                })
                .catch(() => {
                    response.statusMessage = 'Error scraping the web for recipes'
                    response.status(431).end()
                })
            )
        }
    })
})

export const cleanup = functions.pubsub.schedule('every day 3:00').timeZone('Europe/Madrid').onRun((context) => {
    const oneMonth = 1000 * 60 * 60 * 24 * 30
    const deletions: Array<Promise<FirebaseFirestore.WriteResult>> = []
    admin.firestore().collection('searches').get()
    .then(snapshot => {
        snapshot.docs.forEach(item => {
            if (new Date().getTime() > item.createTime.toDate().getTime() + oneMonth ) {
                deletions.push(deleteDocument(item))
            }
        })
        return Promise.all(deletions)
    })
    .catch()
    return null
})

const deleteDocument = async (document: FirebaseFirestore.DocumentSnapshot) => {
    return await document.ref.delete()
}

const getCachedRecipes = async (searchString: string) => {
    return await admin.firestore().collection('searches').where('query', '==', searchString).get()
}

const saveResult = async (searchString: string, searchResult: Array<Item>) => {
    return await admin.firestore().collection('searches').add({
        query: searchString,
        items: searchResult.map((item) => Object.assign({}, item))
    })
}

const parseCachedRecipes = (querySnapshot: FirebaseFirestore.QuerySnapshot) => {
    return querySnapshot.docs[0].data() as { query: string, items: Array<Item> }
}

const getAllRecipes = () => {
    return Promise.all([
        annaRecetasFaciles.getItems('1?s=' + queryParam, new Array<Item>()),
        recetasDeRechupete.getItems('1?s=' + queryParam, new Array<Item>())
    ])
}

const mergeRecipes = (items: Array<Array<Item>>) => {
    return ([] as Array<Item>).concat(...items)
}
