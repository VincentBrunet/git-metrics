
var bb = require("../../../bb");

module.exports = async function (repositoryUrls) {
    // Batch fetch of existing repository infos
    var batch = bb.database.batch("git_repo", repositoryUrls, function (query, chunk) {
        query.whereIn("url", chunk);
        query.select(["id", "url"]);
    });
    // Execute
    var results = await bb.database.combined(batch);
    // There should only be one
    return results;
};
