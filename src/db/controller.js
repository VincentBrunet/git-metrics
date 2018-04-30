
var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database(":memory:");

var core = require("../core");

$this = {};

$this.drop = function (tableName, next) {
    var sql = "DROP TABLE " + tableName;
    console.log("SQL", sql);
    db.run(sql, function (error) {
        if (error) {
            return next(false, null, error);
        }
        return next(true, this.changes);
    });
};

$this.table = function (tableName, tableFields, next) {
    var sql = "CREATE TABLE " + tableName;
    var fields = [];
    core.for(tableFields, function (key, value) {
        fields.push(key + " " + value);
    });
    sql += "(" + fields.join(", ") + ")";
    console.log("SQL", sql);
    db.run(sql, function (error) {
        if (error) {
            return next(false, null, error);
        }
        return next(true, this.changes);
    });
};

$this.insert = function (tableName, tableFields, tableData, next) {
    var sql = "INSERT INTO " + tableName;
    sql += "(" + tableFields.join(", ") + ")";
    var tableFieldPlaceholders = [];
    core.repeat(tableFields.length, function (name, def) {
        tableFieldPlaceholders.push("?");
    });
    var tableDataPlaceholders = [];
    core.repeat(tableData.length / tableFields.length, function (idx, value) {
        tableDataPlaceholders.push("(" + tableFieldPlaceholders.join(", ") + ")");
    });
    sql += " VALUES " + tableDataPlaceholders.join(", ");
    console.log("SQL", sql);
    db.run(sql, tableData, function (error) {
        if (error) {
            return next(false, null, error);
        }
        return next(true, this.changes);
    });
};

$this.select = function (tableName, select, next) {
    var sql = "SELECT " + select;
    console.log("SQL", sql);
    db.all(sql, [], function (error, rows) {
        if (error) {
            return next(false, null, error);
        }
        return next(true, rows);
    });
};

module.exports = $this;
