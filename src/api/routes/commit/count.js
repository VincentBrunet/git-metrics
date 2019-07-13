var bb = require("../../../bb");

var services = require("../../services");

module.exports = async function (request) {
    // Query selection
    var query = bb.database.query("git_commit");
    // Reading
    query.select();
    // Count unique commits
    query.count("id");
    // Optional repository filters
    query.whereIn("git_repository_id", request.args.git_repository_ids);
    // Optional authors filters
    if (request.args.git_author_ids) {
        query.whereNotIn("git_author_id", request.args.git_author_ids);
    }
    // Optional time chunking
    services.data.timeseries.timechunks(
        query,
        "time",
        request.args.timezone,
        request.args.timechunks
    );
    // Exec
    var results = await bb.database.execute(query);
    return results;
};
