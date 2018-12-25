
module.exports = function (value, size, pattern) {
    return ("" + value).padStart(size, pattern);
};
