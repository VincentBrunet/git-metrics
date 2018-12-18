
var bb = require("../../../bb");

module.exports = async function (repositoryId, commitsHashes) {
    // Batch commit reading
    var batch = bb.database.batch("git_commit", commitsHashes, function (query, chunk) {
        query.where("git_repo_id", repositoryId);
        query.whereIn("hash", chunk);
        query.select(["id", "hash", "time"]);
    });
    // Batch queries and combine all results
    var commits = await bb.database.execute(batch);
    // Index commit by hash
    var commitsByHash = {};
    bb.flow.for(commits, function (idx, commit) {
        commitsByHash[commit.hash] = commit;
    });
    // Done
    return commitsByHash;
};
