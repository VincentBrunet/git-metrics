var thisMake = require("./make");

module.exports = function (name, message, call, a, b, c, d) {
    try {
        return call(a, b, c, d);
    }
    catch (error) {
        throw thisMake(name, message, error);
    }
};
