
var bb = require("./src/bb");

var git = require("./src/git");
var db = require("./src/db");

var api = require("./src/api");

var commandType = process.argv[2];
if (commandType == "API") {
    api.start();
    return;
}

var repositoryPath = process.argv[3];
var repositoryDays = parseInt(process.argv[4]);
var repositoryChunks = parseInt(process.argv[5]);
var repositoryRepeats = parseInt(process.argv[6]) || 1;

console.log("- [Reading history of repository", repositoryPath, "for", repositoryDays, "days]");

async function cycle(path, days, chunks, offset) {

    var url = await git.get.url(path);
    console.log("git.get.url", "->", url);

    var history = await git.get.history(path, days, chunks, offset);
    console.log("git.get.history", "->", history.length, "lines");

    var commits = git.parse.commits(history);
    console.log("git.parse.commits", "->", commits.length, "commits");

    var context = db.sync.context(url, commits);
    console.log("db.sync.context", "->", bb.dict.keys(context));

    var repository = await db.sync.repository(context);
    console.log("db.sync.repository", "->", "[" + repository.id + "]", repository.url);

    var authors = await db.sync.authors(context);
    console.log("db.sync.authors", "->", authors.length, "authors");

    var contributors = await db.sync.contributors(context);
    console.log("db.sync.contributors", "->", contributors.length, "contributors");

    var commits = await db.sync.commits(context);
    console.log("db.sync.commits", "->", commits.length, "commits");

    var trees = await db.sync.trees(context);
    console.log("db.sync.trees", "->", trees.length, "parents");

    var refs = await db.sync.refs(context);
    console.log("db.sync.refs", "->", refs.length, "refs");

    var links = await db.sync.links(context);
    console.log("db.sync.links", "->", links.length, "links");

    var files = await db.sync.files(context);
    console.log("db.sync.files", "->", files.length, "files");

    var changes = await db.sync.changes(context);
    console.log("db.sync.changes", "->", changes.length, "changes");

    var creations = await db.sync.creations(context);
    console.log("db.sync.creations", "->", creations.length, "creations");

    var deletions = await db.sync.deletions(context);
    console.log("db.sync.deletions", "->", deletions.length, "deletions");

    var renames = await db.sync.renames(context);
    console.log("db.sync.renames", "->", renames.length, "renames");

};

async function run() {
    for (var i = 0; i < repositoryRepeats; i++) {
        console.log("- [Start]", i);
        await cycle(repositoryPath, repositoryDays, repositoryChunks, i);
        console.log("- [Done]", i);
    }
}

run();
