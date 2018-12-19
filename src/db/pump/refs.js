
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
    // Return inserteds
    return refsInserted;
};
