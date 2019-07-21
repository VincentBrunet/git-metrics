var bb = require("../../../bb");

var services = require("../../services");

var _common = require("./_common");

module.exports = async function (request) {
    // Query selection
    var query = bb.database.query("git_change");
    // Reading
    query.select();
    // Count unique changes
    query.count("git_change.id as value");
    // Execute
    var result = await _common(request, query);
    return result;
};
