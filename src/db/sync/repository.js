
var lookup = require("../lookup");

var bb = require("../../bb");

module.exports = async function (context) {
    // Repository to be inserted
    var insertedRepository = {
        "url": context.parsed.repository,
    };
    // Insert repository if not already there
    await bb.database.insert("git_repository", [insertedRepository], "ignore");
    // Fetch existing repository infos
    var results = await lookup.repository.byUrls([context.parsed.repository]);
    // There should only be one (and just one)
    var repository = results[0];
    // Save
    context.synced.repository = repository;
    // Done
    return repository;
};
