var http = require('http');
var express = require('express');
var bodyParser = require("body-parser");
var cors = require('cors');
var urls = require('./config/config'); // stores all cors whitelist
const graphqlMiddleware = require('./core/graphql');

const port = process.env.PORT || 4000

var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// setup cors based on deployment space
var corsOptions = {
  origin: function (origin, callback) {
    callback(null, true)
  },
  credentials: true
}

// apply cors
app.use(cors(corsOptions))

// setup graphql
app.use('/graphql', graphqlMiddleware);

// Let the server know this will primarly be a json api
app.use(function (req, res, next) {
  res.header('Content-Type', 'application/json');
  next();
});

app.get('/env', (req, res) => res.send({
  "env": process.env
}))

var server = http.createServer(app);
server.listen(port)