
var core = require("../../core");

var dbController = require("../../db/controller");

var $this = {};

$this.listRepositories = function (next) {
    var query = dbController.query("git_repo");
    query.selectAs({
        "id": "id",
        "url": "url",
    });
    query.execute(function (success, results, error) {
        if (!success) {
            return next(false, undefined, new Error("Could not list repositories"));
        }
        return next(true, results);
    });
};

$this.repository = function (repositoryId, next) {
    var query = dbController.query("git_repo");
    query.where("id", repositoryId);
    query.selectAs({
        "id": "id",
        "url": "url",
    });
    query.execute(function (success, results, error) {
        if (!success) {
            return next(false, undefined, error);
        }
        if (results.length <= 0) {
            return next(false, undefined, new Error("Repository not found"));
        }
        return next(true, results[0]);
    });
};

$this.repositoryContributors = function (repositoryId, next) {
    var query = dbController.query("git_contributor");
    query.leftJoin("git_author", "git_contributor.git_author_id", "git_author.id");
    query.where("git_contributor.git_repo_id", repositoryId);
    query.selectAs({
        "git_author.id": "id",
        "git_author.name": "name",
    });
    query.execute(function (success, results, error) {
        if (!success) {
            return next(false, undefined, new Error("Coult not find repository contributors"));
        }
        return next(true, results);
    });
};

module.exports = $this;
