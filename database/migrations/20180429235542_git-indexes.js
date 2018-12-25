// Nice migration syntaxis sugars (optional but very usefull)
var $sugar = require("../sugars");

// Apply migration
exports.up = $sugar.migration(function ($mg, knex) {

    $mg.addIndex("git_author", "name");
    $mg.addIndex("git_author", "email");

    $mg.addIndex("git_repository", "url");

    $mg.addIndex("git_ref", "git_repository_id");
    $mg.addIndex("git_ref", "value");

    $mg.addIndex("git_file", "git_repository_id");
    $mg.addIndex("git_file", "path");

    $mg.addIndex("git_commit", "git_repository_id");
    $mg.addIndex("git_commit", "git_author_id");
    $mg.addIndex("git_commit", "hash");
    $mg.addIndex("git_commit", "time");

    $mg.addIndex("git_contributor", "git_repository_id");
    $mg.addIndex("git_contributor", "git_author_id");

    $mg.addIndex("git_tree", "git_repository_id");
    $mg.addIndex("git_tree", "git_commit_id_parent");
    $mg.addIndex("git_tree", "git_commit_id_child");

    $mg.addIndex("git_link", "git_repository_id");
    $mg.addIndex("git_link", "git_commit_id");
    $mg.addIndex("git_link", "git_ref_id");

    $mg.addIndex("git_creation", "git_repository_id");
    $mg.addIndex("git_creation", "git_commit_id");
    $mg.addIndex("git_creation", "git_file_id");

    $mg.addIndex("git_deletion", "git_repository_id");
    $mg.addIndex("git_deletion", "git_commit_id");
    $mg.addIndex("git_deletion", "git_file_id");

    $mg.addIndex("git_rename", "git_repository_id");
    $mg.addIndex("git_rename", "git_commit_id");
    $mg.addIndex("git_rename", "git_file_id_before");
    $mg.addIndex("git_rename", "git_file_id_after");

    $mg.addIndex("git_change", "git_repository_id");
    $mg.addIndex("git_change", "git_commit_id");
    $mg.addIndex("git_change", "git_file_id");

});

// Rollback migrations
exports.down = $sugar.migration(function ($mg) {

    $mg.dropIndex("git_author", "name");
    $mg.dropIndex("git_author", "email");

    $mg.dropIndex("git_repository", "url");

    $mg.dropIndex("git_ref", "git_repository_id");
    $mg.dropIndex("git_ref", "value");

    $mg.dropIndex("git_file", "git_repository_id");
    $mg.dropIndex("git_file", "path");

    $mg.dropIndex("git_commit", "git_repository_id");
    $mg.dropIndex("git_commit", "git_author_id");
    $mg.dropIndex("git_commit", "hash");
    $mg.dropIndex("git_commit", "time");

    $mg.dropIndex("git_contributor", "git_repository_id");
    $mg.dropIndex("git_contributor", "git_author_id");

    $mg.dropIndex("git_tree", "git_repository_id");
    $mg.dropIndex("git_tree", "git_commit_id_parent");
    $mg.dropIndex("git_tree", "git_commit_id_child");

    $mg.dropIndex("git_link", "git_repository_id");
    $mg.dropIndex("git_link", "git_commit_id");
    $mg.dropIndex("git_link", "git_ref_id");

    $mg.dropIndex("git_creation", "git_repository_id");
    $mg.dropIndex("git_creation", "git_commit_id");
    $mg.dropIndex("git_creation", "git_file_id");

    $mg.dropIndex("git_deletion", "git_repository_id");
    $mg.dropIndex("git_deletion", "git_commit_id");
    $mg.dropIndex("git_deletion", "git_file_id");

    $mg.dropIndex("git_rename", "git_repository_id");
    $mg.dropIndex("git_rename", "git_commit_id");
    $mg.dropIndex("git_rename", "git_file_id_before");
    $mg.dropIndex("git_rename", "git_file_id_after");

    $mg.dropIndex("git_change", "git_repository_id");
    $mg.dropIndex("git_change", "git_commit_id");
    $mg.dropIndex("git_change", "git_file_id");

});
