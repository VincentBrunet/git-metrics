
var bb = require("../../bb");

module.exports = async function (log, logParentedCommits) {
    var commitsById = {};
    var query = bb.database.query("git_commit");
    query.select("*");
    var results = bb.database.execute(query);
    results = bb.array.sortBy(results, "time");
    bb.flow.for(results, function (idx, git_commit) {
        commitsById[git_commit.id] = git_commit;
        if (log) {
            if (git_commit.parents <= 0 || logParentedCommits) {
                console.log("Commit", git_commit.id, "\t", git_commit.hash, "<" + git_commit.parents + ">", bb.moment(git_commit.time).calendar());
            }
        }
    });
    console.log("Commit count:", results.length);
    return commitsById;
};
