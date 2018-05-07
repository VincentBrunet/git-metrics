
var core = require("../../core");

var dbController = require("../../db/controller");

var $this = {};

$this.commitsByAuthors = function (repositoryId, authorsIds, next) {
    var batch = dbController.batch(authorsIds, function (authorsIdsChunk) {
        var query = dbController.query("git_commit");
        query.leftJoin("git_author", "git_commit.git_author_id", "git_author.id");
        query.where("git_commit.git_repo_id", repositoryId);
        query.whereIn("git_commit.git_author_id", authorsIdsChunk);
        query.selectAs({
            "git_author.id": "git_author_id",
            "git_commit.id": "id",
            "git_commit.hash": "hash",
            "git_commit.time": "time",
        });
        return query;
    });
    dbController.combined(batch, function (success, commits, error) {
        if (!success) {
            return next(false, undefined, new Error("Could not resolve repository contributors commits"));
        }
        var commitsByAuthors = {};
        core.for(commits, function (idx, commit) {
            var commitsList = commitsByAuthors[commit.git_author_id] || [];
            commitsList.push(commit);
            commitsByAuthors[commit.git_author_id] = commitsList;
        });
        return next(true, commitsByAuthors);
    });
};

module.exports = $this;
