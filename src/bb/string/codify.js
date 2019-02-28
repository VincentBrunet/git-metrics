
// Build collection of things to cut at
var cutableStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789 :;/([])|&*!@#$%\\\t\n'.,?<>~`";
var cutableDict = {};
for (var i = 0; i < cutableStr.length; i++) {
    cutableDict[cutableStr.charAt(i)] = true;
}

// Build collection of characters to keep
var keepableStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789(";
var keepableDict = {};
for (var i = 0; i < keepableStr.length; i++) {
    keepableDict[keepableStr.charAt(i)] = true;
}

// We can keep some small words
var smallWords = {
    "BAD": true,
    "NOT": true,
    "IS": true,
    "AT": true,
    "ID": true,
    "TO": true,
};

module.exports = function (value) {
    // Make sure string
    var str = "" + value;
    // Cut at every possible word
    var part = "";
    var parts = [];
    var cutted = false;
    for (var i = 0; i < str.length; i++) {
        var c = "" + str.charAt(i);
        if (cutableDict[c]) {
            if (part.length > 0 && !cutted) {
                parts.push(part);
                part = "";
            }
            cutted = true;
        }
        else {
            cutted = false;
        }
        if (keepableDict[c]) {
            part += c;
        }
    }
    parts.push(part);
    // Select what to keep
    var kept = [];
    for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        if (part.indexOf("(") != -1) {
            break;
        }
        if (smallWords[part.toUpperCase()] || part.length > 3) {
            kept.push(part);
        }
    }
    // Done
    return kept.join("_");
};
