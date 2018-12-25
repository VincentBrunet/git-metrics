
var bb = require("../../../bb");

module.exports = async function (repositoryUrls) {
    // Batch fetch of existing repository infos
    var batch = bb.database.batch("git_repository", repositoryUrls, function (query, chunk) {
        query.whereIn("url", chunk);
        query.select(["id", "url"]);
    });
    // Execute
    var repositories = await bb.database.combined(batch);
    // Done
    return repositories;
};
