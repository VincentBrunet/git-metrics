
var bb = require("../../../bb");

module.exports = async function (repositoryId) {
    // Read all commits from repository
    var query = bb.database.query("git_tree");
    query.where("git_tree.git_repo_id", repositoryId);
    query.leftJoin("git_commit as parent_git_commit", "git_tree.parent_git_commit_id", "parent_git_commit.id");
    query.leftJoin("git_commit as child_git_commit", "git_tree.child_git_commit_id", "child_git_commit.id");
    query.selectAs({
        "git_tree.id": "id",
        "parent_git_commit.id": "parent_git_commit_id",
        "parent_git_commit.hash": "parent_git_commit_hash",
        "parent_git_commit.time": "parent_git_commit_time",
        "child_git_commit.id": "child_git_commit_id",
        "child_git_commit.hash": "child_git_commit_hash",
        "child_git_commit.time": "child_git_commit_time",
    });
    // Execute
    var trees = await bb.database.execute(query);
    // Done
    return trees;
};
