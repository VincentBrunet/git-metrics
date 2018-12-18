
var bb = require("../../bb");

module.exports = async function (log, logDeletedFiles, commitsById) {
    var filesById = {};
    var query = bb.database.query("git_file");
    query.select("*");
    var results = await bb.database.execute(query);
    var deleteds = 0;
    bb.flow.for(results, function (idx, git_file) {
        filesById[git_file.id] = git_file;
        if (log) {
            var add_git_commit = commitsById[git_file.add_git_commit_id];
            var del_git_commit = commitsById[git_file.del_git_commit_id];
            var timing = "(" + bb.moment(add_git_commit.time).calendar() + " => ";
            if (del_git_commit) {
                timing += "" + bb.moment(del_git_commit.time).calendar() + ")";
            }
            else {
                timing += "NULL)";
            }
            if (!del_git_commit || logDeletedFiles) {
                console.log("File", git_file.id, "\t", git_file.path, timing);
            }
        }
        if (git_file.del_git_commit_id) {
            deleteds++;
        }
    });
    console.log("Files count:", results.length, "deleteds:", deleteds);
    return filesById;
};
