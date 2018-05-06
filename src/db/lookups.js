
var core = require("../core");

var dbController = require("./controller");

var $this = {};

$this.lookupRepositoryByUrl = function (repositoryUrl, next) {
    // Fetch existing repository infos
    var query = dbController.query("git_repo");
    query.where("url", repositoryUrl);
    query.select(["id", "url"]);
    query.execute(function (success, results, error) {
        // Could not find repository
        if (!success) {
            return next(false, undefined, error);
        }
        if (results.length <= 0) {
            return next(false, undefined, error);
        }
        // Done
        return next(success, results[0], error);
    });
};

$this.lookupAuthorsByNames = function (authorsNames, next) {
    // Batch author reading
    var batch = dbController.batch(authorsNames, function (chunk) {
        var query = dbController.query("git_author");
        query.whereIn("name", chunk);
        query.select(["id", "name"]);
        return query;
    });
    // Batch queries and combine all results
    dbController.combined(batch, function (success, git_authors, error) {
        // Index author by name
        var authorsByName = {};
        core.for(git_authors, function (idx, git_author) {
            authorsByName[git_author.name] = git_author;
        });
        // Done
        return next(success, authorsByName, error);
    });
};

$this.lookupCommitsByHash = function (repositoryId, commitsHashes, next) {
    // Batch commit reading
    var batch = dbController.batch(commitsHashes, function (chunk) {
        var query = dbController.query("git_commit");
        query.where("git_repo_id", repositoryId);
        query.whereIn("hash", chunk);
        query.select(["id", "hash", "time"]);
        return query;
    });
    // Batch queries and combine all results
    dbController.combined(batch, function (success, git_commits, error) {
        // Index commit by hash
        var commitsByHash = {};
        core.for(git_commits, function (idx, git_commit) {
            commitsByHash[git_commit.hash] = git_commit;
        });
        // Done
        return next(success, commitsByHash, error);
    });
};

$this.lookupFilesByPaths = function (repositoryId, filesPaths, next) {
    // Batch file read
    var batch = dbController.batch(filesPaths, function (chunk) {
        var query = dbController.query("git_file");
        query.leftJoin("git_commit as add_git_commit", "git_file.add_git_commit_id", "add_git_commit.id");
        query.leftJoin("git_commit as del_git_commit", "git_file.del_git_commit_id", "del_git_commit.id");
        query.where("git_file.git_repo_id", repositoryId);
        query.whereIn("path", chunk);
        query.selectAs({
            "git_file.id": "id",
            "git_file.path": "path",
            "add_git_commit.id": "add_git_commit_id",
            "add_git_commit.time": "add_git_commit_time",
            "del_git_commit.id": "del_git_commit_id",
            "del_git_commit.time": "del_git_commit_time",
        });
        return query;
    });
    // Run all batches query and merge results
    dbController.combined(batch, function (success, git_files, error) {
        // Index files by path
        var filesByPath = {};
        core.for(git_files, function (idx, git_file) {
            var filesList = filesByPath[git_file.path] || [];
            filesList.push(git_file);
            filesByPath[git_file.path] = filesList;
        });
        // Done, transfer files indexed by path
        return next(success, filesByPath, error);
    });
};

module.exports = $this;
