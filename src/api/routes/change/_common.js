var bb = require("../../../bb");

var services = require("../../services");

module.exports = async function (request, query) {

    // Join the necessary stuff
    query.leftJoin("git_commit", "git_commit.id", "git_change.git_commit_id");
    query.leftJoin("git_file", "git_file.id", "git_change.git_file_id");
    query.leftJoin("ui_member", "git_commit.git_author_id", "ui_member.git_author_id");
    query.leftJoin("ui_group", "ui_member.ui_group_id", "ui_group.id");

    // Optional repository filters
    services.data.filters.column(
        query,
        "git_commit.git_repository_id",
        request.args.git_repository_ids,
        request.args.git_repository_id
    );
    // Optional group filters
    services.data.filters.column(
        query,
        "ui_member.ui_group_id",
        request.args.ui_group_ids,
        request.args.ui_group_id
    );
    // Optional authors filters
    services.data.filters.column(
        query,
        "git_commit.git_author_id",
        request.args.git_author_ids,
        request.args.git_author_id
    );
    // Optional binary filters
    services.data.filters.column(
        query,
        "git_change.binary",
        undefined,
        request.args.binary
    );

    // Optional file path pattern filter
    services.data.filters.pattern(
        query,
        "git_file.path",
        request.args.git_file_path
    );

    // Optional group grouping
    services.data.groups.column(
        query,
        "ui_group.name",
        "ui_group_name",
        request.args.groups
    );
    // Optional group grouping
    services.data.groups.column(
        query,
        "ui_member.ui_group_id",
        "ui_group_id",
        request.args.groups
    );
    // Optional author grouping
    services.data.groups.column(
        query,
        "git_commit.git_author_id",
        "git_author",
        request.args.groups
    );
    // Optional binary grouping
    services.data.groups.column(
        query,
        "git_change.binary",
        "binary",
        request.args.groups,
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

    // Optional sorting
    services.data.orders.column(
        query,
        "ui_group.name",
        "ui_group_name",
        request.args.orders,
    );
    services.data.orders.column(
        query,
        "ui_group.id",
        "ui_group_id",
        request.args.orders,
    );

    // Print
    //query.debug();

    // Exec
    var results = await bb.database.execute(query);
    return results;
};
