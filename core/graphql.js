const api_env = 'dev_local'; // this is used to determine cors setup

// imports for graphql
const graphqlHTTP = require('express-graphql');
const { makeExecutableSchema } = require('graphql-tools')
const { transpileSchema } = require('graphql-s2s').graphqls2s
const glue = require('schemaglue')

// Setup for graphql
let { schema, resolver } = glue('graphql')

const executableSchema = makeExecutableSchema({
    typeDefs: [transpileSchema(schema)],
    resolvers: resolver,
    pretty: true
})

module.exports = graphqlHTTP({
    schema: executableSchema,
    graphiql: true,
    context: { }
});