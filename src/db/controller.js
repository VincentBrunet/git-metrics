
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
    // Execute the query with a callback
    self.execute = function (done) {
        self._internal.then(function (datas) {
            var rows = datas;
            if (!Array.isArray(rows)) {
                rows = core.values(datas);
            }
            if (done) {
                return done(true, rows);
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

module.exports = $this;
