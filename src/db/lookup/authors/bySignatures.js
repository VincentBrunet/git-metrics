
var bb = require("../../../bb");

module.exports = async function (authorsSignatures) {
    // Batch author reading
    var batch = bb.database.batch("git_author", authorsSignatures, function (query, chunk) {
        query.whereIn("signature", chunk);
        query.select(["id", "email", "name", "signature"]);
    });
    // Batch queries and combine all results
    var authors = await bb.database.combined(batch);
    // Done
    return authors;
};
