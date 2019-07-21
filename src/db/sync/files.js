
var path = require('path')

var bb = require("../../bb");

var lookup = require("../lookup");

module.exports = async function (context) {
    // Lookup Repository
    var syncedRepository = context.synced.repository;
    // Insert files
    var insertedFiles = [];
    // Create all the files
    bb.flow.for(context.parsed.files, function (key, file) {
        // All ready
        insertedFiles.push({
            "git_repository_id": syncedRepository.id,
            "path": file,
            "extension": file.split('.').pop().toLowerCase(),
        });
    });
    // Insert all files
    await bb.database.insert("git_file", insertedFiles, "ignore");
    // Get all files with found signatures
    var files = await lookup.files.byPaths(syncedRepository.id, bb.dict.values(context.parsed.files));
    // Index files by path
    context.synced.files = bb.array.indexBy(files, "path");
    // Return inserteds
    return insertedFiles;
};
