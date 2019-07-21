// Nice migration syntaxis sugars (optional but very usefull)
var $sugar = require("./sugars");

// Apply migration
exports.up = $sugar.migration(function ($mg, knex) {

    $mg.createTable("ui_group", function (table) {
        $mg.addColumn(table, "name", "text");
    });

    $mg.createTable("ui_member", function (table) {
        // Member links
        $mg.addColumn(table, "ui_group_id", "integer");
        $mg.addColumn(table, "git_author_id", "integer");
        // Foreign keys
        $mg.addForeignLink(table, "ui_group_id", "ui_group.id");
        $mg.addForeignLink(table, "git_author_id", "git_author.id");
        // No duplicate members for each group
        $mg.addUnique(table, ["ui_group_id", "git_author_id"]);
    });

});

// Rollback migrations
exports.down = $sugar.migration(function ($mg) {
    $mg.dropTable("ui_group");
    $mg.dropTable("ui_member");
});
