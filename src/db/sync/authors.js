
var lookup = require("../lookup");

var bb = require("../../bb");

module.exports = async function (context) {
    // List all authors to be inserted
    var insertedAuthors = [];
    bb.flow.for(context.parsed.authors, function (key, parsedAuthor) {
        insertedAuthors.push({
            signature: parsedAuthor.signature,
            name: parsedAuthor.name,
            email: parsedAuthor.email,
        });
    });
    // Insert all authors, or ignore if already there
    await bb.database.insert("git_author", insertedAuthors, "ignore");
    // Get all authors with found signatures
    var authors = await lookup.authors.bySignatures(bb.dict.keys(context.parsed.authors));
    // Index authors by signature
    context.synced.authors = bb.array.indexBy(authors, "signature");
    // Done
    return insertedAuthors;
};
