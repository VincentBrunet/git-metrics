// Nice migration syntaxis sugars (optional but very usefull)
var $sugar = require("../sugars");

// Apply migration
exports.up = $sugar.migration(function ($mg, knex) {
    $mg.createTable("git_author", function (table) {
        $mg.addColumn(table, "name", "string");
        // No author with same name
        $mg.addUnique(table, "name");
    });
    $mg.createTable("git_repo", function (table) {
        $mg.addColumn(table, "url", "string");
        // No repo with same url
        $mg.addUnique(table, "url");
    });
    $mg.createTable("git_commit", function (table) {
        $mg.addColumn(table, "git_repo_id", "integer");
        $mg.addForeignLink(table, "git_repo_id", "git_repo.id");
        $mg.addColumn(table, "git_author_id", "integer");
        $mg.addForeignLink(table, "git_author_id", "git_author.id");
        $mg.addColumn(table, "hash", "string");
        $mg.addColumn(table, "comment", "string");
        $mg.addColumn(table, "time", "timestamp");
        // No commit with same hash
        $mg.addUnique(table, "hash");
    });
    $mg.createTable("git_file", function (table) {
        $mg.addColumn(table, "git_repo_id", "integer");
        $mg.addForeignLink(table, "git_repo_id", "git_repo.id");
        $mg.addColumn(table, "add_git_commit_id", "integer");
        $mg.addForeignLink(table, "add_git_commit_id", "git_commit.id");
        $mg.addColumn(table, "del_git_commit_id", "integer", undefined, true);
        $mg.addForeignLink(table, "del_git_commit_id", "git_commit.id");
        $mg.addColumn(table, "path", "string");
        // No file with same commit and path
        $mg.addUnique(table, ["add_git_commit_id", "path"]);
    });
    $mg.createTable("git_rename", function (table) {
        $mg.addColumn(table, "git_commit_id", "integer");
        $mg.addForeignLink(table, "git_commit_id", "git_commit.id");
        $mg.addColumn(table, "before_git_file_id", "integer");
        $mg.addForeignLink(table, "before_git_file_id", "git_file.id");
        $mg.addColumn(table, "after_git_file_id", "integer");
        $mg.addForeignLink(table, "after_git_file_id", "git_file.id");
        // No rename with same commit and file
        $mg.addUnique(table, ["git_commit_id", "before_git_file_id"]);
    });
    $mg.createTable("git_change", function (table) {
        $mg.addColumn(table, "git_commit_id", "integer");
        $mg.addForeignLink(table, "git_commit_id", "git_commit.id");
        $mg.addColumn(table, "git_file_id", "integer");
        $mg.addForeignLink(table, "git_file_id", "git_file.id");
        $mg.addColumn(table, "additions", "integer");
        $mg.addColumn(table, "deletions", "integer");
        $mg.addColumn(table, "changes", "integer");
        // No change with same commit and file
        $mg.addUnique(table, ["git_commit_id", "git_file_id"]);
    });
});

// Rollback migrations
exports.down = $sugar.migration(function ($mg) {
  $mg.dropTable("git_author");
  $mg.dropTable("git_repo");
  $mg.dropTable("git_commit");
  $mg.dropTable("git_file");
  $mg.dropTable("git_rename");
  $mg.dropTable("git_change");
});
