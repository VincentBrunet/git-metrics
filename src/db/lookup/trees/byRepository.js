
var bb = require("../../../bb");

module.exports = async function (repositoryId) {
    // Read all commits from repository
    var query = bb.database.query("git_tree");
    query.where("git_tree.git_repository_id", repositoryId);
    query.leftJoin("git_commit as git_commit_parent", "git_tree.git_commit_id_parent", "git_commit_parent.id");
    query.leftJoin("git_commit as git_commit_child", "git_tree.git_commit_id_child", "git_commit_child.id");
    query.selectAs({
        "git_tree.id": "id",
        "git_commit_parent.id": "git_commit_id_parent",
        "git_commit_child.id": "git_commit_id_child",
    });
    // Execute
    var trees = await bb.database.execute(query);
    // Done
    return trees;
};
