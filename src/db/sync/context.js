
var bb = require("../../bb");

module.exports = function (url, commits) {
    // Base object
    var context = {
        parsed: {
            url: url,
            commits: commits,
            authors: {},
            refs: {},
            paths: {},
        },
        synced: {
            repository: {
                id: null,
                url: null,
            },
            authors: {},
            commits: {},
            refs: {},
        },
    };
    // Commits content indexing
    bb.flow.for(context.parsed.commits, function (idx, commit) {
        // Index all author by signatures
        context.parsed.authors[commit.author.signature] = commit.author;
        // Index all ref by values
        bb.flow.for(commit.refs, function (idx, value) {
            context.parsed.refs[value] = value;
        });
        // List changed paths
        bb.flow.for(commit.changes, function (idx, change) {
            context.parsed.paths[change.path] = true;
        });
        bb.flow.for(commit.additions, function (idx, addition) {
            context.parsed.paths[addition] = true;
        });
        bb.flow.for(commit.deletions, function (idx, deletion) {
            context.parsed.paths[deletion] = true;
        });
        bb.flow.for(commit.renames, function (idx, rename) {
            context.parsed.paths[rename.before] = true;
            context.parsed.paths[rename.after] = true;
        });
    });
    // Done
    return context;
};
