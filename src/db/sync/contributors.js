
var lookup = require("../lookup");

var bb = require("../../bb");

module.exports = async function (context) {
    // Lookup repository
    var syncedRepository = context.synced.repository;
    // Insert contributors
    var insertedContributors = [];
    bb.flow.for(context.synced.authors, function (key, syncedAuthor) {
        insertedContributors.push({
            "git_repository_id": syncedRepository.id,
            "git_author_id": syncedAuthor.id,
        });
    });
    // Inset all contributors
    await bb.database.insert("git_contributor", insertedContributors, "ignore");
    // Done
    return insertedContributors;
};
