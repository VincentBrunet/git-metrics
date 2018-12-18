
var _ = require("lodash");

module.exports = async function (query) {
    var datas = await query._internal;
    if (!_.isArray(datas)) {
        datas = _.values(datas);
    }
    return datas;
};
