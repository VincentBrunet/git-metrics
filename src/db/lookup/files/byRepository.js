
var bb = require("../../../bb");

module.exports = async function (repositoryId) {
    // Batch file read
    var query = bb.database.query("git_file");
    query.where("git_file.git_repository_id", repositoryId);
    query.selectAs({
        "git_file.id": "id",
        "git_file.path": "path",
    });
    // Run all batches query and merge results
    var files = await bb.database.execute(query);
    // Done
    return files;
};
