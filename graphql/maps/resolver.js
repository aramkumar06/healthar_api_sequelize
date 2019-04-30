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
        GetReviewsNearby(root, {radius, lat, lng}) {

            let query = `SELECT * FROM public.reviews WHERE "lng" >= ${lng-1} AND "lng" <= ${lng+1} AND "lat" >= ${lat-1} AND "lat" <= ${lat+1}`;

            return db.Sequelize.query(query).then(async ([results, metadata]) => {
                return results;
            })
        },
        GetLocationsNearby(root, {radius, lat, lng, name, category}) {

            let tmpName = name;

            if(category)
            {
                if(category == "all" && name == null)
                    tmpName = null
                else if(category == "all" && name != null)
                    tmpName = name
                else if(category == "restroom")
                    tmpName = null
                else if(name == null) 
                    tmpName = category
                else 
                    tmpName = name + " " + category
            }

            console.log(tmpName)

            return mapsClient.placesNearby({
                name: tmpName,
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

                        let count = 0;
                        let total = 0;
                        reviews.map((review, id) => {
                            if(review.unisexBathroom != null)
                            {
                                if(review.unisexBathroom)
                                    count = count + 1;
                                total = total + 1;
                            }
                        })

                        results[placeIndex].hasBR = (count / total > 0.5);
                    })
                });

                if(category == "restroom")
                    results = results.filter(x => x.hasBR)

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