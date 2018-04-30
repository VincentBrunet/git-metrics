// Nice migration syntaxis sugars (optional but very usefull)
var $sugar = require("../sugars");

// Apply migration
exports.up = $sugar.migration(function ($mg, knex) {

    $mg.addIndex("git_author", "name");

    $mg.addIndex("git_repo", "url");

    $mg.addIndex("git_commit", "git_repo_id");
    $mg.addIndex("git_commit", "git_author_id");
    $mg.addIndex("git_commit", "hash");
    $mg.addIndex("git_commit", "time");

    $mg.addIndex("git_file", "git_repo_id");
    $mg.addIndex("git_file", "add_git_commit_id");
    $mg.addIndex("git_file", "del_git_commit_id");
    $mg.addIndex("git_file", "add_time");
    $mg.addIndex("git_file", "del_time");

    $mg.addIndex("git_path", "git_file_id");
    $mg.addIndex("git_path", "add_git_commit_id");
    $mg.addIndex("git_path", "del_git_commit_id");
    $mg.addIndex("git_path", "add_time");
    $mg.addIndex("git_path", "del_time");

    $mg.addIndex("git_change", "git_commit_id");
    $mg.addIndex("git_change", "git_path_id");

});

// Rollback migrations
exports.down = $sugar.migration(function ($mg) {

    $mg.dropIndex("git_author", "name");

    $mg.dropIndex("git_repo", "url");

    $mg.dropIndex("git_commit", "git_repo_id");
    $mg.dropIndex("git_commit", "git_author_id");
    $mg.dropIndex("git_commit", "hash");
    $mg.dropIndex("git_commit", "time");

    $mg.dropIndex("git_file", "git_repo_id");
    $mg.dropIndex("git_file", "add_git_commit_id");
    $mg.dropIndex("git_file", "del_git_commit_id");
    $mg.dropIndex("git_file", "add_time");
    $mg.dropIndex("git_file", "del_time");

    $mg.dropIndex("git_path", "git_file_id");
    $mg.dropIndex("git_path", "add_git_commit_id");
    $mg.dropIndex("git_path", "del_git_commit_id");
    $mg.dropIndex("git_path", "add_time");
    $mg.dropIndex("git_path", "del_time");

    $mg.dropIndex("git_change", "git_commit_id");
    $mg.dropIndex("git_change", "git_path_id");

});
