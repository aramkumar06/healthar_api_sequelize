const GraphQLJSON = require('graphql-type-json');

const urls = require("../../config/config");
const api_env = process.env.APPSETTING_API_ENV || 'dev_local'; // used to determine what auth url we should use for the deployment
const localAPIURL = urls.local_graphql[api_env];

const db = require("../../core/db");

exports.resolver = {
    JSON: GraphQLJSON,
    Query: {
        Test(root, {send}) {
            
            return db.User.findOrCreate({
                where: {
                  name: "Lily Craver",
                  typeID: send
                },
                include: [db.UserType]
              }).spread((user) => {

                console.log(user.dataValues)

                return user;
              })
        },
    }
}