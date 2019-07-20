var bb = require("../../../../bb");

module.exports = function (query, column, ids, id) {
    if (id) {
        query.where(column, id);
    }
    if (ids) {
        query.whereIn(column, ids);
    }
};
