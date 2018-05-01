
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
    console.log("updateCommits", "start");
    // Format data for DB insertion
    var commitsHashes = [];
    var commitsInserted = [];
    core.for(commitsList, function (idx, commit) {
        commitsHashes.push(commit.hash);
        if (!authorIdByName[commit.author]) {
            console.log("Could not find author", commit.author);
        }
        else {
            commitsInserted.push({
                "git_repo_id": repositoryId,
                "git_author_id": authorIdByName[commit.author],
                "hash": commit.hash,
                "comment": commit.comment.join("\n"),
                "time": commit.date.valueOf(),
            });
        }
    });
    console.log("updateCommits", "mid");
    // Run insert query
    var query = dbController.query("git_commit");
    query.insert(commitsInserted);
    var rawQuery = dbController.rawQuery("insert or replace" + query.toString().substring(6));
    query.execute(function (success, results, error) {
        console.log("updateCommits", "res1");
        var query = dbController.query("git_commit");
        query.select(["id", "hash"]);
        query.whereIn("hash", commitsHashes);
        query.execute(function (success, results, error) {
            console.log("updateCommits", "res2", commitsHashes.length, results.length, commitsInserted.length);
            var commitIdByHash = {};
            core.for(results, function (key, value) {
                commitIdByHash[value.hash] = value.id;
            });
            return next(success, commitIdByHash, error);
        });
    });
};

$this.updateFilesInsertions = function (repositoryId, commitIdByHash, commitsList, next) {
    var commitsFilesInserted = [];
    core.for(commitsList, function (idx, commit) {
        var addedPaths = [];
        core.for(commit.additions, function (idx, addition) {
            addedPaths.push(addition);
        });
        core.for(commit.renames, function (idx, rename) {
            addedPaths.push(rename.after);
        });
        core.for(addedPaths, function (idx, path) {
            if (!commitIdByHash[commit.hash]) {
                //console.log("Cannot find hash", commit.hash);
            }
            else {
                commitsFilesInserted.push({
                    "git_repo_id": repositoryId,
                    "add_git_commit_id": commitIdByHash[commit.hash],
                    "del_git_commit_id": null,
                    "path": path,
                });
            }
        });
    });
    var query = dbController.query("git_file");
    query.insert(commitsFilesInserted);
    var rawQuery = dbController.rawQuery("insert or ignore" + query.toString().substring(6));
    rawQuery.execute(function (success, results, error) {
        return next(success, results, error);
    });
};

$this.updateFilesDeletions = function (repositoryId, commitIdByHash, commitsList, next) {
    var commitsFilesDeletions = [];
    core.for(commitsList, function (idx, commit) {
        core.for(commit.deletions, function (idx, deletion) {
            commitsFilesDeletions.push(deletion);
        });
        core.for(commit.renames, function (idx, rename) {
            commitsFilesDeletions.push(rename.before);
        });
    });
    var query = dbController.query("git_file");
    query.leftJoin("git_commit as add_git_commit", "git_file.add_git_commit_id", "add_git_commit.id");
    query.leftJoin("git_commit as del_git_commit", "git_file.del_git_commit_id", "del_git_commit.id");
    query.where("git_file.git_repo_id", repositoryId);
    query.whereIn("path", commitsFilesDeletions);
    query.selectAs({
        "git_file.id": "git_file_id",
        "git_file.path": "git_file_path",
        "add_git_commit.id": "add_git_commit_id",
        "add_git_commit.time": "add_git_commit_time",
        "del_git_commit.id": "del_git_commit_id",
        "del_git_commit.time": "del_git_commit_time",
    });
    query.execute(function (success, results, error) {
        var filesByPath = {};
        core.for(results, function (idx, result) {
            var filesList = filesByPath[result.git_file_path] || [];
            filesList.push(result);
            filesByPath[result.git_file_path] = filesList;
        });
        var filesUpdatedById = {};
        core.for(commitsList, function (idx, commit) {
            var commitId = commitIdByHash[commit.hash];
            var commitTime = commit.date.valueOf();
            var commitDeletions = [];
            core.for(commit.deletions, function (idx, deletion) {
                commitDeletions.push(deletion);
            });
            core.for(commit.renames, function (idx, rename) {
                commitDeletions.push(rename.before);
            });
            core.for(commitDeletions, function (idx, deletion) {
                var filesList = filesByPath[deletion];
                core.for(filesList, function (idx, file) {
                    if (file.add_git_commit_time <= commitTime) {
                        if (file.del_git_commit_time == null || file.del_git_commit_time >= commitTime) {
                            if (file.del_git_commit_id != commitId) {
                                filesUpdatedById[file.git_file_id] = {
                                    "del_git_commit_id": commitId,
                                };
                            }
                        }
                    }
                });
            });
        });
        var updateQueries = [];
        core.for(filesUpdatedById, function (key, value) {
            var query = dbController.query("git_file");
            query.where("id", key);
            query.update(value);
            updateQueries.push(query);
        });
        dbController.parallel(updateQueries, function (success, results, error) {
            return next(success, results, error);
        });
    });
};

