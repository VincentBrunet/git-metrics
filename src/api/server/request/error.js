var bb = require("../../../bb");

module.exports = function __(error) {
    // Base error object
    var results = {
        name: error && error.constructor && error.constructor.name,
        message: error && error.message,
        stack: [],
    };
    // If its an exception
    if (bb.type.isError(error)) {
        results.name = error.name;
        results.message = error.message;
        results.stack = error.stack.split("\n");
        if (error.extra) {
            results.extra = __(error.extra);
        }
    }
    // Add a recap code
    results.code = bb.string.codify(results.name).toUpperCase()
        + ":" + bb.string.codify(results.message).toUpperCase();
    // Done
    return results;
};
