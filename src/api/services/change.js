
var core = require("../../core");

var dbController = require("../../db/controller");

var $this = {};

$this.changesByAuthors = function (repositoryId, authorsIds, next) {
    var batch = dbController.batch(authorsIds, function (authorsIdsChunk) {
        var query = dbController.query("git_change");
        query.where("git_change.git_repo_id", repositoryId);
        query.whereIn("git_change.git_author_id", authorsIdsChunk);
        query.leftJoin("git_file", "git_change.git_file_id", "git_file.id");
        query.selectAs({
            "git_change.git_author_id": "git_author_id",
            "git_file.path": "path",
            "git_change.additions": "additions",
            "git_change.deletions": "deletions",
            "git_change.changes": "changes",
            "git_change.binary": "binary",
        });
        dbController.explain(query, function (success, results, error) {
            console.log("Explaining query changes by Authors", success, results, error);
        });
        return query;
    });
    dbController.combined(batch, function (success, changes, error) {
        if (!success) {
            return next(false, undefined, new Error("Could not resolve repository contributors changes"));
        }
        var changesByAuthors = {};
        core.for(changes, function (idx, change) {
            var changesList = changesByAuthors[change.git_author_id] || [];
            changesList.push(change);
            changesByAuthors[change.git_author_id] = changesList;
        });
        return next(true, changesByAuthors);
    });
};

module.exports = $this;
