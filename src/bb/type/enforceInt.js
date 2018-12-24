
module.exports = function (original, label) {
    var value = parseInt(original);
    if (isNaN(value)) {
        if (label === undefined) {
            throw new Error("" + original + ": is not a valid integer");
        }
        else {
            throw new Error("" + label + ": is not a valid integer (" + original + ")");
        }
    }
    return value;
};
