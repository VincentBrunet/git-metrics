
var bb = require("../../../bb");

module.exports = async function (repositoryId) {
    // Read all commits from repository
    var query = bb.database.query("git_ref");
    query.where("git_ref.git_repo_id", repositoryId);
    query.select(["id", "value"]);
    // Execute
    var refs = await bb.database.execute(query);
    // Done
    return refs;
};
