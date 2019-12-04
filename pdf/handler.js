"use strict"

let mongo_user = "nico"
let mongo_pass = "39088195"
let dbname = "cloudEx"
let collname = "pdf"

let minioEndpoint = '35.247.221.53'
let minioPort = 9000
let minioAccessKey = 'minio'
let minioSecretKey = 'minio123'
let miniobucket = 'cloud'

const MongoClient = require('mongodb').MongoClient;
const pdf = require('pdf-parse');
const fs = require('fs');
var Minio = require('minio');

var clientsDB;  // Cached connection-pool for further requests.

module.exports = (event, context) => {
	prepareDB()
		.then((database) => {

			var name = event.body.Records[0].s3.object.key;

            console.log(name)

            var minioClient = new Minio.Client({
                endPoint: minioEndpoint,
                port: minioPort,
                useSSL: false,
                accessKey: minioAccessKey,
                secretKey: minioSecretKey
            });
            minioClient.fGetObject(miniobucket, name, name, (err) => {
                if (err) {
                    console.log(err);
                    return context.fail(err.toString())
				}
				
				let dataBuffer = fs.readFileSync(name)

				pdf(dataBuffer).then(function(data) {
						
					const record = {
						_id: event.body.Key,
						metadata: data.metadata,
						text: data.text
					}

					database.collection(collname).insertOne(record, (insertErr) => {
						if (insertErr) {
							if (insertErr.toString().includes('MongoError: E11000')) {
								database.collection(collname).updateOne(
									{ _id: record._id },
									{
										$set: {
											metadata: record.metadata,
											text: record.text
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

	console.error("Version 1.03")

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
