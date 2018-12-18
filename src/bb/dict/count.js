
var flowFor = require("../flow/for");

module.exports = function (dict) {
    var c = 0;
    flowFor(dict, function (key, value) {
        c++;
    });
    return c;
};
