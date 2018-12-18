
var flowFor = require("../../flow/for");

module.exports = function (array, chunkPredicate) {
    var currentChunk = [];
    var chunks = [];
    flowFor(array, function (idx, element) {
        if (chunkPredicate(idx, element)) {
            if (currentChunk.length > 0) {
                chunks.push(currentChunk);
            }
            currentChunk = [];
        }
        currentChunk.push(element);
    });
    if (currentChunk.length > 0) {
        chunks.push(currentChunk);
    }
    return chunks;
};
