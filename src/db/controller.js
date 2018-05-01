
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
            if (!Array.isArray(rows)) {
                rows = core.values(datas);
            }
            try {
                if (done) {
                    return done(true, rows);
                }
            }
            catch (e) {
                console.log("Error while processing query results", e);
            }
        }).catch(function (error) {
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
    var asArray = core.isArray(queries);
    var _results = {};
    if (asArray) {
        _results = [];
    }
    var _success = true;
    var _todo = 0;
    var _error = undefined;
    var _scheduled = 0;
    core.for(queries, function (key, query) {
        _scheduled += 1;
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
                return done(_success, _results, _error);
            }
        });
    });
    if (_scheduled <= 0) {
        return done(_success, _results, _error);
    }
}

module.exports = $this;
