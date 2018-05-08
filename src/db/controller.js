
var core = require("../core");

/*
var database = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: "./database/dev.sqlite3",
    },
});
*/
var database = require('knex')({
    client: 'pg',
    version: '7.2',
    connection: {
        host: '127.0.0.1',
        user: 'leo',
        port: 5433, 
        password: '',
        database: 'git-metrics'
    },
});

database.on('query', function (queryData) {
    /*
    var uid = queryData.__knexUid;
    console.log("DB@" + uid);
    console.log("--");
    console.log(queryData.sql);
    console.log("--");
    */
});

var $local = {};

$local._query = function (tableName) {
    // Locally accessible object
    var self = this;
    // Use the specified object
    self._internal = database;
    // If the user specified a table name to query
    if (tableName !== undefined) {
        self._internal = self._internal(tableName);
    }
    // Copy the knex functionalities
    var methods = core.functions(database);
    core.for(methods, function (idx, method) {
        // Chained method dont need to be chained anymore
        self[method] = function () {
            var args = Array.from(arguments);
            var result = self._internal[method].apply(self._internal, args);
            self._internal = result;
            return self;
        };
        // Also create a copy (usefull for overrides)
        self["_" + method] = self[method];
    });
    // Easier selection aliases
    self.selectAs = function (dict) {
        var columns = [];
        core.for(dict, function (key, value) {
            columns.push(key + " AS " + value);
        });
        return self.select(columns);
    };
    // Execute the query with a callback
    self.execute = function (next) {
        var startTime = core.moment();
        self._internal.then(function (datas) {
            var execTime = core.moment().diff(startTime, "ms");
            if (execTime > 100) {
                console.log("Query:", self._internal._method, tableName, execTime + "ms");
            }
            var rows = datas;
            if (!core.isArray(rows)) {
                rows = core.values(datas);
            }
            try {
                if (next) {
                    return next(true, rows);
                }
            }
            catch (error) {
                console.log("Error while processing query results", error);
            }
        }).catch(function (error) {
            //console.log("Error while processing query", error);
            if (next) {
                return next(false, null, error);
            }
        });
    };
    // Raw sql string
    self.toString = function (a) {
        return self._internal.toString(a);
    };
};

var $this = {};

$this.query = function (tableName) {
    var q = new ($local._query)(tableName);
    return q;
};

$this.rawQuery = function (str) {
    return $this.query().raw(str);
};

$this.explain = function (query, next) {
    var clientType = database.client.config.client;
    var isPostgres = clientType == "pg";
    var isSqlite = clientType == "sqlite3";
    if (isSqlite) {
        var query = $this.rawQuery("EXPLAIN QUERY PLAN " + query.toString());
        query.execute(next);
    }
    if (isPostgres) {
        var query = $this.rawQuery("EXPLAIN  " + query.toString());
        query.execute(next);
    }
};

$this.parallel = function (queries, next) {
    var _max = core.count(queries);
    var logs = _max >= 200;
    if (logs) {
        console.log("Starting", _max, "db queries");
    }
    var asArray = core.isArray(queries);
    var _total = 0;
    var _success = true;
    var _results = {};
    if (asArray) {
        _results = [];
    }
    var _error = undefined;
    var queriesChunks = core.chunks(queries, 100);
    core.seq(queriesChunks, function (idx, queriesChunk, next) {
        var _todo = 0;
        core.for(queriesChunk, function (key, query) {
            _total += 1;
            _todo += 1;
            var result = {
                success: false,
            };
            if (asArray) {
                _results.push(result);
            }
            else {
                _results[key] = result;
            }
            query.execute(function (success, datas, error) {
                result.success = success;
                result.datas = datas;
                result.error = error;
                if (!success) {
                    if (!_error) {
                        _error = error;
                    }
                    _success = false;
                }
                _todo -= 1;
                if (_todo <= 0) {
                    if (logs) {
                        console.log("Done with", _total, "queries", "out of", _max);
                    }
                    next();
                }
            });
        });
    }, function () {
        return next(_success, _results, _error);
    });
};

$this.combined = function (queries, next) {
    // Run all queries in parallel
    $this.parallel(queries, function (success, results, error) {
        // On failure of one, fails
        if (!success) {
            return next(false, null, error);
        }
        // Combine all results from all queries into one list
        var finalResults = [];
        core.for(results, function (idx, result) {
            core.for(result.datas, function (idx, data) {
                finalResults.push(data);
            });
        });
        // Done
        return next(success, finalResults, error);
    });
};

$this.batch = function (datas, queryGenerator) {
    // Cut data into multiple chunks
    var chunks = core.chunks(datas, 100);
    var queries = [];
    // Generate a query for each chunk
    core.for(chunks, function (idx, chunk) {
        queries.push(queryGenerator(chunk));
    });
    // Optionally log large batches works
    var dataCount = core.count(datas);
    if (dataCount > 10000) {
        var queryCount = core.count(queries);
        console.log("Batched", dataCount, "datasets, as", queryCount, "db queries");
    }
    // Done
    return queries;
};

$this.inserts = function (tableName, tableRows, conflictCondition, next) {
    // Batch changes insertions
    var batch = $this.batch(tableRows, function (chunk) {
        var query = $this.query(tableName);
        query.insert(chunk);
        var clientType = database.client.config.client;
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
                return $this.rawQuery(conflictCondition + query.toString().substring(6));
            }
            if (isPostgres) {
                return $this.rawQuery(query.toString() + conflictCondition);
            }
        }
        return query;
    });
    // Batch insertion queries
    $this.combined(batch, function (success, results, error) {
        // Done
        return next(success, results, error);
    });
};

$this.updateBy = function (tableName, indexColumn, indexKeys, indexedValues, next) {
    // Update data
    var updateData = [];
    var updateCount = core.count(indexKeys);
    for (var i = 0; i < updateCount; i++) {
        updateData.push([indexKeys[i], indexedValues[i]]);
    }
    // Update chunks
    var updateChunks = core.chunks(updateData, 100);
    // Update state
    var _success = true;
    var _total = core.count(updateChunks);
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

module.exports = $this;
