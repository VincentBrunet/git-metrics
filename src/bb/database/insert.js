
var thisNative = require("./_native");

var thisBatch = require("./batch");
var thisExecute = require("./execute");

module.exports = async function (tableName, tableRows, conflictCondition) {
    // Batch insertions
    var batch = thisBatch(tableName, tableRows, function (query, chunk) {
        query.insert(chunk);
        var clientType = thisNative.client.config.client;
        var isPostgres = clientType == "pg";
        var isSqlite = clientType == "sqlite3";
        if (conflictCondition == "ignore") {
            if (isSqlite) {
                conflictCondition = "insert or ignore";
            }
            if (isPostgres) {
                conflictCondition = " ON CONFLICT DO NOTHING";
            }
        }
        if (conflictCondition == "replace") {
            if (isSqlite) {
                conflictCondition = "insert or replace";
            }
            if (isPostgres) {
                conflictCondition = " ON CONFLICT DO UPDATE";
            }
        }
        if (conflictCondition) {
            if (isSqlite) {
                return query.raw(conflictCondition + query.SQL().substring(6));
            }
            if (isPostgres) {
                return query.raw(query.SQL() + conflictCondition);
            }
        }
    });
    // Execute
    return await thisExecute(batch);
};