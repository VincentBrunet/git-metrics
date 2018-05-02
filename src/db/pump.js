
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
        if (!success) {
            console.log("Repository update error", success, results, error);
        }
        var query = dbController.query("git_repo");
        query.select(["id", "url"]);
        query.where("url", repositoryUrl);
        query.execute(function (success, results, error) {
            return next(success, results[0].id, error);
        });
    });
};

$this.updateAuthors = function (commitsList, next) {
    // List all author found for insertion
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
    // Batch author insertion
    var batch = dbController.batch(commitsAuthorsInserted, function (chunk) {
        var query = dbController.query("git_author");
        query.insert(chunk);
        return dbController.rawQuery("insert or ignore" + query.toString().substring(6));
    });
    dbController.parallel(batch, function (success, results, error) {
        // Batch author reading
        var batch = dbController.batch(commitsAuthorsNames, function (chunk) {
            var query = dbController.query("git_author");
            query.select(["id", "name"]);
            query.whereIn("name", chunk);
            return query;
        });
        dbController.combined(batch, function (success, results, error) {
            // Index author by name
            var authorIdByName = {};
            core.for(results, function (key, value) {
                authorIdByName[value.name] = value.id;
            });
            return next(success, authorIdByName, error);
        });
    });
};

$this.updateCommits = function (repositoryId, authorIdByName, commitsList, next) {
    // List all commits found for insertion
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
    // Batch commit insertion
    var batch = dbController.batch(commitsInserted, function (chunk) {
        var query = dbController.query("git_commit");
        query.insert(chunk);
        return dbController.rawQuery("insert or ignore" + query.toString().substring(6));
    });
    dbController.parallel(batch, function (success, results, error) {
        // Batch commit reading
        var batch = dbController.batch(commitsHashes, function (chunk) {
            var query = dbController.query("git_commit");
            query.select(["id", "hash"]);
            query.whereIn("hash", chunk);
            return query;
        });
        dbController.combined(batch, function (success, results, error) {
            // Index commit by hash
            var commitIdByHash = {};
            core.for(results, function (key, value) {
                commitIdByHash[value.hash] = value.id;
            });
            return next(success, commitIdByHash, error);
        });
    });
};

$this.updateFilesInsertions = function (repositoryId, commitIdByHash, commitsList, next) {
    // List all files found for insertion
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
                console.log("Cannot find hash", commit.hash);
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
    // Batch file insertion
    var batch = dbController.batch(commitsFilesInserted, function (chunk) {
        var query = dbController.query("git_file");
        query.insert(chunk);
        return dbController.rawQuery("insert or ignore" + query.toString().substring(6));
    });
    dbController.parallel(batch, function (success, results, error) {
        return next(success, results, error);
    });
};

$this.updateFilesDeletions = function (repositoryId, commitIdByHash, commitsList, next) {
    // List all files found for mark as deleted
    var commitsFilesDeletions = [];
    core.for(commitsList, function (idx, commit) {
        core.for(commit.deletions, function (idx, deletion) {
            commitsFilesDeletions.push(deletion);
        });
        core.for(commit.renames, function (idx, rename) {
            commitsFilesDeletions.push(rename.before);
        });
    });
    // Batch file reading
    var batch = dbController.batch(commitsFilesDeletions, function (chunk) {
        var query = dbController.query("git_file");
        query.leftJoin("git_commit as add_git_commit", "git_file.add_git_commit_id", "add_git_commit.id");
        query.leftJoin("git_commit as del_git_commit", "git_file.del_git_commit_id", "del_git_commit.id");
        query.where("git_file.git_repo_id", repositoryId);
        query.whereIn("path", chunk);
        query.selectAs({
            "git_file.id": "git_file_id",
            "git_file.path": "git_file_path",
            "add_git_commit.id": "add_git_commit_id",
            "add_git_commit.time": "add_git_commit_time",
            "del_git_commit.id": "del_git_commit_id",
            "del_git_commit.time": "del_git_commit_time",
        });
        return query;
    });
    dbController.combined(batch, function (success, results, error) {
        // Index files by path
        var filesByPath = {};
        core.for(results, function (idx, result) {
            var filesList = filesByPath[result.git_file_path] || [];
            filesList.push(result);
            filesByPath[result.git_file_path] = filesList;
        });
        // List file updates to be applied
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
        // Create update queries from files to change
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
    // List file changes paths found
    var commitsChangesPaths = [];
    core.for(commitsList, function (idx, commit) {
        core.for(commit.changes, function (idx, change) {
            commitsChangesPaths.push(change.path);
        });
    });
    // Batch file read
    var batch = dbController.batch(commitsChangesPaths, function (chunk) {
        var query = dbController.query("git_file");
        query.leftJoin("git_commit as add_git_commit", "git_file.add_git_commit_id", "add_git_commit.id");
        query.leftJoin("git_commit as del_git_commit", "git_file.del_git_commit_id", "del_git_commit.id");
        query.where("git_file.git_repo_id", repositoryId);
        query.whereIn("path", chunk);
        query.selectAs({
            "git_file.id": "git_file_id",
            "git_file.path": "git_file_path",
            "add_git_commit.id": "add_git_commit_id",
            "add_git_commit.time": "add_git_commit_time",
            "del_git_commit.id": "del_git_commit_id",
            "del_git_commit.time": "del_git_commit_time",
        });
        return query;
    });
    dbController.combined(batch, function (success, results, error) {
        // Index files by path
        var filesByPath = {};
        core.for(results, function (idx, result) {
            var filesList = filesByPath[result.git_file_path] || [];
            filesList.push(result);
            filesByPath[result.git_file_path] = filesList;
        });
        // List changes to be applied to different paths
        var insertedChanges = [];
        core.for(commitsList, function (idx, commit) {
            var commitId = commitIdByHash[commit.hash];
            var commitTime = commit.date.valueOf();
            core.for(commit.changes, function (idx, change) {
                var filesList = filesByPath[change.path];
                core.for(filesList, function (idx, file) {
                    if (file.add_git_commit_time >= commitTime) {
                        if (file.del_git_commit_time == null || file.del_git_commit_time <= commitTime) {
                            insertedChanges.push({
                                "git_file_id": file.git_file_id,
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
        // Batch changes insertions
        console.log("InsertChanges", insertedChanges.length, commitsChangesPaths.length, results.length);
        var batch = dbController.batch(insertedChanges, function (chunk) {
            var query = dbController.query("git_change");
            query.insert(chunk);
            return dbController.rawQuery("insert or ignore" + query.toString().substring(6));
        });
        dbController.parallel(batch, function (success, results, error) {
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
