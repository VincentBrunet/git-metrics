var colors = require("colors/safe");

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
    // Helper
    self.debug = function () {
        var keywords = [
            // Strong keywords
            ["SELECT", { return: true, indent: true, newline: true, color: "cyan", }],
            ["select", { return: true, indent: true, newline: true, color: "cyan", }],
            ["WHERE", { return: true, indent: true, newline: true, color: "cyan", }],
            ["where", { return: true, indent: true, newline: true, color: "cyan", }],
            ["GROUP BY", { return: true, indent: true, newline: true, color: "cyan", }],
            ["group by", { return: true, indent: true, newline: true, color: "cyan", }],
            ["ORDER BY", { return: true, indent: true, newline: true, color: "cyan", }],
            ["order by", { return: true, indent: true, newline: true, color: "cyan", }],
            ["JOIN", { return: true, indent: true, newline: true, color: "cyan", }],
            ["join", { return: true, indent: true, newline: true, color: "cyan", }],
            // Block separation
            [",", { indent: true, newline: true, color: "red", }],
            // Weak keywords
            ["asc", { color: "green", }],
            ["desc", { color: "green", }],
            ["from", { color: "yellow", }],
            ["as", { color: "yellow", }],
            ["\"", { color: "cyan", }],
            ["(", { color: "magenta", }],
            [")", { color: "magenta", }],
            // Function names
            ["count", { color: "blue", }],
            ["extract", { color: "blue", }],
            ["count", { color: "blue", }],
            ["count", { color: "blue", }],
        ];
        var str = self.SQL();
        flowFor(keywords, function (idx, prop) {
            var keyword = prop[0];
            var options = prop[1];
            var splitter = "";
            if (options.return) {
                splitter += "\n";
            }
            if (options.color) {
                for (var i = 0; i < keyword.length; i++) {
                    splitter += colors[options.color](keyword.charAt(i));
                }
            }
            else {
                splitter += keyword;
            }
            if (options.newline) {
                splitter += "\n";
            }
            if (options.indent) {
                splitter += "\t";
            }
            str = str.split(keyword).join(splitter);
        });
        console.log("-----", str);
        console.log("-----");
    };
    // Raw sql string
    self.SQL = function () {
        return self._internal.toString();
    };
};

module.exports = function (tableName) {
    return new Query(tableName);
};