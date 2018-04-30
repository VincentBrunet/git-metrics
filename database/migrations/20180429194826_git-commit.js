// Nice migration syntaxis sugars (optional but very usefull)
var $sugar = require("../sugars");

// Apply migration
exports.up = $sugar.migration(function ($mg, knex) {
    $mg.createTable("git_commit", function (table) {
        $mg.addColumn(table, "hash", "string");
        $mg.addUnique(table, "hash");
        $mg.addColumn(table, "comment", "string");
        $mg.addColumn(table, "date", "timestamp");
    });
});

// Rollback migrations
exports.down = $sugar.migration(function ($mg) {
  $mg.dropTable("git_commit");
});
