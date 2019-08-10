import {readable} from 'svelte/store';

export const foo = 'foo';

let stitch;
export async function getDb() {
    if (!stitch) {
        stitch = require('mongodb-stitch-browser-sdk');
    }

    const {
        Stitch,
        RemoteMongoClient,
        AnonymousCredential
    } = stitch;

    return {testQuery};

    async function testQuery() {
        try {
            const client = Stitch.initializeDefaultAppClient('trivit-sdpry');

            const db = client.getServiceClient(RemoteMongoClient.factory, 'mongodb-atlas')
                .db('trivia');
            await client.auth.loginWithCredential(new AnonymousCredential());

            await db.collection('questions')
                .updateOne({owner_id: client.auth.user.id},
                    {$set:{number:42}},
                    {upsert:true});

            const docs = await db.collection('questions')
                .find({owner_id: client.auth.user.id},
                    {limit: 100}).asArray();

            console.log("Found docs", docs)
            console.log("[MongoDB Stitch] Connected to Stitch")
            return docs;
        } catch (err) {
            console.error(err)
        }
    }
}
/*
onMount(() => module.exports = {
    testQuery: new Promise(resolve => {
        const {
            Stitch,
            RemoteMongoClient,
            AnonymousCredential
        } = require('mongodb-stitch-browser-sdk');

        console.log('i ran');
        console.dir(Stitch);

        return resolve(testQuery);

    })
}
*/


