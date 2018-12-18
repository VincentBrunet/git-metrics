
var bb = require("../../bb");

module.exports = async function (log, commitsById, filesById) {
    var query = bb.database.query("git_change");
    query.select("*");
    var results = await bb.database.execute(query);
    if (log) {
        bb.flow.for(results, function (idx, git_change) {
            var git_commit = commitsById[git_change.git_commit_id];
            var git_file = filesById[git_change.git_file_id];
            var timing = "(" + bb.moment(git_commit.time).calendar() + ")";
            console.log("Change", git_change.id, ":\t", git_commit.hash.substring(0, 7), "+" + git_change.additions + "\t", "-" + git_change.deletions + "\t", git_file.path, timing);
        });
    }
    console.log("Files change:", results.length);
    return results;
};
