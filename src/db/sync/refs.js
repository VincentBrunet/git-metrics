
var lookup = require("../lookup");

var bb = require("../../bb");

module.exports = async function (context) {
    // Lookup Repository
    var syncedRepository = context.synced.repository;
    // List all refs to be inserted
    var refsInserted = [];
    bb.flow.for(context.parsed.refs, function (value, ref) {
        refsInserted.push({
            "git_repository_id": syncedRepository.id,
            "value": value,
        });
    });
    // Insert all refs, or ignore if already there
    await bb.database.insert("git_ref", refsInserted, "ignore");
    // Get all refs within repository
    var refs = await lookup.refs.byRepository(syncedRepository.id);
    // Index refs by value
    context.synced.refs = bb.array.indexBy(refs, "value");
    // Return inserteds
    return refsInserted;
};
