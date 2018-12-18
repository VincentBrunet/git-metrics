
var _ = require("lodash");

var database = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: "./database/dev.sqlite3",
    },
});

function Query(tableName) {
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
    _.each(methods, function (method) {
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
        _.each(dict, function (value, key) {
            columns.push(key + " AS " + value);
        });
        return self.select(columns);
    };
    // Raw sql string
    self.toString = function (a) {
        return self._internal.toString(a);
    };
};

module.exports = function (tableName) {
    return new Query(tableName);
};