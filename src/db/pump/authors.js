
var lookup = require("../lookup");

var bb = require("../../bb");

module.exports = async function (repository, commitsList) {
    // Index all author names
    var authors = {};
    bb.flow.for(commitsList, function (idx, commit) {
        authors[commit.author] = true;
    });
    // List all authors to be inserted
    var authorsInserted = [];
    bb.flow.for(authors, function (key, value) {
        authorsInserted.push({
            name: key,
        });
    });
    // Insert all authors, or ignore if already there
    await bb.database.insert("git_author", authorsInserted, "ignore");
    // Get all authors with found names
    var authorsByName = await lookup.authors.byName(bb.array.keys(authors));
    // Insert contributors
    var contributorsInserted = [];
    bb.flow.for(authorsByName, function (key, author) {
        contributorsInserted.push({
            "git_repo_id": repository.id,
            "git_author_id": author.id,
        });
    });
    // Inset all contributors
    return await bb.database.insert("git_contributor", contributorsInserted, "ignore");
};
