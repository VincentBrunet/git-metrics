
var core = require("../core");

var database = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: "./database/dev.sqlite3",
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
    self.execute = function (done) {
        self._internal.then(function (datas) {
            var rows = datas;
            if (!core.isArray(rows)) {
                rows = core.values(datas);
            }
            try {
                if (done) {
                    return done(true, rows);
                }
            }
            catch (error) {
                console.log("Error while processing query results", error);
            }
        }).catch(function (error) {
            console.log("Error while processing query", error);
            if (done) {
                return done(false, null, error);
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

$this.parallel = function (queries, done) {
    var _max = core.count(queries);
    console.log("Starting", _max, "db queries");
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
                    console.log("Done with", _total, "queries", "out of", _max);
                    next();
                }
            });
        });
    }, function () {
        return done(_success, _results, _error);
    });
};

$this.combined = function (queries, next) {
    var isArray = core.isArray(queries);
    $this.parallel(queries, function (success, results, error) {
        if (!success) {
            return next(false, null, error);
        }
        var finalResults = [];
        core.for(results, function (idx, result) {
            core.for(result.datas, function (idx, data) {
                finalResults.push(data);
            });
        });
        return next(success, finalResults, error);
    });
};

$this.batch = function (datas, queryGenerator) {
    var chunks = core.chunks(datas, 100);
    var queries = [];
    core.for(chunks, function (idx, chunk) {
        queries.push(queryGenerator(chunk));
    });
    console.log("Batched", core.count(datas), "datasets, as", queries.length, "db queries");
    return queries;
};

$this.inserts = function (tableName, tableRows, insertCondition, next) {
    // Batch changes insertions
    var batch = $this.batch(tableRows, function (chunk) {
        var query = $this.query(tableName);
        query.insert(chunk);
        if (insertCondition == "ignore") {
            insertCondition = "insert or ignore";
        }
        if (insertCondition == "replace") {
            insertCondition = "insert or replace";
        }
        if (insertCondition) {
            return $this.rawQuery(insertCondition + query.toString().substring(6));
        }
        return query;
    });
    // Batch insertion queries
    $this.combined(batch, function (success, results, error) {
        // Done
        return next(success, results, error);
    });
};

$this.updates = function (tableName, objectsById, next) {
    // Create update queries
    var updateQueries = [];
    core.for(objectsById, function (key, value) {
        var query = dbController.query(tableName);
        query.where("id", key);
        query.update(value);
        updateQueries.push(query);
    });
    // Batch update queries
    dbController.combined(updateQueries, function (success, results, error) {
        // Done
        return next(success, results, error);
    });
};

module.exports = $this;
