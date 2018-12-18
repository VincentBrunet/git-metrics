
var gitRepo = require("./src/git/repo");
var gitLog = require("./src/git/log");
var gitParse = require("./src/git/parse");

var dbController = require("./src/db/controller");
var dbPump = require("./src/db/pump");
var dbDump = require("./src/db/dump");


var commandType = process.argv[2];
if (commandType == "API") {
    var apiRun = require("./src/api/run");
    apiRun.start("127.0.0.1", 8080);
    return;
}

var repositoryPath = process.argv[3];
var repositoryDays = parseInt(process.argv[4]);

$this = {};

$this.run = async function (path, days) {
    try {
        console.log("Reading history of repository", path, "for", days, "days");
        var reporitoryUrl = await gitRepo.currentRepo(path);
        console.log("gitRepo.currentRepo", reporitoryUrl);
        var commitsLines = await gitLog.logsPreviousDays(path, days);
        console.log("gitLog.logsPreviousDays", commitsLines.length);
        var commitsList = gitParse.parseLogList(commitsLines);
        console.log("gitLog.parseLogList", commitsList.length);

        //console.log("PUMP", commitsList);

        var results = await dbPump.all(reporitoryUrl, commitsList);

        console.log("END", results);
    }
    catch (error) {
        console.log("ERROR", error);
    }
}

/*
var debugFile = "./git_logs.debug";
var fs = require('fs');
fs.writeFile(debugFile, commitsLines.join("\n"), function(err) {
    console.log("The file was saved!", debugFile);
});
*/

$this.run(repositoryPath, repositoryDays);

/*
        dbPump.updateAll(repositoryUrl, commitsList, function (success, results, error) {

            console.log("dbPump.updateAll", success, results, error);

            if (!success) {
                return;
            }

            var tables = [
                "git_author",
                "git_repo",
                "git_contributor",
                "git_commit",
                "git_tree",
                "git_file",
                "git_rename",
                "git_change",
            ];
            var queries = {};
            bb.flow.for(tables, function (idx, tableName) {
                var query = dbController.query(tableName);
                query.count();
                queries[tableName] = query;
            });
            dbController.parallel(queries, function (success, results, error) {
                bb.flow.for(results, function (key, result) {
                    console.log("Table Content:", key, result.datas[0]);
                });
            });

            dbDump.dumpCommits(false, false, function (success, commitsById, error) {
                dbDump.dumpFiles(false, false, commitsById, function (success, filesById, error) {
                    dbDump.dumpChanges(false, commitsById, filesById, function (success, results, error) {
                        dbDump.dumpRenames(false, commitsById, filesById, function (success, results, error) {
                            console.log("Dump done");
                        });
                    });
                });
            });

        });

    });

});
*/
