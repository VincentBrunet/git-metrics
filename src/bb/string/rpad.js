
module.exports = function (value, size, pattern) {
    return ("" + value).padEnd(size, pattern);
};
