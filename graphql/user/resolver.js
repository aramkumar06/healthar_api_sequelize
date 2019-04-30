const db = require("../../core/db");
var { request } = require('graphql-request')
var requestRest = require('request-promise-native');
const { mapSeries } = require('p-iteration');

const urls = require("../../config/config");
const api_env = process.env.APPSETTING_API_ENV || 'dev_local'; // used to determine what auth url we should use for the deployment
const localAPIURL = urls.local_graphql[api_env];

exports.resolver = {
	Query: {
		GetAllUsers(root, { }) {
			return db.User.findAll({
				include: [db.Review]
			}).then((users) => {
				return users;
			}).catch((err) => {
				if (err) throw new Error(err)
				return err;
			})
		},
		GetUser(root, {id}) {
			return db.User.findById(id, {
				include: [db.Review]
			}).then((users) => {
				return users;
			}).catch((err) => {
				if (err) throw new Error(err)
				return err;
			})
		},
		Login(root, {email, password}) {
			return db.User.findOne({
				where: {
					email,
					password
				}
			}).then((user) => {
				if(user == null)
					return {
						error: "No user found!"
					}
				else
					return {
						id: user.id
					}
			}).catch((err) => {
				if (err) throw new Error(err)
				return err;
			})
		}
	},
	Mutation: {
		CreateUser(root, { name, email, password }) {
			return db.User.findOrCreate({
				where: {
					name,
					email,
					password
				}
			}).spread((user) => {
				console.log(user.dataValues)
				return user;
			}).catch((err) => {
				if (err) throw new Error(err)
				return err;
			})
		},
		EditUser(root, { id, name, email, password }) {

			let updateObject = {};

			if (name)
				updateObject.name = name;

			if (email)
				updateObject.email = email;

			if (password)
				updateObject.password = password;

			return db.User.findOne({
				where: {
					id
				}
			}).then((user) => {
				return user.update(updateObject)
					.then((user) => {
						console.log("Updated User")
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