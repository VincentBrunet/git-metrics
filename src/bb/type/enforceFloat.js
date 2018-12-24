
module.exports = function (original, label) {
    var value = parseFloat(original);
    if (isNaN(value)) {
        if (label === undefined) {
            throw new Error("" + original + ": is not a valid decimal number");
        }
        else {
            throw new Error("" + label + ": is not a valid decimal number (" + original + ")");
        }
    }
    return value;
};
