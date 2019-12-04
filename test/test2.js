"use strict"

let mongo_user = "openfaas"
let mongo_pass = "VAoOfJLVwX5W86Im"
let dbname = "files"
let collname = "metadata"

const MongoClient = require('mongodb').MongoClient;
var ExifImage = require('exif').ExifImage;
var Minio = require('minio');
var clientsDB;

const prepareDB = () => {

    const uri = "mongodb+srv://" + mongo_user + ":" + mongo_pass + "@cluster0-uc6in.gcp.mongodb.net/test?retryWrites=true&w=majority";

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

prepareDB()
    .then((database) => {

        var name = 'iguana.jpg'
        var path = name
        var exifresult, exifdata;

        console.log(name)

        var minioClient = new Minio.Client({
            endPoint: '35.199.100.179',
            port: 9000,
            useSSL: false,
            accessKey: 'minio',
            secretKey: 'minio123'
        });

        minioClient.fGetObject('files', name, path, (err) => {
            if (err) {
                console.log(err.toString());
            }
            try {
                new ExifImage({ image: path }, function (error, exifData) {
                    if (error) {
                        exifresult = 'Error: ' + error.message
                        console.log(exifresult)
                    }
                    else {
                        // Do something with your data!

                        const record = {
                            _id: 'wea',
                            exif: exifresult,
                            exifdata: exifData,
                            height: null,
                            width: null
                        }
                        console.log(record)
                        database.collection(collname).insertOne(record, (insertErr) => {
                            if (insertErr) {
                                console.log(insertErr.toString())
                            }


                        });
                    }

                });
            } catch (error) {
                console.log(error.toString())
            }
        })
    })
    .catch(err => {
        console.log(err.toString())
    });
/*
prepareDB()
    .then((database) => {
        var result = [];
        var cursor = database.collection(collname).find({});

        function iterateFunc(doc) {
            console.log(doc)
            console.log(JSON.stringify(doc, null, 4))
            result.push(doc);
        }

        function errorFunc(error) {
            console.log(error);
        }
        cursor.forEach(iterateFunc, errorFunc);
        console.log(result);
    })
    .catch(err => {
        console.log(err.message)
    });
*/
