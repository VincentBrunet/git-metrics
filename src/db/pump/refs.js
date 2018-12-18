
var lookup = require("../lookup");

var bb = require("../../bb");

module.exports = async function (repository, commitsByHash, commitsList) {
    // Index all ref signatures
    var refsByValues = {};
    bb.flow.for(commitsList, function (idx, commit) {
        bb.flow.for(commit.refs, function (idx, value) {
            refsByValues[value] = value;
        });
    });
    // List all refs to be inserted
    var refsInserted = [];
    bb.flow.for(refsByValues, function (value, ref) {
        refsInserted.push({
            "git_repo_id": repository.id,
            "value": value,
        });
    });
    // Insert all refs, or ignore if already there
    await bb.database.insert("git_ref", refsInserted, "ignore");
    // Get all refs with found signatures
    refsByValues = await lookup.refs.byValues(repository.id, bb.dict.keys(refsByValues));
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
            // All reeady
            linksInserted.push({
                "git_repo_id": repository.id,
                "git_ref_id": refValue.id,
                "git_commit_id": refCommit.id,
            });
        });
    });
    // Inset all links
    await bb.database.insert("git_link", linksInserted, "ignore");
    // Done
    return refsByValues;
};
