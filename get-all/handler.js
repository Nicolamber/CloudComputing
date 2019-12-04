"use strict"

let mongo_user = "nico"
let mongo_pass = "39088195"
let dbname = "cloudEx"
let collname = "all"

const MongoClient = require('mongodb').MongoClient;

var clientsDB;
module.exports = (event, context) => {
    prepareDB()
        .then((database) => {
            var elementsArray = [];
            database.collection(collname).find({}).toArray()
                .then((docs) => {
                    var metadata, others
                    var merge = {}
                    var promesa = new Promise((resolve, reject) => {
                        docs.forEach((value, index, array) => {
                            var coll = value.type
                            others = value
                            database.collection(coll).find({ _id: value._id }).toArray()
                                .then((resultado) => {
                                    metadata = resultado[0]

                                    Object.keys(others)
                                        .forEach(key => merge[key] = others[key]);
                                    Object.keys(metadata)
                                        .forEach(key => merge[key] = metadata[key]);
                                    console.log("Resultado: " + merge)
                                    elementsArray.push(merge)

                                    if (index === array.length - 1) resolve();
                                })
                        });
                    })
                    promesa.then(() => {
                        var result = {
                            status: 200,
                            data: elementsArray
                        }
                        console.log("Result: " + result)
                        context
                            .status(200)
                            .succeed(result);
                    })
                });

        })
        .catch(err => {
            console.log(err.toString());
            context.fail(err.toString());
        });
}

const prepareDB = () => {

    const uri = "mongodb+srv://" + mongo_user + ":" + mongo_pass + "@cloudexamen-bdxha.gcp.mongodb.net/test?retryWrites=true&w=majority";

    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    return new Promise((resolve, reject) => {
        if (clientsDB) {
            console.error("DB already connected.");
            return resolve(clientsDB);
        }

        console.error("DB connecting");

        client.connect((err, client) => {
            if (err) {
                return reject(err)
            }

            clientsDB = client.db(dbname);
            return resolve(clientsDB)
        });
    });
}

