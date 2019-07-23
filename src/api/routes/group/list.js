var bb = require("../../../bb");

var services = require("../../services");

module.exports = async function (request) {
    // Query selection
    var query = bb.database.query("ui_group");
    query.leftJoin("ui_member", "ui_group.id", "ui_member.ui_group_id");
    query.leftJoin("git_contributor", "ui_member.git_author_id", "git_contributor.git_author_id");

    // Reading
    query.groupBy("ui_group.id");
    query.selectAs({
        "ui_group.id": "id",
        "ui_group.name": "name",
    });

    // Optional repository filters
    services.data.filters.column(
        query,
        "git_contributor.git_repository_id",
        request.args.git_repository_ids,
        request.args.git_repository_id
    );

    // Optional sorting
    services.data.orders.column(
        query,
        "git_contributor.git_repository_id",
        "git_repository_id",
        request.args.orders,
    );
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

    // Debug
    //query.debug();

    // Results
    var results = await bb.database.execute(query);
    return results;
};
