var bb = require("../../../../bb");

module.exports = function (query, column, code, codes) {
    if (codes && codes.includes(code)) {
        var obj = {};
        obj[code] = column;
        query.columns(obj);
        query.groupBy(code);
    }
};
