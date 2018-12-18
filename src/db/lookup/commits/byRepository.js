
var bb = require("../../../bb");

module.exports = async function (repositoryId) {
    // Read all commits from repository
    var query = bb.database.query("git_commit");
    query.where("git_repo_id", repositoryId);
    query.select(["id", "hash", "time"]);
    // Execute
    var commits = await bb.database.execute(query);
    // Index commit by hash
    var commitsByHash = {};
    bb.flow.for(commits, function (idx, commit) {
        commitsByHash[commit.hash] = commit;
    });
    // Done
    return commitsByHash;
};
