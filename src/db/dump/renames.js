
var bb = require("../../bb");

module.exports = async function (log, commitsById, filesById) {
    var query = bb.database.query("git_rename");
    query.select("*");
    var results = await bb.database.execute(query);
    if (log) {
        bb.flow.for(results, function (idx, git_rename) {
            var git_commit = commitById[git_rename.git_commit_id];
            var before_git_file = fileById[git_rename.before_git_file_id];
            var after_git_file = fileById[git_rename.after_git_file_id];
            var timing = "(" + bb.moment(git_commit.time).calendar() + ")";
            console.log("Rename", git_rename.id, ":\t", git_commit.hash.substring(0, 7), before_git_file.path, "=>", after_git_file.path, timing);
        });
    }
    console.log("Files renames:", results.length);
    return results;
};
