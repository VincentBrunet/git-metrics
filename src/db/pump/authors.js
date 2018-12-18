
var lookup = require("../lookup");

var bb = require("../../bb");

module.exports = async function (repository, commitsList) {
    // Index all author signatures
    var authorsBySignatures = {};
    bb.flow.for(commitsList, function (idx, commit) {
        authorsBySignatures[commit.author.signature] = commit.author;
    });
    // List all authors to be inserted
    var authorsInserted = [];
    bb.flow.for(authorsBySignatures, function (email, author) {
        authorsInserted.push({
            signature: author.signature,
            name: author.name,
            email: author.email,
        });
    });
    // Insert all authors, or ignore if already there
    await bb.database.insert("git_author", authorsInserted, "ignore");
    // Get all authors with found signatures
    authorsBySignatures = await lookup.authors.bySignatures(bb.dict.keys(authorsBySignatures));
    // Insert contributors
    var contributorsInserted = [];
    bb.flow.for(authorsBySignatures, function (key, author) {
        contributorsInserted.push({
            "git_repo_id": repository.id,
            "git_author_id": author.id,
        });
    });
    // Inset all contributors
    await bb.database.insert("git_contributor", contributorsInserted, "ignore");
    // Done
    return authorsBySignatures;
};
