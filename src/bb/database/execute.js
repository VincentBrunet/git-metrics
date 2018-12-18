
var _ = require("lodash");

module.exports = async function __(query) {
    // If its a batch
    if (_.isArray(query)) {
        var datas = [];
        for (var i = 0; i < query.length; i++) {
            datas.push(await __(query[i]));
        }
        return datas;
    }
    // If its a single query
    else {
        var datas = await query._internal;
        if (!_.isArray(datas)) {
            datas = _.values(datas);
        }
        return datas;
    }
};
