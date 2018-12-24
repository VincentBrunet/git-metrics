
var bb = require("./src/bb");

var git = require("./src/git");
var db = require("./src/db");

var commandType = process.argv[2];
if (commandType == "API") {
    var apiRun = require("./src/api/run");
    apiRun.start("127.0.0.1", 8080);
    return;
}

var repositoryPath = process.argv[3];
var repositoryDays = parseInt(process.argv[4]);

console.log("Reading history of repository", repositoryPath, "for", repositoryDays, "days");

async function run(path, days) {

    // GIT - URL
    var url = await git.get.url(path);
    console.log("git.get.url", "->", url);

    // GIT - HISTORY
    var history = await git.get.history(path, days);
    console.log("git.get.history", "->", history.length, "lines");

    // GIT - COMMITS
    var commits = git.parse.commits(history);
    console.log("git.parse.commits", "->", commits.length, "commits");

    // Step 0 - Prepare sync context
    var context = db.sync.context(url, commits);
    console.log("db.sync.context", "->", bb.dict.keys(context));

    // Step 1 - Make sure repository exists
    var repository = await db.sync.repository(context);
    console.log("db.sync.repository", "->", "[" + repository.id + "]", repository.url);

    // Step 2.1 - Make sure all authors exists
    var authors = await db.sync.authors(context);
    console.log("db.sync.authors", "->", authors.length, "authors");
    // Step 2.2 - Make sure all contributors exists
    var contributors = await db.sync.contributors(context);
    console.log("db.sync.contributors", "->", contributors.length, "contributors");

    // Step 3 - Make sure all commits exists
    var commits = await db.sync.commits(context);
    console.log("db.sync.commits", "->", commits.length, "commits");

    // Step 4 - Make sure all commit parenting is created
    var trees = await db.sync.trees(context);
    console.log("db.sync.trees", "->", trees.length, "parents");

    // Step 5.1 - Make sure all refs are created
    var refs = await db.sync.refs(context);
    console.log("db.sync.refs", "->", refs.length, "refs");
    // Step 5.2 - Make sure all links are created
    var links = await db.sync.links(context);
    console.log("db.sync.links", "->", links.length, "links");

    // Step 6.1 - Make sure all file are created with the creation commit
    var filesInsertions = await db.sync.filesInsertions(context);
    console.log("db.sync.filesInsertions", "->", filesInsertions.length, "insertions");
    // Step 6.2 - Make sure files are marked deleted when commit are deleting them
    var filesDeletions = await db.sync.filesDeletions(context);
    console.log("db.sync.filesDeletions", "->", filesDeletions.length, "deletions");
    // Step 6.3 - Make sure renaming are saved when a commit renames a file
    var filesRenames = await db.sync.filesRenames(context);
    console.log("db.sync.filesRenames", "->", filesRenames.length, "renames");
    // Step 6.4 - Make sure line changes are saved
    var filesChanges = await db.sync.filesChanges(context);
    console.log("db.sync.filesChanges", "->", filesChanges.length, "changes");

};

run(repositoryPath, repositoryDays);
