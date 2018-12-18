
var bb = require("../../bb");

var $this = {};

$this.listRepositories = async function (next) {
    var query = bb.database.query("git_repo");
    query.selectAs({
        "id": "id",
        "url": "url",
    });
    var results = await bb.database.execute(query);
    return results;
};

$this.repository = async function (repositoryId, next) {
    var query = bb.database.query("git_repo");
    query.where("id", repositoryId);
    query.selectAs({
        "id": "id",
        "url": "url",
    });
    var results = await bb.database.execute(query);
    if (results.length <= 0) {
        throw new Error("Repository not found");
    }
    return results;
};

$this.repositoryContributors = async function (repositoryId, next) {
    var query = bb.database.query("git_contributor");
    query.leftJoin("git_author", "git_contributor.git_author_id", "git_author.id");
    query.where("git_contributor.git_repo_id", repositoryId);
    query.selectAs({
        "git_author.id": "id",
        "git_author.name": "name",
    });
    var results = await bb.database.execute(query);
    return results;
};

module.exports = $this;
