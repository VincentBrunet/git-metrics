
var core = require("../core");

var dbController = require("./controller");

$this = {};

$this.uploadCommits = function (commits, next) {

    var gitCommitsTable = "git_commit";
    var gitCommitsFields = ["hash", "comment", "date"];
    var gitCommitsData = [];

    core.for(commits, function (idx, commit) {
        gitCommitsData.push(commit.hash);
        gitCommitsData.push(commit.comment.join("\n"));
        gitCommitsData.push(commit.date.valueOf());
    });

    dbController.insert(gitCommitsTable, gitCommitsFields, gitCommitsData, next);

};

module.exports = $this;
