
function traverse(context, commit, path, founds) {

    if (commit.parents === undefined) {
        commit.parents = [];
        var trees = context.synced.trees[commit.hash];
        if (trees) {
            for (var i = 0; i < trees.length; i++) {
                var tree = trees[i];
                var parentCommit = context.synced.commits[tree.parent_git_commit_hash];
                if (parentCommit) {
                    commit.parents.push(parentCommit);
                }
            }
        }
    }

    for (var i = 0; i < commit.parents.length; i++) {

    }

}

module.exports = function (context, hash, path) {

    var initialCommit = context.synced.commits[hash];
    if (!initialCommit) {
        console.log("Could not find initial commit", hash);
        return [];
    }

    return traverse(context, initialCommit, path, []);


            // Search over commits to find their file origins
            var commitsToCheck = [parentCommit];
            while (commitsToCheck.length > 0) {
                // Top-most commit check if the file we are looking for is within created things
                var commitToCheck = commitsToCheck.pop();
                var fileFound = filesByAddCommitHashAndPath[commitToCheck.hash + "::" + deletion];
                // Update file record if file was created by this commit
                if (fileFound) {
                    var fileList = filesDeletedByCommitId[parentCommit.id] || [];
                    fileList.push(fileFound.id);
                    filesDeletedByCommitId[parentCommit.id] = fileList;
                }
                // If not, check parents
                else {
                    var parentTrees = treesByChildCommitHash[commitToCheck.hash];
                    if (parentTrees) {
                        for (var i = 0; i < parentTrees.length; i++) {
                            var alsoToCheck = commitsByHash[parentTrees[i].parent_git_commit_hash];
                            if (alsoToCheck) {
                                commitsToCheck.push(alsoToCheck);
                            }
                        }
                    }
                }
            }

};