
var core = require("../core");

var dbController = require("./controller");
var dbLookups = require("./lookups");

var $this = {};

$this.pumpRepository = function (repositoryUrl, next) {
    // Repository to be inserted
    var repository = {
        "url": repositoryUrl,
    };
    // Insert repository if not already there
    dbController.inserts("git_repo", [repository], "insert or ignore", function (success, results, error) {
        // Repository could not update
        if (!success) {
            console.log("Repository update error", success, results, error);
        }
        // Fetch existing repository infos
        dbLookups.lookupRepositoryByUrl(repositoryUrl, function (success, repository, error) {
            // Return repository id
            return next(success, repository, error);
        });
    });;
};

$this.updateAuthors = function (repository, commitsList, next) {
    // Index all author names
    var authors = {};
    core.for(commitsList, function (idx, commit) {
        authors[commit.author] = true;
    });
    // List all authors to be inserted
    var authorsInserted = [];
    core.for(authors, function (key, value) {
        authorsInserted.push({
            name: key,
        });
    });
    // Insert all authors, or ignore if already there
    dbController.inserts("git_author", authorsInserted, "insert or ignore", function (success, results, error) {
        // Get all authors with found names
        dbLookups.lookupAuthorsByNames(core.keys(authors), function (success, authorsByName, error) {
            // Insert contributors
            var contributorsInserted = [];
            core.for(authorsByName, function (key, author) {
                contributorsInserted.push({
                    "git_repo_id": repository.id,
                    "git_author_id": author.id,
                });
            });
            // Inset all contributors
            dbController.inserts("git_contributor", contributorsInserted, "insert or ignore", function (success, results, error) {
                // Return authors by name
                return next(success, authorsByName, error);
            });
        });
    });
};

$this.updateCommits = function (repository, authorsByName, commitsList, next) {
    // List all commits hash
    var commitsHashes = [];
    core.for(commitsList, function (idx, commit) {
        commitsHashes.push(commit.hash);
    });
    // List all commits ready for insertion
    var commitsInserted = [];
    core.for(commitsList, function (idx, commit) {
        // Lookup commit author
        var author = authorsByName[commit.author];
        // Could not find author for this commit
        if (!author) {
            console.log("Could not find author", commit.author);
            return; // Continue loop
        }
        // Insert commit data
        commitsInserted.push({
            "git_repo_id": repository.id,
            "git_author_id": author.id,
            "parents": commit.parents.length,
            "hash": commit.hash,
            "comment": commit.comment.join("\n"),
            "time": commit.date.valueOf(),
        });
    });
    // Insert all commits found (only if not already inserted)
    dbController.inserts("git_commit", commitsInserted, "insert or ignore", function (success, results, error) {
        // Lookup all commits matching found hashes
        dbLookups.lookupCommitsByHash(repository.id, commitsHashes, function (success, commitsByHash, error) {
            // Return commits by hash
            return next(success, commitsByHash, error);
        });
    });
};

$this.updateTree = function (repository, commitsByHash, commitsList, next) {
    // Count commits not found
    var notFoundCommits = 0;
    // List all commit parenting relations
    var treesInserted = [];
    core.for(commitsList, function (idx, commit) {
        // Lookup child commit
        var childCommit = commitsByHash[commit.hash];
        // If we could not find child commit
        if (!childCommit) {
            console.log("Could not find child commit", commit.hash);
            return; // Continue loop
        }
        // For every parent of this commit
        core.for(commit.parents, function (idx, parentHash) {
            // Lookup parent commit
            var parentCommit = commitsByHash[parentHash];
            // If we could not find parent commit
            if (!parentCommit) {
                notFoundCommits++;
                //console.log("Could not find parent commit", parentHash);
                return; // Continue loop
            }
            // Insert parenting relation
            treesInserted.push({
                "git_repo_id": repository.id,
                "git_commit_id": childCommit.id,
                "parent_git_commit_id": parentCommit.id,
            });
        });
    });
    // Insert all found parenting relations
    dbController.inserts("git_tree", treesInserted, "insert or ignore", function (success, results, error) {
        // Done
        return next(success, -notFoundCommits, error);
    });
};

$this.updateFilesInsertions = function (repository, commitsByHash, commitsList, next) {
    // List all files found for insertion
    var filesInserted = [];
    core.for(commitsList, function (idx, commit) {
        // Lookup parent commit
        var parentCommit = commitsByHash[commit.hash];
        // If we could not find parent commit
        if (!parentCommit) {
            console.log("Could not find parent commit", commit.hash);
            return; // Continue loop
        }
        // List all added path by this commit
        var addedPaths = [];
        core.for(commit.additions, function (idx, addition) {
            addedPaths.push(addition);
        });
        core.for(commit.renames, function (idx, rename) {
            addedPaths.push(rename.after);
        });
        // Insert all added path
        core.for(addedPaths, function (idx, path) {
            // Insert added path
            filesInserted.push({
                "git_repo_id": repository.id,
                "add_git_commit_id": parentCommit.id,
                "del_git_commit_id": null,
                "path": path,
            });
        });
    });
    // Insert all found files
    dbController.inserts("git_file", filesInserted, "insert or ignore", function (success, results, error) {
        // Done
        return next(success, results, error);
    });
};

