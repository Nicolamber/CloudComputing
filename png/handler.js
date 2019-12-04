"use strict"

let mongo_user = "nico"
let mongo_pass = "39088195"
let dbname = "cloudEx"
let collname = "png"

let minioEndpoint = '35.247.221.53'
let minioAccesKey = 'minio'
let minioSecretKey = 'minio123'
let miniobucket = 'cloud'

const MongoClient = require('mongodb').MongoClient;
var Minio = require('minio');
var sizeOf = require('image-size');

var clientsDB;

module.exports = (event, context) => {
    prepareDB()
        .then((database) => {
            var name = event.body.Records[0].s3.object.key;

            console.log(name)

            var minioClient = new Minio.Client({
                endPoint: minioEndpoint,
                port: 9000,
                useSSL: false,
                accessKey: minioAccesKey,
                secretKey: minioSecretKey
            });
            minioClient.fGetObject(miniobucket, name, name, (err) => {
                if (err) {
                    console.log(err);
                    return context.fail(err.toString())
                }

                // Do something with your data!
                sizeOf(name, (err, dimensions) => {
                    var height, width, pixels = 0
                    if (!err) {
                        height = dimensions.height
                        width = dimensions.width
                        pixels = height * width
                    }
                    const record = {
                        _id: event.body.Key,
                        height: height,
                        width: width,
                        pixels: pixels + 'px'
                    }
                    console.log(record)
                    database.collection(collname).insertOne(record, (insertErr) => {
                        if (insertErr) {
                            if (insertErr.toString().includes('MongoError: E11000')) {
                                database.collection(collname).updateOne(
                                    { _id: record._id },
                                    {
                                        $set: {
                                            height: height,
                                            width: width,
                                            pixels: pixels + 'px'
                                        },
                                        $currentDate: { lastModified: true }
                                    })
                                    .then(function (result) {
                                        console.log('Updated')
                                    })
                            } else
                                return context.fail(insertErr.toString());
                        }

                        context
                            .status(200)
                            .succeed(record);

                    });

                });
            })
        })
        .catch(err => {
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