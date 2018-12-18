
var bb = require("../../bb");

var $this = {};

$this.changesByAuthors = function (repositoryId, authorsIds, next) {
    var batch = bb.database.batch("git_change", authorsIds, function (authorsIdsChunk) {
        query.whereIn("git_change.git_author_id", authorsIdsChunk);
        query.where("git_change.git_repo_id", repositoryId);
        query.leftJoin("git_file", "git_change.git_file_id", "git_file.id");
        query.leftJoin("git_commit", "git_change.git_commit_id", "git_commit.id");
        query.selectAs({
            "git_change.git_author_id": "git_author_id",
            "git_commit.time": "time",
            "git_file.path": "path",
            "git_change.additions": "additions",
            "git_change.deletions": "deletions",
            "git_change.changes": "changes",
            "git_change.binary": "binary",
        });
        var explained = await bb.database.explain(query);
        console.log("Explaining query changes by Authors", authorsIdsChunk.length, explained);
    });
    bb.database.combined(batch, function (success, changes, error) {
        console.log("Changes count", changes.length);
        if (!success) {
            return next(false, undefined, new Error("Could not resolve repository contributors changes"));
        }
        var changesByAuthors = {};
        bb.flow.for(changes, function (idx, change) {
            var changesList = changesByAuthors[change.git_author_id] || [];
            changesList.push(change);
            changesByAuthors[change.git_author_id] = changesList;
        });
        return next(true, changesByAuthors);
    });
};

module.exports = $this;
