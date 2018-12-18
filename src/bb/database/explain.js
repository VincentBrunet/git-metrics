
var thisNative = require("./_native");

var thisQuery = require("./query");
var thisExecute = require("./execute");

module.exports = async function (query) {
    var clientType = thisNative.client.config.client;
    var isPostgres = clientType == "pg";
    var isSqlite = clientType == "sqlite3";
    if (isSqlite) {
        var explainQuery = thisQuery().raw("EXPLAIN QUERY PLAN " + query.SQL());
        return await thisExecute(explainQuery);
    }
    if (isPostgres) {
        var explainQuery = thisQuery().raw("EXPLAIN  " + query.SQL());
        return await thisExecute(explainQuery);
    }
};
