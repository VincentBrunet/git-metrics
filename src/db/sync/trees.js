
var lookup = require("../lookup");

var bb = require("../../bb");

module.exports = async function (context) {
    // List all commit parenting relations
    var treesInserted = [];
    bb.flow.for(context.parsed.commits, function (idx, commit) {
        // Lookup child commit
        var childCommit = context.synced.commits[commit.hash];
        // If we could not find child commit
        if (!childCommit) {
            console.log("Could not find child commit", commit.hash);
            return; // Continue loop
        }
        // For every parent of this commit
        bb.flow.for(commit.parents, function (idx, parentHash) {
            // Lookup parent commit
            var parentCommit = context.synced.commits[parentHash];
            // If we could not find parent commit
            if (!parentCommit) {
                console.log("Could not find parent commit", parentHash);
                return; // Continue loop
            }
            // Insert parenting relation
            treesInserted.push({
                "git_repo_id": context.synced.repository.id,
                "parent_git_commit_id": parentCommit.id,
                "child_git_commit_id": childCommit.id,
            });
        });
    });
    // Insert all found parenting relations
    await bb.database.insert("git_tree", treesInserted, "ignore");
    // Lookup all tree matching current repository
    var trees = await lookup.trees.byRepository(context.synced.repository.id);
    // Group by child commit hash
    context.synced.trees = bb.array.groupBy(trees, "child_git_commit_hash");
    // Done
    return treesInserted;
};
