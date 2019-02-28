var bb = require("../../../bb");

module.exports = async function (args) {
    var query = bb.database.query("git_repository");
    query.selectAs({
        "id": "id",
        "url": "url",
    });
    var results = await bb.database.execute(query);
    return results;
};
