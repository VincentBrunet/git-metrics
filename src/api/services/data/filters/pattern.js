var bb = require("../../../../bb");

module.exports = function (query, column, pattern) {
    if (pattern) {
        pattern = pattern.replace("*", "%");
        query.where(column, "like", pattern);
    }
};
