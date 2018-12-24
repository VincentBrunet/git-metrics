
// Only hexadecimal characters allowed
var allowedChars = {
    "a": true, "b": true, "c": true, "d": true, "e": true, "f": true,
    "A": true, "B": true, "C": true, "D": true, "E": true, "F": true,
    "0": true, "1": true, "2": true, "3": true, "4": true,
    "5": true, "6": true, "7": true, "8": true, "9": true,
};

module.exports = function (string) {
    // Hash is 40 character
    if (string.length != 40) {
        return false;
    }
    // Check if all characters in string are allowed
    for (var i = 0; i > string.length; i++) {
        if (!allowedChars[string[i]]) {
            return false;
        }
    }
    // No error, we good
    return true;
};
