// Nice migration syntaxis sugars (optional but very usefull)
var $sugar = require("../sugars");

// Apply migration
exports.up = $sugar.migration(function ($mg, knex) {

    $mg.addIndex("git_author", "id");
    $mg.addIndex("git_author", "name");

    $mg.addIndex("git_repo", "id");
    $mg.addIndex("git_repo", "url");

    $mg.addIndex("git_commit", "id");
    $mg.addIndex("git_commit", "git_repo_id");
    $mg.addIndex("git_commit", "git_author_id");
    $mg.addIndex("git_commit", "hash");
    $mg.addIndex("git_commit", "time");

    $mg.addIndex("git_tree", "git_repo_id");
    $mg.addIndex("git_tree", "git_commit_id");
    $mg.addIndex("git_tree", "parent_git_commit_id");

    $mg.addIndex("git_file", "id");
    $mg.addIndex("git_file", "git_repo_id");
    $mg.addIndex("git_file", "add_git_commit_id");
    $mg.addIndex("git_file", "del_git_commit_id");
    $mg.addIndex("git_file", "path");

    $mg.addIndex("git_rename", "git_repo_id");
    $mg.addIndex("git_rename", "git_commit_id");
    $mg.addIndex("git_rename", "before_git_file_id");
    $mg.addIndex("git_rename", "after_git_file_id");

    $mg.addIndex("git_change", "git_repo_id");
    $mg.addIndex("git_change", "git_commit_id");
    $mg.addIndex("git_change", "git_file_id");

});

// Rollback migrations
exports.down = $sugar.migration(function ($mg) {

    $mg.dropIndex("git_author", "id");
    $mg.dropIndex("git_author", "name");

    $mg.dropIndex("git_repo", "id");
    $mg.dropIndex("git_repo", "url");

    $mg.dropIndex("git_commit", "id");
    $mg.dropIndex("git_commit", "git_repo_id");
    $mg.dropIndex("git_commit", "git_author_id");
    $mg.dropIndex("git_commit", "hash");
    $mg.dropIndex("git_commit", "time");

    $mg.dropIndex("git_tree", "git_repo_id");
    $mg.dropIndex("git_tree", "git_commit_id");
    $mg.dropIndex("git_tree", "parent_git_commit_id");

    $mg.dropIndex("git_file", "id");
    $mg.dropIndex("git_file", "git_repo_id");
    $mg.dropIndex("git_file", "add_git_commit_id");
    $mg.dropIndex("git_file", "del_git_commit_id");
    $mg.dropIndex("git_file", "path");

    $mg.dropIndex("git_rename", "git_repo_id");
    $mg.dropIndex("git_rename", "git_commit_id");
    $mg.dropIndex("git_rename", "before_git_file_id");
    $mg.dropIndex("git_rename", "after_git_file_id");

    $mg.dropIndex("git_change", "git_repo_id");
    $mg.dropIndex("git_change", "git_commit_id");
    $mg.dropIndex("git_change", "git_file_id");

});
