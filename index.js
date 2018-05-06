
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

            var query = dbController.query("git_commit");
            query.select("*");
            query.execute(function (success, results, error) {
                core.for(results, function (idx, git_commit) {
                    console.log("Commit", git_commit.hash, git_commit.parents);
                });
                console.log("Commit count:", results.length);
            });

            var query = dbController.query("git_file");
            query.select("*");
            query.execute(function (success, results, error) {
                var deleteds = 0;
                core.for(results, function (idx, git_file) {
                    console.log("File", git_file.id, git_file.path, !git_file.del_git_commit_id);
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
                    console.log("Change", git_change.git_file_id, git_change.additions, git_change.deletions);
                });
                console.log("Files change:", results.length);
            });

        });

    });

});
