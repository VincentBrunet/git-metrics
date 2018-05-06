
var moment = require("moment");

var core = require("./src/core");

var gitRepo = require("./src/git/repo");
var gitLog = require("./src/git/log");
var gitParse = require("./src/git/parse");

var dbController = require("./src/db/controller");
var dbPump = require("./src/db/pump");

var repositoryPath = process.argv[2];
var repositoryDays = parseInt(process.argv[3]);

console.log("Reading history of repository", repositoryPath, "for", repositoryDays, "days");

gitRepo.currentRepo(repositoryPath, function (success, repositoryUrl, error) {

    console.log("gitRepo.currentRepo", repositoryUrl);

    gitLog.logsOfPreviousDays(repositoryPath, repositoryDays, function (success, commitsLines, error) {

        var commitsList = gitParse.parseLogList(commitsLines);

        console.log("gitLog.logsOfPreviousDays", success, commitsList.length);

        dbPump.updateAll(repositoryUrl, commitsList, function (success, results, error) {

            console.log("dbPump.updateAll", success, results, error);

            var tables = [
                "git_author",
                "git_repo",
                "git_commit",
                "git_tree",
                "git_file",
                "git_rename",
                "git_change",
            ];
            var queries = {};
            core.for(tables, function (idx, tableName) {
                var query = dbController.query(tableName);
                query.count();
                queries[tableName] = query;
            });
            dbController.parallel(queries, function (success, results, error) {
                core.for(results, function (key, result) {
                    console.log("Table Content:", key, result.datas[0]["count(*)"]);
                });
            });

            var commitById = {};
            var query = dbController.query("git_commit");
            query.select("*");
            query.execute(function (success, results, error) {
                results = core.sortBy(results, "time");
                core.for(results, function (idx, git_commit) {
                    commitById[git_commit.id] = git_commit;
                    console.log("Commit", git_commit.id, git_commit.hash, git_commit.parents, moment(git_commit.time).calendar());
                });
                console.log("Commit count:", results.length);
            });

            var fileById = {};
            var query = dbController.query("git_file");
            query.select("*");
            query.execute(function (success, results, error) {
                var deleteds = 0;
                core.for(results, function (idx, git_file) {
                    fileById[git_file.id] = git_file;
                    var add_git_commit = commitById[git_file.add_git_commit_id];
                    var del_git_commit = commitById[git_file.del_git_commit_id];
                    var timing = "(" + moment(add_git_commit.time).calendar() + " => ";
                    if (del_git_commit) {
                        timing += "" + moment(del_git_commit.time).calendar() + ")";
                    }
                    else {
                        timing += "NULL)";
                    }
                    console.log("File", git_file.id, git_file.path, timing);
                    if (git_file.del_git_commit_id) {
                        deleteds++;
                    }
                });
                console.log("Files count:", results.length, "deleteds:", deleteds);
            });

            var query = dbController.query("git_change");
            query.select("*");
            query.execute(function (success, results, error) {
                core.for(results, function (idx, git_change) {
                    var git_commit = commitById[git_change.git_commit_id];
                    var git_file = fileById[git_change.git_file_id];
                    var timing = "(" + moment(git_commit.time).calendar() + ")";
                    console.log("Change", git_change.id, ":", git_commit.hash.substring(0, 7), git_file.path, "+" + git_change.additions, "-" + git_change.deletions, timing);
                });
                console.log("Files change:", results.length);
            });

            var query = dbController.query("git_rename");
            query.select("*");
            query.execute(function (success, results, error) {
                core.for(results, function (idx, git_rename) {
                    var git_commit = commitById[git_rename.git_commit_id];
                    var before_git_file = fileById[git_rename.before_git_file_id];
                    var after_git_file = fileById[git_rename.after_git_file_id];
                    var timing = "(" + moment(git_commit.time).calendar() + ")";
                    console.log("Rename", git_rename.id, ":", git_commit.hash.substring(0, 7), before_git_file.path, "=>", after_git_file.path, timing);
                });
                console.log("Files renames:", results.length);
            });

        });

    });

});
