
var thisNative = require("./_native");

var thisQuery = require("./query");
var thisBatch = require("./batch");
var thisExecute = require("./execute");

module.exports = async function (tableName, tableRows, conflictCondition) {
    // Batch insertions
    var batch = thisBatch(undefined, tableRows, function (query, chunk) {
        var referenceQuery = thisQuery(tableName);
        referenceQuery.insert(chunk);
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
                query.raw(conflictCondition + referenceQuery.SQL().substring(6));
                return;
            }
            if (isPostgres) {
                query.raw(referenceQuery.SQL() + conflictCondition);
                return;
            }
        }
        query.raw(referenceQuery.SQL());
        return;
    });
    // Execute
    return await thisExecute(batch);
};
