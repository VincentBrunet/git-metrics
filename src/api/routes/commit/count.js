var bb = require("../../../bb");

var services = require("../../services");

var _common = require("./_common");

module.exports = async function (request) {
    // Query selection
    var query = bb.database.query("git_commit");
    // Reading
    query.select();
    // Count unique commits
    query.count("git_commit.id as value");
    // Execute
    var results = await _common(request, query);
    return results;
};
