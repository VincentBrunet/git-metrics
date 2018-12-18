
var bb = require("../../../bb");

module.exports = async function (repositoryId, refsValues) {
    // Batch ref reading
    var batch = bb.database.batch("git_ref", refsValues, function (query, chunk) {
        query.where("git_ref.git_repo_id", repositoryId);
        query.whereIn("value", chunk);
        query.select(["id", "value"]);
    });
    // Batch queries and combine all results
    var refs = await bb.database.execute(batch);
    // Index ref by email
    var refsByValue = {};
    bb.flow.for(refs, function (idx, ref) {
        refsByValue[ref.value] = ref;
    });
    // Done
    return refsByValue;
};
