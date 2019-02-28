var bb = require("../../../bb");

var services = require("../../services");

module.exports = async function (request) {

    console.log("Args", request);

    var git_repository_ids = request.args.git_repository_ids;
    var git_author_ids = request.args.git_author_ids;

    // Query selection
    var query = bb.database.query("git_commit");
    query.select();

    // Count unique commits
    query.count("id");

    // Optional repository filters
    if (git_repository_ids) {
        query.whereIn("git_repository_id", git_repository_ids);
    }
    // Optional authors filters
    if (git_author_ids) {
        query.whereIn("git_author_id", git_author_ids);
    }

    // Optional time chunking
    services.timeseries.timechunks(
        query,
        "time",
        request.args.timezone,
        request.args.timechunks
    );

    // Print
    query.debug();

    // Exec
    var results = await bb.database.execute(query);
    return results;
};
