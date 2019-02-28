
module.exports = function (name, message, extra) {
    var error = new Error(message);
    error.name = name;
    error.extra = extra;
    return error;
};
