
var bb = require("../../../bb");

module.exports = async function (repositoryId, filesPaths) {
    // Batch file read
    var batch = bb.database.batch("git_file", filesPaths, function (query, chunk) {
        query.where("git_file.git_repository_id", repositoryId);
        query.whereIn("path", chunk);
        query.selectAs({
            "git_file.id": "id",
            "git_file.path": "path",
        });
    });
    // Run all batches query and merge results
    var files = await bb.database.combined(batch);
    // Done
    return files;
};
