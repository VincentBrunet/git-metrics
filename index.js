
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

    console.log("Repo", repositoryUrl);

    gitLog.logsOfPreviousDays(repositoryPath, repositoryDays, function (success, commitsLogs, error) {

        var commitsList = gitParse.parseLogList(commitsLogs);

        console.log("Parsed", success, commitsList.length);

        dbPump.updateAll(repositoryUrl, commitsList, function (success, results, error) {

            console.log("Uploaded", success, results, error);

            var tables = [
                "git_author",
                "git_repo",
                "git_commit",
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

                console.log("Read", success);

                core.for(results, function (key, result) {
                    console.log("Result", key, result.datas[0]["count(*)"]);
                });

            });

        });

    });

});
