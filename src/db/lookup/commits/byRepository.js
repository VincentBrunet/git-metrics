
var bb = require("../../../bb");

module.exports = async function (repositoryId) {
    // Read all commits from repository
    var query = bb.database.query("git_commit");
    query.where("git_repository_id", repositoryId);
    query.select(["id", "hash", "time"]);
    // Execute
    var commits = await bb.database.execute(query);
    // Done
    return commits;
};
