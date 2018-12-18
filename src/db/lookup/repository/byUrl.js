
var bb = require("../../../bb");

module.exports = async function (repositoryUrl) {
    // Fetch existing repository infos
    var query = bb.database.query("git_repo");
    query.where("url", repositoryUrl);
    query.select(["id", "url"]);
    // Execute
    var results = await bb.database.execute(query);
    // There should only be one
    return results[0];
};