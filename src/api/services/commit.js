
var bb = require("../../bb");

var $this = {};

$this.commitsByAuthors = function (repositoryId, authorsIds, next) {
    var batch = bb.database.batch("git_commit", authorsIds, function (query, authorsIdsChunk) {
        query.leftJoin("git_author", "git_commit.git_author_id", "git_author.id");
        query.where("git_commit.git_repo_id", repositoryId);
        query.whereIn("git_commit.git_author_id", authorsIdsChunk);
        query.selectAs({
            "git_author.id": "git_author_id",
            "git_commit.id": "id",
            "git_commit.hash": "hash",
            "git_commit.time": "time",
        });
    });
    var commits = await bb.database.combined(batch);
    var commitsByAuthors = {};
    bb.flow.for(commits, function (idx, commit) {
        var commitsList = commitsByAuthors[commit.git_author_id] || [];
        commitsList.push(commit);
        commitsByAuthors[commit.git_author_id] = commitsList;
    });
    return commitsByAuthors;
};

module.exports = $this;
