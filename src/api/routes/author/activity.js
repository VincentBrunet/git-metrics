
var core = require("../../core");

var serviceRepository = require("../services/repository");
var serviceCommit = require("../services/commit");
var serviceChange = require("../services/change");

var $this = {};

$this.repositoryAuthorsActivity = function (req, next) {
    // Read request inputs
    var repositoryId = core.types.enforceInt(req.params.id, "Repository Id");
    // Lookup repository using id
    serviceRepository.repository(repositoryId, function (success, repository, error) {
        // If we cant find repository
        if (!success) {
            return next(false, undefined, error);
        }
        // Lookup repository authors
        serviceRepository.repositoryContributors(repositoryId, function (success, repositoryContributors, error) {
            // If we cant find contributors
            if (!success) {
                return next(false, undefined, error);
            }
            // Index authors
            var authorsStats = {};
            core.for(repositoryContributors, function (idx, contributor) {
                authorsStats[contributor.id] = {
                    "name": contributor.name,
                };
            });
            // Lookup commits by authors on said repository
            serviceCommit.commitsByAuthors(repositoryId, core.keys(authorsStats), function (success, commitsByAuthors, error) {
                // Could not find commits
                if (!success) {
                    return next(false, undefined, error);
                }
                // Add commits count to stats
                core.for(commitsByAuthors, function (authorId, commitsList) {
                    authorsStats[authorId].commits = core.count(commitsList);
                });
                // Lookup changes by authors on said repository
                serviceChange.changesByAuthors(repositoryId, core.keys(authorsStats), function (success, changesByAuthors, error) {
                    // Could not find changes
                    if (!success) {
                        return next(false, undefined, error);
                    }
                    // Compute stats
                    core.for(changesByAuthors, function (authorId, changesList) {
                        // Stats by authors
                        var filesChanges = 0;
                        var filesAdditions = 0;
                        var filesDeletions = 0;
                        var filesBinaries = 0;
                        var filesNumber = 0;
                        // For each changes
                        core.for(changesList, function (idx, change) {
                            filesChanges += change.changes;
                            filesAdditions += change.additions;
                            filesDeletions += change.deletions;
                            filesBinaries += change.binary;
                            filesNumber += 1;
                        });
                        // Authors changes stats
                        authorsStats[authorId].changes = {
                            "changes": filesChanges,
                            "additions": filesAdditions,
                            "deletions": filesDeletions,
                            "binaries": filesBinaries,
                            "number": filesNumber,
                        };
                    });
                    // Done
                    return next(success, core.values(authorsStats), error);
                });
            });
        });
    });
};

module.exports = $this;
