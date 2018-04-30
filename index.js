
var gitLog = require("./src/git/log");

var dbController = require("./src/db/controller");
var dbInit = require("./src/db/init");
var dbPump = require("./src/db/pump");

var repositoryPath = process.argv[2];
var repositoryDays = parseInt(process.argv[3]);
console.log("Reading history of repository", repositoryPath, "for", repositoryDays, "days");

gitLog.run(repositoryPath, repositoryDays, function (success, commits, error) {

    console.log("Parsed", success, commits.length);

    if (success) {
        dbInit.build(function () {
            dbPump.uploadCommits(commits, function () {
                console.log("Uploaded");

                dbController.select("", "* FROM git_commit ORDER BY hash", function (success, results, error) {

                    results.forEach(function (row) {
                        console.log("Row", row);
                    });
                });
            });
        });
    }

});
