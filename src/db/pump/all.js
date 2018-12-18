
var thisAuthors = require("./authors");
var thisCommits = require("./commits");
var thisFilesChanges = require("./filesChanges");
var thisFilesDeletions = require("./filesDeletions");
var thisFilesInsertions = require("./filesInsertions");
var thisFilesRenames = require("./filesRenames");
var thisRepository = require("./repository");
var thisTree = require("./tree");

module.export = async function (repositoryUrl, commitsList) {
    console.log("All", repositoryUrl, commitsList.length);
    var repository = await thisRepository(repositoryUrl);
    console.log("thisRepository", repository.id);
    var authorsByName = await thisAuthors(repository, commitsList);
    console.log("thisAuthors", bb.dict.count(authorsByName));
    var commitsByHash = await thisCommits(repository, authorsByName, commitsList);
    console.log("thisCommits", bb.dict.count(commitsByHash));
    var treeResults = await thisTree(repository, commitsByHash, commitsList);
    console.log("thisTree", treeResults);
    var filesInsertionsResults = await thisFilesInsertions(repository, commitsByHash, commitsList);
    console.log("thisFilesInsertions", filesInsertionsResults);
    var filesDeletionsResults = await thisFilesDeletions(repository, commitsByHash, commitsList);
    console.log("thisFilesDeletions", filesDeletionsResults);
    var filesRenamesResults = await thisFilesRenames(repository, commitsByHash, commitsList);
    console.log("thisFilesRenames", filesRenamesResults);
    var filesChangesResults = await thisFilesChanges(repository, authorsByName, commitsByHash, commitsList
    console.log("thisFilesChanges", filesChangesResults);
};
