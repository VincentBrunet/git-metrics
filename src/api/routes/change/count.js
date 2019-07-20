var bb = require("../../../bb");

var services = require("../../services");

module.exports = async function (request) {
    // Query selection
    var query = bb.database.query("git_change");
    query.leftJoin("git_commit", "git_commit.id", "git_change.git_commit_id");
    query.leftJoin("git_file", "git_file.id", "git_change.git_file_id");
    // Reading
    query.select();
    // Count unique commits
    query.count("git_change.id as value");
    // Optional repository filters
    services.data.filters.ids(
        query,
        "git_commit.git_repository_id",
        request.args.git_repository_ids,
        request.args.git_repository_id
    );
    // Optional authors filters
    services.data.filters.ids(
        query,
        "git_commit.git_author_id",
        request.args.git_author_ids,
        request.args.git_author_id
    );
    // Optional file path pattern filter
    services.data.filters.pattern(
        query,
        "git_file.path",
        request.args.git_file_paths
    );
    // Optional time limits
    services.data.timeseries.timelimits(
        query,
        "git_commit.time",
        request.args.timezone,
        request.args.timelimits
    );
    // Optional time framing
    services.data.timeseries.timeframe(
        query,
        "git_commit.time",
        request.args.timezone,
        request.args.timeframe
    );
    // Optional time chunking
    services.data.timeseries.timechunks(
        query,
        "git_commit.time",
        request.args.timezone,
        request.args.timechunks
    );
    // Print
    query.debug();
    // Exec
    var results = await bb.database.execute(query);
    return results;
};
