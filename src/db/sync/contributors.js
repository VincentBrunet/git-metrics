
var lookup = require("../lookup");

var bb = require("../../bb");

module.exports = async function (context) {
    // Insert contributors
    var insertedContributors = [];
    bb.flow.for(context.synced.authors, function (key, syncedAuthor) {
        insertedContributors.push({
            "git_repo_id": context.synced.repository.id,
            "git_author_id": syncedAuthor.id,
        });
    });
    // Inset all contributors
    await bb.database.insert("git_contributor", insertedContributors, "ignore");
    // Done
    return insertedContributors;
};
