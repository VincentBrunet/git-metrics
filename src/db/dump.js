
var core = require("../core");

var dbController = require("./controller");

var $this = {};

$this.dumpCommits = function (log, logParentedCommits, next) {
    var commitsById = {};
    var query = dbController.query("git_commit");
    query.select("*");
    query.execute(function (success, results, error) {
        results = core.sortBy(results, "time");
        core.for(results, function (idx, git_commit) {
            commitsById[git_commit.id] = git_commit;
            if (log) {
                if (git_commit.parents <= 0 || logParentedCommits) {
                    console.log("Commit", git_commit.id, "\t", git_commit.hash, "<" + git_commit.parents + ">", core.moment(git_commit.time).calendar());
                }
            }
        });
        console.log("Commit count:", results.length);
        return next(success, commitsById, error);
    });
};

$this.dumpFiles = function (log, logDeletedFiles, commitsById, next) {
    var filesById = {};
    var query = dbController.query("git_file");
    query.select("*");
    query.execute(function (success, results, error) {
        var deleteds = 0;
        core.for(results, function (idx, git_file) {
            filesById[git_file.id] = git_file;
            if (log) {
                var add_git_commit = commitsById[git_file.add_git_commit_id];
                var del_git_commit = commitsById[git_file.del_git_commit_id];
                var timing = "(" + core.moment(add_git_commit.time).calendar() + " => ";
                if (del_git_commit) {
                    timing += "" + core.moment(del_git_commit.time).calendar() + ")";
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
        return next(success, filesById, error);
    });
};

$this.dumpChanges = function (log, commitsById, filesById, next) {
    var query = dbController.query("git_change");
    query.select("*");
    query.execute(function (success, results, error) {
        if (log) {
            core.for(results, function (idx, git_change) {
                var git_commit = commitsById[git_change.git_commit_id];
                var git_file = filesById[git_change.git_file_id];
                var timing = "(" + core.moment(git_commit.time).calendar() + ")";
                console.log("Change", git_change.id, ":\t", git_commit.hash.substring(0, 7), "+" + git_change.additions + "\t", "-" + git_change.deletions + "\t", git_file.path, timing);
            });
        }
        console.log("Files change:", results.length);
        return next(success, results, error);
    });
};

$this.dumpRenames = function (log, commitsById, filesById, next) {
    var query = dbController.query("git_rename");
    query.select("*");
    query.execute(function (success, results, error) {
        if (log) {
            core.for(results, function (idx, git_rename) {
                var git_commit = commitById[git_rename.git_commit_id];
                var before_git_file = fileById[git_rename.before_git_file_id];
                var after_git_file = fileById[git_rename.after_git_file_id];
                var timing = "(" + core.moment(git_commit.time).calendar() + ")";
                console.log("Rename", git_rename.id, ":\t", git_commit.hash.substring(0, 7), before_git_file.path, "=>", after_git_file.path, timing);
            });
        }
        console.log("Files renames:", results.length);
        return next(success, results, error);
    });
};

module.exports = $this;
