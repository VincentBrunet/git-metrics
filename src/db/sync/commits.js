
var lookup = require("../lookup");

var bb = require("../../bb");

module.exports = async function (context) {
    // Lookup repository
    var syncedRepository = context.synced.repository;
    // List all commits ready for insertion
    var insertedCommits = [];
    bb.flow.for(context.parsed.commits, function (idx, parsedCommit) {
        // Lookup commit author
        var syncedAuthor = context.synced.authors[parsedCommit.author.signature];
        // Could not find synced author
        if (!syncedAuthor) {
            console.log("Could not find synced author", parsedCommit.author.signature);
            return; // Continue loop
        }
        // Insert commit data
        insertedCommits.push({
            "git_repository_id": syncedRepository.id,
            "git_author_id": syncedAuthor.id,
            "refs": parsedCommit.refs.length,
            "trees": parsedCommit.trees.length,
            "changes": parsedCommit.changes.length,
            "creations": parsedCommit.creations.length,
            "deletions": parsedCommit.deletions.length,
            "renames": parsedCommit.renames.length,
            "source": parsedCommit.source,
            "hash": parsedCommit.hash,
            "comment": parsedCommit.comment.join("\n"),
            "time": parsedCommit.date.format(),
            "raw": parsedCommit.raw.join("\n"),
        });
    });
    // Insert all commits found (only if not already inserted)
    await bb.database.insert("git_commit", insertedCommits, "ignore");
    // Lookup all commits matching current repository
    var commits = await lookup.commits.byRepository(syncedRepository.id);
    // Index commit by hash
    context.synced.commits = bb.array.indexBy(commits, "hash");
    // Done
    return insertedCommits;
};
