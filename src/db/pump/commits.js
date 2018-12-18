
var lookup = require("../lookup");

var bb = require("../../bb");

module.exports = function (repository, authorsByName, commitsList) {
    // List all commits hash
    var commitsHashes = [];
    bb.flow.for(commitsList, function (idx, commit) {
        commitsHashes.push(commit.hash);
    });
    // List all commits ready for insertion
    var commitsInserted = [];
    bb.flow.for(commitsList, function (idx, commit) {
        // Lookup commit author
        var author = authorsByName[commit.author];
        // Could not find author for this commit
        if (!author) {
            console.log("Could not find author", commit.author);
            return; // Continue loop
        }
        // Insert commit data
        commitsInserted.push({
            "git_repo_id": repository.id,
            "git_author_id": author.id,
            "parents": commit.parents.length,
            "hash": commit.hash,
            "comment": commit.comment.join("\n"),
            "time": commit.date.format(),
        });
    });
    // Insert all commits found (only if not already inserted)
    await bb.database.insert("git_commit", commitsInserted, "ignore");
    // Lookup all commits matching found hashes
    var commitsByHash = await lookup.commits.byHashes(repository.id, commitsHashes);
    // Done
    return commitsByHash;
};
