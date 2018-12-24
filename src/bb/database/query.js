
var objectFunctions = require("../object/functions");

var flowFor = require("../flow/for");

var thisNative = require("./_native");

function Query(tableName) {
    // Locally accessible object
    var self = this;
    // Use the specified object
    self._internal = thisNative;
    // If the user specified a table name to query
    if (tableName !== undefined) {
        self._internal = self._internal(tableName);
    }
    // Copy the knex functionalities
    var methods = objectFunctions(thisNative);
    flowFor(methods, function (idx, method) {
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
        flowFor(dict, function (key, value) {
            columns.push(key + " AS " + value);
        });
        return self.select(columns);
    };
    // Raw sql string
    self.SQL = function () {
        return self._internal.toString();
    };
};

module.exports = function (tableName) {
    return new Query(tableName);
};