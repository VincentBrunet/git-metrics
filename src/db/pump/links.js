
var lookup = require("../lookup");

var bb = require("../../bb");

module.exports = async function (repository, commitsByHash, commitsList) {
    // Get all refs within repository
    var refs = await lookup.refs.byRepository(repository.id);
    // Index refs by value
    var refsByValues = bb.array.indexBy(refs, "value");
    // Insert links
    var linksInserted = [];
    bb.flow.for(commitsList, function (idx, commit) {
        // Get associated commit
        var refCommit = commitsByHash[commit.hash];
        // If we could not find ref commit
        if (!refCommit) {
            console.log("Could not find ref commit", commit.hash);
            return; // Continue loop
        }
        // Create all the refs
        bb.flow.for(commit.refs, function (idx, value) {
            // Get associated ref
            var refValue = refsByValues[value];
            // If we could not find ref value
            if (!refValue) {
                console.log("Could not find ref value", value);
                return;
            }
            // All ready
            linksInserted.push({
                "git_repo_id": repository.id,
                "git_ref_id": refValue.id,
                "git_commit_id": refCommit.id,
            });
        });
    });
    // Insert all links
    await bb.database.insert("git_link", linksInserted, "ignore");
    // Return inserteds
    return linksInserted;
};
