// Nice migration syntaxis sugars (optional but very usefull)
var $sugar = require("./sugars");

// Apply migration
exports.up = $sugar.migration(function ($mg, knex) {

    $mg.addIndex("ui_member", "ui_group_id");
    $mg.addIndex("ui_member", "git_author_id");

});

// Rollback migrations
exports.down = $sugar.migration(function ($mg) {

    $mg.dropIndex("ui_member", "ui_group_id");
    $mg.dropIndex("ui_member", "git_author_id");

});
