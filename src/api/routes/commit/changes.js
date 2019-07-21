var bb = require("../../../bb");

var services = require("../../services");

var _common = require("./_common");

module.exports = async function (request) {
    // Query selection
    var query = bb.database.query("git_commit");
    // Reading
    query.select();
    // Count unique commits
    query.sum("git_commit.changes as value");
    // Results
    var results = await _common(request, query);
    return results;
};
