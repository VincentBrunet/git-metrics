
var lookup = require("../lookup");

var bb = require("../../bb");

module.exports = async function (context) {
    // Repository to be inserted
    var repository = {
        "url": context.parsed.url,
    };
    // Insert repository if not already there
    await bb.database.insert("git_repo", [repository], "ignore");
    // Fetch existing repository infos
    var results = await lookup.repository.byUrls([context.parsed.url]);
    // There should only be one (and just one)
    var repository = results[0];
    // Save
    context.synced.repository.id = repository.id;
    context.synced.repository.url = repository.url;
    // Done
    return repository;
};
