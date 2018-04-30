
var core = require("../core");

var dbController = require("./controller");

var $this = {};

$this.uploadCommits = function (commits, next) {
    // Format data for DB insertion
    var commitsInserted = [];
    core.for(commits, function (idx, commit) {
        commitsInserted.push({
            "hash": commit.hash,
            "comment": commit.comment.join("\n"),
            "date": commit.date.valueOf(),
        });
    });
    // Run insert query
    var query = dbController.query("git_commit");
    query.insert(commitsInserted, true);
    var rawQuery = dbController.rawQuery("insert or ignore" + query.toString().substring(6));
    rawQuery.execute(function (success, results, error) {
        return next(success, results, error);
    });
};

module.exports = $this;
