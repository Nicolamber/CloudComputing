let mongo_user = "openfaas"
let mongo_pass = "VAoOfJLVwX5W86Im"

const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

const uri = "mongodb+srv://" + mongo_user + ":" + mongo_pass + "@cluster0-uc6in.gcp.mongodb.net/test?retryWrites=true&w=majority";

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(function(err, client) {
    if (err) {
        console.log("err: " + err)
    } else {
        assert.equal(null, err);
        const database = client.db("files");

        database.collection('metadata').insertOne({
            item: 'canvas',
            qty: 100,
            tags: ['cotton'],
            size: { h: 28, w: 35.5, uom: 'cm' }
        })
            .then(function (result) {
                console.log("correct: " + result)
            });
    }
    client.close();
});