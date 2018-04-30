// Nice migration syntaxis sugars (optional but very usefull)
var $sugar = require("../sugars");

// Apply migration
exports.up = $sugar.migration(function ($mg, knex) {
    $mg.createTable("git_author", function (table) {
        $mg.addColumn(table, "name", "string");
        $mg.addUnique(table, "name");
    });
    $mg.createTable("git_repo", function (table) {
        $mg.addColumn(table, "url", "string");
        $mg.addUnique(table, "url");
    });
    $mg.createTable("git_commit", function (table) {
        $mg.addColumn(table, "git_repo_id", "integer");
        $mg.addForeignLink(table, "git_repo_id", "git_repo.id");
        $mg.addColumn(table, "git_author_id", "integer");
        $mg.addForeignLink(table, "git_author_id", "git_author.id");
        $mg.addColumn(table, "hash", "string");
        $mg.addUnique(table, "hash");
        $mg.addColumn(table, "comment", "string");
        $mg.addColumn(table, "time", "timestamp");
    });
    $mg.createTable("git_file", function (table) {
        $mg.addColumn(table, "git_repo_id", "integer");
        $mg.addForeignLink(table, "git_repo_id", "git_repo.id");
        $mg.addColumn(table, "add_git_commit_id", "integer");
        $mg.addForeignLink(table, "add_git_commit_id", "git_commit.id");
        $mg.addColumn(table, "del_git_commit_id", "integer", undefined, true);
        $mg.addForeignLink(table, "del_git_commit_id", "git_commit.id");
        $mg.addColumn(table, "add_time", "timestamp");
        $mg.addColumn(table, "del_time", "timestamp", undefined, true);
    });
    $mg.createTable("git_path", function (table) {
        $mg.addColumn(table, "git_file_id", "integer");
        $mg.addForeignLink(table, "git_file_id", "git_file.id");
        $mg.addColumn(table, "add_git_commit_id", "integer");
        $mg.addForeignLink(table, "add_git_commit_id", "git_commit.id");
        $mg.addColumn(table, "del_git_commit_id", "integer", undefined, true);
        $mg.addForeignLink(table, "del_git_commit_id", "git_commit.id");
        $mg.addColumn(table, "path", "string");
        $mg.addColumn(table, "add_time", "timestamp");
        $mg.addColumn(table, "del_time", "timestamp", undefined, true);
    });
    $mg.createTable("git_change", function (table) {
        $mg.addColumn(table, "git_commit_id", "integer");
        $mg.addForeignLink(table, "git_commit_id", "git_commit.id");
        $mg.addColumn(table, "git_path_id", "integer");
        $mg.addForeignLink(table, "git_path_id", "git_path.id");
        $mg.addColumn(table, "additions", "integer");
        $mg.addColumn(table, "deletions", "integer");
        $mg.addColumn(table, "changes", "integer");
    });
});

// Rollback migrations
exports.down = $sugar.migration(function ($mg) {
  $mg.dropTable("git_author");
  $mg.dropTable("git_repo");
  $mg.dropTable("git_commit");
  $mg.dropTable("git_file");
  $mg.dropTable("git_path");
  $mg.dropTable("git_change");
});
