
var bb = require("../../../bb");

module.exports = async function (authorsNames) {
    // Batch author reading
    var batch = bb.database.batch("git_author", authorsNames, function (chunk) {
        query.whereIn("name", chunk);
        query.select(["id", "name"]);
    });
    // Batch queries and combine all results
    var authors = await bb.database.execute(batch);
    // Index author by name
    var authorsByName = {};
    bb.flow.for(authors, function (idx, author) {
        authorsByName[author.name] = author;
    });
    // Done
    return authorsByName;
};
