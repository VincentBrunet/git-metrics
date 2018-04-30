
var core = require("../core");

var dbController = require("./controller");

var $this = {};

$this.updateRepository = function (repositoryUrl, next) {
    var query = dbController.query("git_repo");
    query.insert({
        "url": repositoryUrl,
    });
    var rawQuery = dbController.rawQuery("insert or ignore" + query.toString().substring(6));
    rawQuery.execute(function (success, results, error) {
        var query = dbController.query("git_repo");
        query.select(["id", "url"]);
        query.where("url", repositoryUrl);
        query.execute(function (success, results, error) {
            return next(success, results[0].id, error);
        });
    });
};

$this.updateAuthors = function (commitsList, next) {
    var commitsAuthors = {};
    core.for(commitsList, function (idx, commit) {
        commitsAuthors[commit.author] = true;
    });
    var commitsAuthorsNames = [];
    var commitsAuthorsInserted = [];
    core.for(commitsAuthors, function (key, value) {
        commitsAuthorsNames.push(key);
        commitsAuthorsInserted.push({
            name: key,
        });
    });
    var query = dbController.query("git_author");
    query.insert(commitsAuthorsInserted);
    var rawQuery = dbController.rawQuery("insert or ignore" + query.toString().substring(6));
    rawQuery.execute(function (success, results, error) {
        var query = dbController.query("git_author");
        query.select(["id", "name"]);
        query.whereIn("name", commitsAuthorsNames);
        query.execute(function (success, results, error) {
            var authorIdByName = {};
            core.for(results, function (key, value) {
                authorIdByName[value.name] = value.id;
            });
            return next(success, authorIdByName, error);
        });

    });
};

$this.updateCommits = function (repositoryId, authorIdByName, commitsList, next) {
    // Format data for DB insertion
    var commitsHashes = [];
    var commitsInserted = [];
    core.for(commitsList, function (idx, commit) {
        commitsHashes.push(commit.hash);
        commitsInserted.push({
            "git_repo_id": repositoryId,
            "git_author_id": authorIdByName[commit.author],
            "hash": commit.hash,
            "comment": commit.comment.join("\n"),
            "time": commit.date.valueOf(),
        });
    });
    // Run insert query
    var query = dbController.query("git_commit");
    query.insert(commitsInserted);
    var rawQuery = dbController.rawQuery("insert or ignore" + query.toString().substring(6));
    rawQuery.execute(function (success, results, error) {
        var query = dbController.query("git_commit");
        query.select(["id", "hash"]);
        query.whereIn("hash", commitsHashes);
        query.execute(function (success, results, error) {
            var commitIdByHash = {};
            core.for(results, function (key, value) {
                commitIdByHash[value.hash] = value.id;
            });
            return next(success, commitIdByHash, error);
        });
    });
};

$this.updateFiles = function (repositoryId, commitIdByHash, commitsList, next) {
    var commitsFilesInserted = [];
    core.for(commitsList, function (idx, commit) {
        core.for(commit.additions, function (idx, addition) {
            commitsFilesInserted.push({
                "git_repo_id": repositoryId,
                "add_git_commit_id": commitIdByHash[commit.hash],
                "del_git_commit_id": null,
                "add_time": commit.date.valueOf(),
                "del_time": null,
            });
        });
    });
};

$this.uploadCommits = function (repositoryUrl, commitsList, next) {

    $this.updateRepository(repositoryUrl, function (success, repositoryId, error) {

        $this.updateAuthors(commitsList, function (success, authorIdByName, error) {

            $this.updateCommits(repositoryId, authorIdByName, commitsList, function (success, commitIdByHash, error) {

                console.log("repositoryId", repositoryId);
                console.log("authorIdByName", authorIdByName);
                console.log("commitIdByHash", commitIdByHash);

            });

        });

    });

};

module.exports = $this;
