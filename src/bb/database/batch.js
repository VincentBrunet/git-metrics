
var arrayChunks = require("../array/chunks");

var flowFor = require("../flow/for");

var thisQuery = require("./query");

module.exports = function (tableName, datas, queryGenerator) {
    // Cut data into multiple chunks of 100 elements
    var chunks = arrayChunks(datas, function (idx, data) {
        return idx % 100 == 0;
    });
    // Generate a query for each chunk
    var queries = [];
    flowFor(chunks, function (idx, chunk) {
        var query = thisQuery(tableName);
        if (queryGenerator) {
            queryGenerator(chunk);
        }
        queries.push(query);
    });
    // Done
    return queries;
};
