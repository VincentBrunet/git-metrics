
var bb = require("../../bb");

var thisAuthors = require("./authors");
var thisCommits = require("./commits");
var thisFilesChanges = require("./filesChanges");
var thisFilesDeletions = require("./filesDeletions");
var thisFilesInsertions = require("./filesInsertions");
var thisFilesRenames = require("./filesRenames");
var thisLinks = require("./links");
var thisRefs = require("./refs");
var thisRepository = require("./repository");
var thisTree = require("./tree");

module.exports = async function (repositoryUrl, commitsList) {

    // Step 1 - Make sure repository exists
    var repository = await thisRepository(repositoryUrl);
    console.log("thisRepository", repository.id);

    // Step 2 - Make sure all authors exists
    var authorsBySignatures = await thisAuthors(repository, commitsList);
    console.log("thisAuthors", bb.dict.count(authorsBySignatures));

    // Step 3 - Make sure all commits exists
    var commitsByHash = await thisCommits(repository, authorsBySignatures, commitsList);
    console.log("thisCommits", bb.dict.count(commitsByHash));

    // Step 4.1 - Make sure all commit parenting is created
    var treeResults = await thisTree(repository, commitsByHash, commitsList);
    console.log("thisTree", treeResults.length);
    // Step 4.2 - Make sure all refs are created
    var refsResults = await thisRefs(repository, commitsByHash, commitsList);
    console.log("thisRefs", refsResults.length);
    // Step 4.3 - Make sure all links are created
    var linksResults = await thisLinks(repository, commitsByHash, commitsList);
    console.log("thisLinks", linksResults.length);

    // Step 5.1 - Make sure all file are created with the creation commit
    var filesInsertionsResults = await thisFilesInsertions(repository, commitsByHash, commitsList);
    console.log("thisFilesInsertions", filesInsertionsResults.length);
    // Step 5.2 - Make sure files are marked deleted when commit are deleting them
    var filesDeletionsResults = await thisFilesDeletions(repository, commitsByHash, commitsList);
    console.log("thisFilesDeletions", filesDeletionsResults.length);
    // Step 5.3 - Make sure renaming are saved when a commit renames a file
    var filesRenamesResults = await thisFilesRenames(repository, commitsByHash, commitsList);
    console.log("thisFilesRenames", filesRenamesResults.length);
    // Step 5.4 - Make sure line changes are saved
    var filesChangesResults = await thisFilesChanges(repository, authorsBySignatures, commitsByHash, commitsList);
    console.log("thisFilesChanges", filesChangesResults.length);

};
