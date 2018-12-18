
var _ = require("lodash");

module.exports = async function __(query) {
    // If its a batch
    if (_.isArray(query)) {
        var datasCombined = [];
        for (var i = 0; i < query.length; i++) {
            var datas = await __(query[i]);
            for (var j = 0; j < datas.length; j++) {
                datasCombined.push(datas[j]);
            }
        }
        return datasCombined;
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
