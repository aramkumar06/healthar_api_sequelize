const db = require("../../core/db");
var { request } = require('graphql-request')
var requestRest = require('request-promise-native');
const { mapSeries } = require('p-iteration');

const urls = require("../../config/config");
const api_env = process.env.APPSETTING_API_ENV || 'dev_local'; // used to determine what auth url we should use for the deployment
const localAPIURL = urls.local_graphql[api_env];

exports.resolver = {
	Query: {
		GetAllReviewsForID(root, { id }) {
			return db.Review.findAll({
                where: {
                    locationID: id
                },
			}).then((reviews) => {
				return reviews;
			})
		},
		GetAllReviewsForUser(root, {id}) {
			return db.Review.findAll({
                where: {
                    creatorID: id
                }
			}).then((reviews) => {
				return reviews;
			})
		}
	},
	Mutation: {
		CreateReview(root, { lat, lng, creatorID, locationID, inclusiveSexuality, inclusiveTransgender, unisexBathroom, bathroomLocationDescription, description }) {
			return db.Review.create({
				lat,
				lng,
                creatorID,
                locationID,
                inclusiveSexuality,
                inclusiveTransgender,
                unisexBathroom,
                bathroomLocationDescription,
                description
			}).then((review) => {
				console.log(review.dataValues)
				return review;
			}).catch((err) => {
				if (err) throw new Error(err)
				return err;
			})
		},
		EditReview(root, { id, inclusiveSexuality, inclusiveTransgender, unisexBathroom, bathroomLocationDescription, description }) {

			let updateObject = {};

			if (inclusiveSexuality != null)
				updateObject.inclusiveSexuality = inclusiveSexuality;

			if (inclusiveTransgender != null)
				updateObject.inclusiveTransgender = inclusiveTransgender;

			if (unisexBathroom != null)
                updateObject.unisexBathroom = unisexBathroom;
                
            if(bathroomLocationDescription)
                updateObject.bathroomLocationDescription = bathroomLocationDescription;

            if(description)
                updateObject.description = description;

			return db.Review.findOne({
				where: {
					id
				}
			}).then((review) => {
				return review.update(updateObject)
					.then((review) => {
						console.log("Updated Review")
						return true;
					})
					.catch((err) => {
						if (err) throw new Error(err)
						return false;
					})
			}).catch((err) => {
				if (err) throw new Error(err)
				return false;
			})
		}
	}
}