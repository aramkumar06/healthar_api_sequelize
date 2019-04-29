const client = require('@google/maps').createClient({
    key: process.env.MAPS_API,
    Promise: Promise
});

module.exports = client