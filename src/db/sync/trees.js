
var lookup = require("../lookup");

var bb = require("../../bb");

module.exports = async function (context) {
    // Lookup Repository
    var syncedRepository = context.synced.repository;
    // List all commit parenting relations
    var treesInserted = [];
    bb.flow.for(context.parsed.commits, function (idx, commit) {
        // Lookup child commit
        var syncedChildCommit = context.synced.commits[commit.hash];
        // If we could not find child commit
        if (!syncedChildCommit) {
            console.log("Could not find child commit", commit.hash);
            return; // Continue loop
        }
        // For every parent of this commit
        bb.flow.for(commit.trees, function (idx, parentHash) {
            // Lookup parent commit
            var syncedParentCommit = context.synced.commits[parentHash];
            // If we could not find parent commit
            if (!syncedParentCommit) {
                console.log("Could not find parent commit", parentHash);
                return; // Continue loop
            }
            // Insert parenting relation
            treesInserted.push({
                "git_repository_id": syncedRepository.id,
                "git_commit_id_parent": syncedParentCommit.id,
                "git_commit_id_child": syncedChildCommit.id,
            });
        });
    });
    // Insert all found parenting relations
    await bb.database.insert("git_tree", treesInserted, "ignore");
    // Lookup all tree matching current repository
    var trees = await lookup.trees.byRepository(syncedRepository.id);
    // Group by child commit hash
    context.synced.trees = bb.array.groupBy(trees, "git_commit_id_child");
    // Done
    return treesInserted;
};
