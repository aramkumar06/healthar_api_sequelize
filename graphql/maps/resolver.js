const db = require("../../core/db");
var { request } = require('graphql-request')
var requestRest = require('request-promise-native');
const { mapSeries } = require('p-iteration');

const mapsClient = require("../../core/maps");
const urls = require("../../config/config");
const api_env = process.env.APPSETTING_API_ENV || 'dev_local'; // used to determine what auth url we should use for the deployment
const localAPIURL = urls.local_graphql[api_env];

let milesToMeters = (miles) => {
    return miles * 1609.344;
}

exports.resolver = {
    Query: {
        GetLocationsNearby(root, {radius, lat, lng}) {
            return mapsClient.placesNearby({
                location: {lat, lng},
                radius: milesToMeters(radius)
            }).asPromise()
            .then(async (response) => {
                let results = response.json.results;
                await mapSeries(results, async (place, placeIndex) => {
                    await db.Review.findAll({
                        where: {
                            locationID: place.place_id
                        },
                    }).then((reviews) => {
                        results[placeIndex].reviews = reviews;
                    })
                });

                return results;
            })
            .catch((err) => {
              console.log(err);
              return err;
            });
        },
        GetLocationDetails(root, { id }) {
            return mapsClient.place({
                placeid: id,
            }).asPromise()
            .then(async (response) => {
                let result = response.json.result;
                
                await db.Review.findAll({
                    where: {
                        locationID: place.place_id
                    },
                }).then((reviews) => {
                    results[placeIndex].reviews = reviews;
                })

                return result;
            })
            .catch((err) => {
              console.log(err);
              return err;
            });
        }
    },
    Mutation: {
        
    }
}