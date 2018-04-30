
var gitRepo = require("./src/git/repo");
var gitLog = require("./src/git/log");

var dbController = require("./src/db/controller");
var dbPump = require("./src/db/pump");

var repositoryPath = process.argv[2];
var repositoryDays = parseInt(process.argv[3]);
console.log("Reading history of repository", repositoryPath, "for", repositoryDays, "days");

gitRepo.currentRepo(repositoryPath, function (success, repositoryUrl, error) {

    console.log("Repo", repositoryUrl);

    gitLog.logCommitsOfPreviousDays(repositoryPath, repositoryDays, function (success, commitsList, error) {

        console.log("Parsed", success, commitsList.length);

        dbPump.uploadCommits(repositoryUrl, commitsList, function (success, results, error) {

            console.log("Uploaded", success, results, error);

            var query = dbController.query("git_commit");
            query.select("*");
            query.execute(function (success, results, error) {
                console.log("Read", success, results, error);
            });

        });

    });

});
