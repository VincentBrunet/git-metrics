
var flowFor = require("../../flow/for");

module.exports = function (dstArray, srcArray) {
    flowFor(srcArray, function (idx, element) {
        dstArray.push(element);
    });
    return dstArray;
};
