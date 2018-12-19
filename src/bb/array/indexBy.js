
var _ = require("lodash");

module.exports = function (array, key) {
    var index = {};
    if (_.isString(key)) {
        for (var i = 0; i < array.length; i++) {
            index[array[i][key]] = array[i];
        }
    }
    if (_.isFunction(key)) {
        for (var i = 0; i < array.length; i++) {
            index[key(array[i])] = array[i];
        }
    }
    return index;
};
