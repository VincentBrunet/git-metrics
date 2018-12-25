// Nice migration syntaxis sugars (optional but very usefull)
var $sugar = require("../sugars");

// Apply migration
exports.up = $sugar.migration(function ($mg, knex) {

    $mg.createTable("git_author", function (table) {
        // Author properties
        $mg.addColumn(table, "signature", "text");
        $mg.addColumn(table, "email", "text");
        $mg.addColumn(table, "name", "text");
        // No author with same signature
        $mg.addUnique(table, "signature");
    });

    $mg.createTable("git_repository", function (table) {
        // Repository properties
        $mg.addColumn(table, "url", "text");
        // No repo with same url
        $mg.addUnique(table, "url");
    });

    $mg.createTable("git_ref", function (table) {
        // Commit links
        $mg.addColumn(table, "git_repository_id", "integer");
        // Foreign keys
        $mg.addForeignLink(table, "git_repository_id", "git_repository.id");
        // Author properties
        $mg.addColumn(table, "value", "text");
        // No duplicate refs for each repo
        $mg.addUnique(table, ["git_repository_id", "value"]);
    });

    $mg.createTable("git_commit", function (table) {
        // Commit links
        $mg.addColumn(table, "git_repository_id", "integer");
        $mg.addColumn(table, "git_author_id", "integer");
        // Foreign keys
        $mg.addForeignLink(table, "git_repository_id", "git_repository.id");
        $mg.addForeignLink(table, "git_author_id", "git_author.id");
        // Commit stats
        $mg.addColumn(table, "refs", "integer");
        $mg.addColumn(table, "trees", "integer");
        $mg.addColumn(table, "changes", "integer");
        $mg.addColumn(table, "creations", "integer");
        $mg.addColumn(table, "deletions", "integer");
        $mg.addColumn(table, "renames", "integer");
        // Commit core
        $mg.addColumn(table, "source", "text");
        $mg.addColumn(table, "hash", "text");
        $mg.addColumn(table, "comment", "text");
        $mg.addColumn(table, "time", "timestamp");
        $mg.addColumn(table, "raw", "text");
        // No commit with same hash (and repo)
        $mg.addUnique(table, ["git_repository_id", "hash"]);
    });

    $mg.createTable("git_file", function (table) {
        // File relations
        $mg.addColumn(table, "git_repository_id", "integer");
        // Foreign keys
        $mg.addForeignLink(table, "git_repository_id", "git_repository.id");
        // File keys
        $mg.addColumn(table, "path", "text");
        // No connection with same commit and ref (and repo)
        $mg.addUnique(table, ["git_repository_id", "path"]);
    });

    $mg.createTable("git_contributor", function (table) {
        // Commit links
        $mg.addColumn(table, "git_repository_id", "integer");
        $mg.addColumn(table, "git_author_id", "integer");
        // Foreign keys
        $mg.addForeignLink(table, "git_repository_id", "git_repository.id");
        $mg.addForeignLink(table, "git_author_id", "git_author.id");
        // No duplicate contributor for each repo
        $mg.addUnique(table, ["git_repository_id", "git_author_id"]);
    });

    $mg.createTable("git_tree", function (table) {
        // Tree relations
        $mg.addColumn(table, "git_repository_id", "integer");
        $mg.addColumn(table, "git_commit_id_parent", "integer");
        $mg.addColumn(table, "git_commit_id_child", "integer");
        // Foreign keys
        $mg.addForeignLink(table, "git_repository_id", "git_repository.id");
        $mg.addForeignLink(table, "git_commit_id_parent", "git_commit.id");
        $mg.addForeignLink(table, "git_commit_id_child", "git_commit.id");
        // No tree with same commit and parent (and repo)
        $mg.addUnique(table, ["git_repository_id", "git_commit_id_child", "git_commit_id_parent"]);
    });

    $mg.createTable("git_link", function (table) {
        // Tree relations
        $mg.addColumn(table, "git_repository_id", "integer");
        $mg.addColumn(table, "git_commit_id", "integer");
        $mg.addColumn(table, "git_ref_id", "integer");
        // Foreign keys
        $mg.addForeignLink(table, "git_repository_id", "git_repository.id");
        $mg.addForeignLink(table, "git_commit_id", "git_commit.id");
        $mg.addForeignLink(table, "git_ref_id", "git_ref.id");
        // No link with same commit and ref (and repo)
        $mg.addUnique(table, ["git_repository_id", "git_commit_id", "git_ref_id"]);
    });

    $mg.createTable("git_creation", function (table) {
        // Creations links
        $mg.addColumn(table, "git_repository_id", "integer");
        $mg.addColumn(table, "git_commit_id", "integer");
        $mg.addColumn(table, "git_file_id", "integer");
        // Foreign keys
        $mg.addForeignLink(table, "git_repository_id", "git_repository.id");
        $mg.addForeignLink(table, "git_commit_id", "git_commit.id");
        $mg.addForeignLink(table, "git_file_id", "git_file.id");
        // No creation with same commit and file (and repo)
        $mg.addUnique(table, ["git_repository_id", "git_commit_id", "git_file_id"]);
    });

    $mg.createTable("git_deletion", function (table) {
        // Deletions links
        $mg.addColumn(table, "git_repository_id", "integer");
        $mg.addColumn(table, "git_commit_id", "integer");
        $mg.addColumn(table, "git_file_id", "integer");
        // Foreign keys
        $mg.addForeignLink(table, "git_repository_id", "git_repository.id");
        $mg.addForeignLink(table, "git_commit_id", "git_commit.id");
        $mg.addForeignLink(table, "git_file_id", "git_file.id");
        // No deletions with same commit and file (and repo)
        $mg.addUnique(table, ["git_repository_id", "git_commit_id", "git_file_id"]);
    });

    $mg.createTable("git_rename", function (table) {
        // Rename links
        $mg.addColumn(table, "git_repository_id", "integer");
        $mg.addColumn(table, "git_commit_id", "integer");
        $mg.addColumn(table, "git_file_id_before", "integer");
        $mg.addColumn(table, "git_file_id_after", "integer");
        // Foreign keys
        $mg.addForeignLink(table, "git_repository_id", "git_repository.id");
        $mg.addForeignLink(table, "git_commit_id", "git_commit.id");
        $mg.addForeignLink(table, "git_file_id_before", "git_file.id");
        $mg.addForeignLink(table, "git_file_id_after", "git_file.id");
        // No rename with same commit and file (and repo)
        $mg.addUnique(table, ["git_repository_id", "git_commit_id", "git_file_id_before", "git_file_id_after"]);
    });

    $mg.createTable("git_change", function (table) {
        // Change links
        $mg.addColumn(table, "git_repository_id", "integer");
        $mg.addColumn(table, "git_commit_id", "integer");
        $mg.addColumn(table, "git_file_id", "integer");
        // Foreign keys
        $mg.addForeignLink(table, "git_repository_id", "git_repository.id");
        $mg.addForeignLink(table, "git_commit_id", "git_commit.id");
        $mg.addForeignLink(table, "git_file_id", "git_file.id");
        // Change properties
        $mg.addColumn(table, "insert", "integer");
        $mg.addColumn(table, "remove", "integer");
        $mg.addColumn(table, "total", "integer");
        $mg.addColumn(table, "binary", "integer");
        // No change with same commit and file (and repo)
        $mg.addUnique(table, ["git_repository_id", "git_commit_id", "git_file_id"]);
    });

});

// Rollback migrations
exports.down = $sugar.migration(function ($mg) {
    $mg.dropTable("git_change");
    $mg.dropTable("git_rename");
    $mg.dropTable("git_creation");
    $mg.dropTable("git_deletion");
    $mg.dropTable("git_link");
    $mg.dropTable("git_tree");
    $mg.dropTable("git_commit");
    $mg.dropTable("git_file");
    $mg.dropTable("git_ref");
    $mg.dropTable("git_contributor");
    $mg.dropTable("git_repo");
    $mg.dropTable("git_author");
});
