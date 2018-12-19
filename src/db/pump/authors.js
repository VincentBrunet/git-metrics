
var lookup = require("../lookup");

var bb = require("../../bb");

module.exports = async function (repository, commitsList) {
    // Index all author signatures
    var insertedAuthorsBySignatures = {};
    bb.flow.for(commitsList, function (idx, commit) {
        insertedAuthorsBySignatures[commit.author.signature] = commit.author;
    });
    // List all authors to be inserted
    var authorsInserted = [];
    bb.flow.for(insertedAuthorsBySignatures, function (key, author) {
        authorsInserted.push({
            signature: author.signature,
            name: author.name,
            email: author.email,
        });
    });
    // Insert all authors, or ignore if already there
    await bb.database.insert("git_author", authorsInserted, "ignore");
    // Get all authors with found signatures
    var authors = await lookup.authors.bySignatures(bb.dict.keys(insertedAuthorsBySignatures));
    // Index authors by signature
    var authorsBySignatures = bb.array.indexBy(authors, "signature");
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
