
var lookup = require("../lookup");

var bb = require("../../bb");

module.exports = async function (repositoryUrl) {
    // Repository to be inserted
    var repository = {
        "url": repositoryUrl,
    };
    // Insert repository if not already there
    await bb.database.insert("git_repo", [repository], "ignore");
    // Fetch existing repository infos
    var repositories = await lookup.repository.byUrls([repositoryUrl]);
    // Done
    return repositories[0];
};