$this.updateFilesDeletions = function (repository, commitsByHash, commitsList, next) {
    // Count files paths not found
    var notFoundFiles = 0;
    // List all files found for mark as deleted
    var commitsFilesDeletions = {};
    core.for(commitsList, function (idx, commit) {
        core.for(commit.deletions, function (idx, deletion) {
            commitsFilesDeletions[deletion] = true;
        });
        core.for(commit.renames, function (idx, rename) {
            commitsFilesDeletions[rename.before] = true;
        });
    });
    // Lookup all files deleteds
    dbLookups.lookupFilesByPaths(repository.id, core.keys(commitsFilesDeletions), function (success, filesByPath, error) {
        // List file updates to be applied
        var filesDeletedByCommitId = {};
        core.for(commitsList, function (idx, commit) {
            // Lookup parent commit
            var parentCommit = commitsByHash[commit.hash];
            // If parent commit not found
            if (!parentCommit) {
                console.log("Could not find parent commit", commit.hash);
                return; // Continue loop
            }
            // List all paths to be marked as deleted
            var commitDeletions = [];
            core.for(commit.deletions, function (idx, deletion) {
                commitDeletions.push(deletion);
            });
            core.for(commit.renames, function (idx, rename) {
                commitDeletions.push(rename.before);
            });
            // For every deleted paths, lookup their associated files
            core.for(commitDeletions, function (idx, deletion) {
                // Lookup files from path
                var filesList = filesByPath[deletion];
                // If could not find files from path
                if (!filesList) {
                    notFoundFiles++;
                    //console.log("Could not find file for path", deletion);
                    return; // Continue loop
                }
                core.for(filesList, function (idx, file) {
                    // If path deletion belongs to this file (not already deleted and stuff)
                    if (file.add_git_commit_time <= parentCommit.time) {
                        if (file.del_git_commit_time == null || file.del_git_commit_time >= parentCommit.time) {
                            if (file.del_git_commit_id != parentCommit.id) {
                                // Update file record
                                var fileList = filesDeletedByCommitId[parentCommit.id] || [];
                                fileList.push(file.id);
                                filesDeletedByCommitId[parentCommit.id] = fileList;
                            }
                        }
                    }
                });
            });
        });
        // Format updates
        var filesUpdatesKeys = [];
        var filesUpdatesValues = [];
        core.for(filesDeletedByCommitId, function (commitId, filesIds) {
            var filesIdsChunk = core.chunks(filesIds, 100);
            core.for(filesIdsChunk, function (idx, filesIds) {
                filesUpdatesKeys.push(filesIds);
                filesUpdatesValues.push({
                    "del_git_commit_id": commitId,
                });
            });
        });
        // Update files using update dictionary
        dbController.updateBy("git_file", "id", filesUpdatesKeys, filesUpdatesValues, function (success, results, error) {
            // Done
            return next(success, -notFoundFiles, error);
        });
    });
};

$this.updateFilesRenames = function (repository, commitsByHash, commitsList, next) {
    // Count files not found
    var notFoundFiles = 0;
    // List renamed commits files paths
    var filesRenamesPaths = {};
    core.for(commitsList, function (idx, commit) {
        core.for(commit.renames, function (idx, rename) {
            filesRenamesPaths[rename.before] = true;
            filesRenamesPaths[rename.after] = true;
        });
    });
    // Lookup all files renamed
    dbLookups.lookupFilesByPaths(repository.id, core.keys(filesRenamesPaths), function (success, filesByPath, error) {
        // List all rename instances to be created
        var renamesInserted = [];
        core.for(commitsList, function (idx, commit) {
            // Lookup parent commit
            var parentCommit = commitsByHash[commit.hash];
            if (!parentCommit) {
                console.log("Could not find parent commit", commit.hash);
                return; // Continue looping
            }
            // Loop over all renames of commit
            core.for(commit.renames, function (idx, rename) {
                // Lookup file after rename
                var fileAfter = undefined;
                var filesAfter = filesByPath[rename.after];
                core.for(filesAfter, function (idx, file) {
                    if (file.add_git_commit_id == parentCommit.id) {
                        fileAfter = file;
                    }
                });
                // If we could not find file after rename
                if (!fileAfter) {
                    console.log("Could not find file after rename", rename.after);
                    return; // Continue loop
                }
                // Lookup file before rename
                var fileBefore = undefined;
                var filesBefore = filesByPath[rename.before];
                core.for(filesBefore, function (idx, file) {
                    if (file.del_git_commit_id == parentCommit.id) {
                        fileBefore = file;
                    }
                });
                // If we could not find file before rename
                if (!fileBefore) {
                    notFoundFiles++;
                    //console.log("Could not find file before rename", rename.before);
                    return; // Continue loop
                }
                // Insert rename instance when everything is found
                renamesInserted.push({
                    "git_repo_id": repository.id,
                    "git_commit_id": parentCommit.id,
                    "before_git_file_id": fileBefore.id,
                    "after_git_file_id": fileAfter.id,
                });
            });
        });
        // Insert all rename previously found
        dbController.inserts("git_rename", renamesInserted, "insert or ignore", function (success, results, error) {
            // Done
            return next(success, -notFoundFiles, error);
        });
    });
};

