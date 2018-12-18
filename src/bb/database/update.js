
var thisQuery = require("./query");
var thisExecute = require("./execute");

var _ = require("lodash");

module.exports = async function (tableName, indexColumn, indexKeys, indexedValues) {
    // Create one query for each update :(
    var updateQueries = [];
    var updateCount = indexKeys.length;
    for (var i = 0; i < updateCount; i++) {
        var query = thisQuery(tableName);
        var key = indexKeys[i];
        var value = indexedValues[i];
        if (_.isArray(key)) {
            query.whereIn(indexColumn, key);
        }
        else {
            query.where(indexColumn, key);
        }
        query.update(value);
        updateQueries.push(query);
    }
    // Execute
    return await thisExecute(updateQueries);
};
