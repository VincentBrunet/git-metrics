
var bb = require("../../bb");

module.exports = async function (context) {
    // Insert links
    var insertedLinks = [];
    bb.flow.for(context.parsed.commits, function (idx, parsedCommit) {
        // Get associated commit
        var syncedCommit = context.synced.commits[parsedCommit.hash];
        // If we could not find commit
        if (!syncedCommit) {
            console.log("Could not find synced commit", parsedCommit.hash);
            return; // Continue loop
        }
        // Create all the refs
        bb.flow.for(parsedCommit.refs, function (idx, value) {
            // Get associated ref
            var refValue = context.synced.refs[value];
            // If we could not find ref value
            if (!refValue) {
                console.log("Could not find ref value", value);
                return;
            }
            // All ready
            insertedLinks.push({
                "git_repo_id": context.synced.repository.id,
                "git_ref_id": refValue.id,
                "git_commit_id": syncedCommit.id,
            });
        });
    });
    // Insert all links
    await bb.database.insert("git_link", insertedLinks, "ignore");
    // Return inserteds
    return insertedLinks;
};