$this.updateChanges = function (repository, authorsByName, commitsByHash, commitsList, next) {
    // Count files not found
    var notFoundFiles = 0;
    // List file changes paths found
    var commitsChangesPaths = {};
    core.for(commitsList, function (idx, commit) {
        core.for(commit.changes, function (idx, change) {
            commitsChangesPaths[change.path] = true;
        });
    });
    // Lookup all files changed
    dbLookups.lookupFilesByPaths(repository.id, core.keys(commitsChangesPaths), function (success, filesByPath, error) {
        // List changes to be applied to different paths
        var insertedChanges = [];
        core.for(commitsList, function (idx, commit) {
            // Lookup parent commit
            var parentCommit = commitsByHash[commit.hash];
            // If we could not find parent commit
            if (!parentCommit) {
                console.log("Could not find parent commit", commit.hash);
                return; // Continue loop
            }
            // Lookup commit author
            var author = authorsByName[commit.author];
            // Could not find author for this commit
            if (!author) {
                console.log("Could not find author", commit.author);
                return; // Continue loop
            }
            // Loop over all commit changes
            core.for(commit.changes, function (idx, change) {
                // Lookup file changed by path
                var filesList = filesByPath[change.path];
                // If could not find files from path
                if (!filesList) {
                    notFoundFiles++;
                    //console.log("Could not find files from path", change.path);
                    return; // Continue loop
                }
                core.for(filesList, function (idx, file) {
                    // If file was alive at commit time
                    if (file.add_git_commit_time <= parentCommit.time) {
                        if (file.del_git_commit_time == null || file.del_git_commit_time >= parentCommit.time) {
                            // Insert change datas
                            insertedChanges.push({
                                "git_repo_id": repository.id,
                                "git_commit_id": parentCommit.id,
                                "git_author_id": author.id,
                                "git_file_id": file.id,
                                "additions": change.additions,
                                "deletions": change.deletions,
                                "changes": change.total,
                                "binary": +change.binary,
                            });
                        }
                    }
                });
            });
        });
        // Do insert all changes (ignore already inserted ones)
        dbController.inserts("git_change", insertedChanges, "insert or ignore", function (success, results, error) {
            return next(success, -notFoundFiles, error);
        });
    });
};

$this.updateAll = function (repositoryUrl, commitsList, next) {

    console.log("$this.updateAll", repositoryUrl, commitsList.length);

    $this.pumpRepository(repositoryUrl, function (success, repository, error) {

        console.log("$this.pumpRepository", success, repository.id, error);

        $this.updateAuthors(repository, commitsList, function (success, authorsByName, error) {

            console.log("$this.updateAuthors", success, core.count(authorsByName), error);

            $this.updateCommits(repository, authorsByName, commitsList, function (success, commitsByHash, error) {

                console.log("$this.updateCommits", success, core.count(commitsByHash), error);

                $this.updateTree(repository, commitsByHash, commitsList, function (success, results, error) {

                    console.log("$this.updateTree", success, results, error);

                    $this.updateFilesInsertions(repository, commitsByHash, commitsList, function (success, results, error) {

                        console.log("$this.updateFilesInsertions", success, results, error);

                        $this.updateFilesDeletions(repository, commitsByHash, commitsList, function (success, results, error) {

                            console.log("$this.updateFilesDeletions", success, results, error);

                            $this.updateFilesRenames(repository, commitsByHash, commitsList, function (success, results, error) {

                                console.log("$this.updateFilesRenames", success, results, error);

                                $this.updateChanges(repository, authorsByName, commitsByHash, commitsList, function (success, results, error) {

                                    console.log("$this.updateChanges", success, results, error);

                                    return next(success, results, error);

                                });
                            });
                        });
                    });
                });
            });
        });
    });
};

module.exports = $this;
