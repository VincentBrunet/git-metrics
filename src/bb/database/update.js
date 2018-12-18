
var thisNative = require("./_native");

var thisQuery = require("./query");
var thisExecute = require("./execute");

module.exports = async function (tableName, indexColumn, indexKeys, indexedValues) {
    // Update data
    var updateData = [];
    var updateCount = indexKeys.length;
    for (var i = 0; i < updateCount; i++) {
        updateData.push([indexKeys[i], indexedValues[i]]);
    }
    // Update chunks
    var updateChunks = core.chunks(updateData, 100);
    // Update state
    var _success = true;
    var _total = updateChunks.length;
    var _dones = 0;
    var _error = undefined;
    // Progression
    var updateDone = 0;
    var logs = updateCount > 200;
    if (logs) {
        console.log("Starting", updateCount, "updates");
    }
    // Sequentially update by chunk
    core.seq(updateChunks, function (idx, updateChunk, next) {
        // Make the queries
        var updateQueries = [];
        core.for(updateChunk, function (idx, data) {
            var key = data[0];
            var value = data[1];
            var query = $this.query(tableName);
            if (core.isArray(key)) {
                query.whereIn(indexColumn, key);
            }
            else {
                query.where(indexColumn, key);
            }
            query.update(value);
            updateQueries.push(query);
            updateDone++;
        });
        // Batch update queries
        $this.combined(updateQueries, function (success, results, error) {
            // Failure count
            if (!success) {
                _success = false;
                _error = error;
            }
            // Success count
            else {
                _dones++;
            }
            // Progress
            if (logs) {
                console.log("Ran", updateDone, "out of", updateCount, "updates");
            }
            // Done
            return next();
        });
    }, function () {
        // Return queries success stats
        return next(_success, _dones / _total, _error);
    });
};