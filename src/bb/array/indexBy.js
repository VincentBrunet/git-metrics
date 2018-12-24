
var typeIsString = require("../type/isString");
var typeIsFunction = require("../type/isFunction");

module.exports = function (array, key) {
    var index = {};
    if (typeIsString(key)) {
        for (var i = 0; i < array.length; i++) {
            index[array[i][key]] = array[i];
        }
    }
    if (typeIsFunction(key)) {
        for (var i = 0; i < array.length; i++) {
            index[key(array[i])] = array[i];
        }
    }
    return index;
};
