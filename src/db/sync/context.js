
var bb = require("../../bb");

module.exports = function (repository, commits) {
    // Base object
    var context = {
        parsed: {
            repository: repository,
            commits: commits,
            authors: {},
            refs: {},
            files: {},
        },
        synced: {
            repository: null,
            commits: {},
            authors: {},
            refs: {},
            files: {},
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
        // List changed files
        bb.flow.for(commit.changes, function (idx, change) {
            context.parsed.files[change.path] = change.path;
        });
        bb.flow.for(commit.creations, function (idx, creation) {
            context.parsed.files[creation] = creation;
        });
        bb.flow.for(commit.deletions, function (idx, deletion) {
            context.parsed.files[deletion] = deletion;
        });
        bb.flow.for(commit.renames, function (idx, rename) {
            context.parsed.files[rename.before] = rename.before;
            context.parsed.files[rename.after] = rename.after;
        });
    });
    // Done
    return context;
};
