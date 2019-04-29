const urls = require("../config/config");
const api_env = process.env.ENVIRONMENT || 'dev_local'; // used to determine what auth url we should use for the deployment
const dbURL = urls.db_config[api_env];

const cls = require('continuation-local-storage'),
  namespace = cls.createNamespace('healthar');
const Sequelize = require('sequelize');
Sequelize.useCLS(namespace);
const Op = Sequelize.Op;

const sequelize = new Sequelize(dbURL, {
  logging: false,
  pool: {
    max: 35,
    idle: 30000,
    acquire: 6000000,
  },
  dialect: 'postgres',
  // dialectOptions: {
  //   ssl: true
  // }
}); // create instance

var User = sequelize.define('users', {
  name: Sequelize.STRING,
  email: Sequelize.STRING,
  password: Sequelize.STRING,
  profileblob: Sequelize.JSONB,
});
// User.sync({force: true}).then(function () { });

var Review = sequelize.define('review', {
  creatorID: Sequelize.INTEGER,
  locationID: Sequelize.STRING,
  inclusiveSexuality: Sequelize.BOOLEAN,
  inclusiveTransgender: Sequelize.BOOLEAN,
  unisexBathroom: Sequelize.BOOLEAN,
  bathroomLocationDescription: Sequelize.STRING,
  description: Sequelize.STRING
});
// Review.sync({force: true}).then(function () { });

User.hasMany(Review, { foreignKey: "creatorID" })
sequelize.sync();

module.exports = {
  Sequelize: sequelize,
  Op,
  User,
  Review
}