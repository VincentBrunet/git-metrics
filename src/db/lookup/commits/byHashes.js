
var bb = require("../../../bb");

module.exports = async function (repositoryId, commitsHashes) {
    // Batch commit reading
    var batch = bb.database.batch("git_commit", commitsHashes, function (query, chunk) {
        query.where("git_repo_id", repositoryId);
        query.whereIn("hash", chunk);
        query.select(["id", "hash", "time"]);
    });
    // Batch queries and combine all results
    var commits = await bb.database.combined(batch);
    // Done
    return commits;
};