$this.updateChanges = function (repositoryId, commitIdByHash, commitsList, next) {
    var commitsChangesPaths = [];
    core.for(commitsList, function (idx, commit) {
        core.for(commit.changes, function (idx, change) {
            commitsChangesPaths.push(change.path);
        });
    });
    var query = dbController.query("git_file");
    query.leftJoin("git_commit as add_git_commit", "git_file.add_git_commit_id", "add_git_commit.id");
    query.leftJoin("git_commit as del_git_commit", "git_file.del_git_commit_id", "del_git_commit.id");
    query.where("git_file.git_repo_id", repositoryId);
    query.whereIn("path", commitsChangesPaths);
    query.selectAs({
        "git_file.id": "git_file_id",
        "git_file.path": "git_file_path",
        "add_git_commit.id": "add_git_commit_id",
        "add_git_commit.time": "add_git_commit_time",
        "del_git_commit.id": "del_git_commit_id",
        "del_git_commit.time": "del_git_commit_time",
    });
    query.execute(function (success, results, error) {
        var filesByPath = {};
        core.for(results, function (idx, result) {
            var filesList = filesByPath[result.git_file_path] || [];
            filesList.push(result);
            filesByPath[result.git_file_path] = filesList;
        });
        var insertedChanges = [];
        core.for(commitsList, function (idx, commit) {
            var commitId = commitIdByHash[commit.hash];
            var commitTime = commit.date.valueOf();
            core.for(commit.changes, function (idx, change) {
                var pathList = filesByPath[change.path];
                core.for(pathList, function (idx, path) {
                    if (path.add_git_commit_time >= commitTime) {
                        if (path.del_git_commit_time == null || path.del_git_commit_time <= commitTime) {
                            insertedChanges.push({
                                "git_file_id": path.git_file_id,
                                "git_commit_id": commitId,
                                "additions": change.additions,
                                "deletions": change.deletions,
                                "changes": change.total,
                            });
                        }
                    }
                });
            });
        });
        var query = dbController.query("git_change");
        query.insert(insertedChanges);
        var rawQuery = dbController.rawQuery("insert or ignore" + query.toString().substring(6));
        rawQuery.execute(function (success, results, error) {
            return next(success, results, error);
        });
    });
};

$this.updateAll = function (repositoryUrl, commitsList, next) {

    $this.updateRepository(repositoryUrl, function (success, repositoryId, error) {

        console.log("repositoryId", repositoryId);

        $this.updateAuthors(commitsList, function (success, authorIdByName, error) {

            console.log("authorIdByName", authorIdByName);

            $this.updateCommits(repositoryId, authorIdByName, commitsList, function (success, commitIdByHash, error) {

                //console.log("commitIdByHash", commitIdByHash);

                $this.updateFilesInsertions(repositoryId, commitIdByHash, commitsList, function (success, results, error) {

                    console.log("$this.updateFilesInsertions", success, results, error);

                    $this.updateFilesDeletions(repositoryId, commitIdByHash, commitsList, function (success, results, error) {

                        console.log("$this.updateFilesDeletions", success, results, error);

                        $this.updateChanges(repositoryId, commitIdByHash, commitsList, function (success, results, error) {
                            console.log("$this.updateChanges", success, results, error);

                            return next(success, results, error);
                        });

                    });

                });

            });

        });

    });

};

module.exports = $this;
