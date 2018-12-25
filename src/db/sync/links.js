
var bb = require("../../bb");

module.exports = async function (context) {
    // Lookup Repository
    var syncedRepository = context.synced.repository;
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
        // Create all the links from all refs
        bb.flow.for(parsedCommit.refs, function (idx, value) {
            // Get associated ref
            var syncedRef = context.synced.refs[value];
            // If we could not find ref value
            if (!syncedRef) {
                console.log("Could not find synced ref", value);
                return; // Continue loop
            }
            // All ready
            insertedLinks.push({
                "git_repository_id": syncedRepository.id,
                "git_ref_id": syncedRef.id,
                "git_commit_id": syncedCommit.id,
            });
        });
    });
    // Insert all links
    await bb.database.insert("git_link", insertedLinks, "ignore");
    // Return inserteds
    return insertedLinks;
};
