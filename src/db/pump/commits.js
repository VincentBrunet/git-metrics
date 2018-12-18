
var lookup = require("../lookup");

var bb = require("../../bb");

module.exports = async function (repository, authorsBySignatures, commitsList) {
    // List all commits hash
    var commitsHashes = [];
    bb.flow.for(commitsList, function (idx, commit) {
        commitsHashes.push(commit.hash);
    });
    // List all commits ready for insertion
    var commitsInserted = [];
    bb.flow.for(commitsList, function (idx, commit) {
        // Lookup commit author
        var author = authorsBySignatures[commit.author.signature];
        // Could not find author for this commit
        if (!author) {
            console.log("Could not find author", commit.author);
            return; // Continue loop
        }
        // Insert commit data
        commitsInserted.push({
            "git_repo_id": repository.id,
            "git_author_id": author.id,
            "refs": commit.refs.length,
            "parents": commit.parents.length,
            "hash": commit.hash,
            "comment": commit.comment.join("\n"),
            "time": commit.date.format(),
            "raw": commit.raw.join("\n"),
        });
    });
    // Insert all commits found (only if not already inserted)
    await bb.database.insert("git_commit", commitsInserted, "ignore");
    // Lookup all commits matching current repository
    var commitsByHash = await lookup.commits.byRepository(repository.id);
    // Done
    return commitsByHash;
};
